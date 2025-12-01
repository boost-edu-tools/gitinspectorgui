pub use crate::shared_types::*;

use globset::{GlobBuilder, GlobMatcher};
use std::path::{Path, PathBuf};
use std::{
    collections::{HashMap, HashSet},
    fs::File as FsFile,
    io::{BufRead, BufReader},
    process::Command,
    str,
};

/// This function builds the git log arguments based on the provided AnalysisParameters
fn build_git_log_args(params: &AnalysisParameters) -> Result<Vec<String>, String> {
    // Disallow mixing commit-range and time-range parameters
    let has_commit_range = params.from_commit.is_some() || params.to_commit.is_some();
    let has_time_range = params.from_time.is_some() || params.to_time.is_some();
    if has_commit_range && has_time_range {
        return Err(
            "Cannot mix commit-range and time-range parameters in git log args".to_string(),
        );
    }

    let mut args: Vec<String> = Vec::new();
    args.push("log".to_string());

    // If both from_commit and to_commit specified, add as range
    if let (Some(from), Some(to)) = (&params.from_commit, &params.to_commit) {
        let range = format!("{}..{}", from, to);
        args.push(range);
    }

    args.push("--pretty=format:%h / %an <%ae> / %ad / %s".to_string());
    args.push("--date=iso".to_string());
    args.push("--numstat".to_string());

    // Time stamps should be in ISO 8601 format: "YYYY-MM-DDTHH:MM:SS+HHMM"
    if let Some(start) = &params.from_time {
        args.push(format!("--since={}", start));
    }
    if let Some(end) = &params.to_time {
        args.push(format!("--until={}", end));
    }

    Ok(args)
}

/// Parse a git log header line of the form:
/// "<short-hash> / <author name> <email> / <date> / <message>"
/// Returns Ok((hash, author_name, author_email, date, time, timezone, message)) on success
/// or Err(String) when the header does not match the expected format.
fn parse_commit_header(
    header: &str,
) -> Result<(String, String, String, String, String, String, String), String> {
    // Validate we have exactly four parts after splitting
    let parts_vec: Vec<&str> = header.splitn(4, " / ").collect();
    if parts_vec.len() != 4 {
        return Err(format!(
            "Commit header does not contain 4 parts separated by ' / ': '{}'",
            header
        ));
    }

    let hash = parts_vec[0].trim().to_string();
    let author_str = parts_vec[1].trim().to_string();
    let date_full = parts_vec[2].trim().to_string();
    let message = parts_vec[3].trim().to_string();

    // split into date, time, timezone where possible
    let mut date = String::new();
    let mut time = String::new();
    let mut timezone = String::new();
    let date_parts: Vec<&str> = date_full.split_whitespace().collect();
    if !date_parts.is_empty() {
        date = date_parts.get(0).unwrap_or(&"").to_string();
    }
    if date_parts.len() > 1 {
        time = date_parts.get(1).unwrap_or(&"").to_string();
    }
    if date_parts.len() > 2 {
        timezone = date_parts.get(2).unwrap_or(&"").to_string();
    }

    // Parse author name and email
    let (author_name, author_email) = if let Some(start) = author_str.find('<') {
        let end = author_str.find('>').unwrap_or(author_str.len());
        (
            author_str[..start].trim().to_string(),
            author_str[start + 1..end].trim().to_string(),
        )
    } else {
        (author_str.clone(), String::new())
    };

    Ok((
        hash,
        author_name,
        author_email,
        date,
        time,
        timezone,
        message,
    ))
}

/// Parse a single file change line from git --numstat output.
/// Expected format: "<insertions>\t<deletions>\t<path>". Insertions/deletions may be "-" for binaries.
/// Returns Ok((insertions, deletions, path)) on success, or Err(String) when the line is malformed.
fn parse_file_line(line: &str) -> Result<(usize, usize, String), String> {
    let parts: Vec<&str> = line.split('\t').collect();
    if parts.len() != 3 {
        return Err(format!(
            "Malformed numstat line (expected 3 tab parts): '{}'",
            line
        ));
    }

    let ins_str = parts[0].trim();
    let del_str = parts[1].trim();
    let path_str = parts[2].trim();

    if path_str.is_empty() {
        return Err(format!("Malformed numstat line: path is empty: '{}'", line));
    }

    let ins = if ins_str == "-" {
        0
    } else {
        ins_str.parse::<usize>().unwrap_or(0)
    };
    let del = if del_str == "-" {
        0
    } else {
        del_str.parse::<usize>().unwrap_or(0)
    };

    Ok((ins, del, path_str.to_string()))
}

/// Ensure an Author entry exists in the map and update it with the given commit hash and files.
/// Returns the author's id.
fn update_author(
    author_map: &mut HashMap<(String, String), Author>,
    author_name: &str,
    author_email: &str,
    hash: &str,
    files_changed: &Vec<(usize, Metrics)>,
    next_author_id: &mut usize,
    date: &str,
    time: &str,
    timezone: &str,
) -> usize {
    let key = (author_name.to_string(), author_email.to_string());
    let author_entry = author_map.entry(key).or_insert_with(|| {
        let id = *next_author_id;
        *next_author_id += 1;
        Author {
            id,
            name: author_name.to_string(),
            email: author_email.to_string(),
            commit_hashes: Vec::new(),
            files: Vec::new(),
            last_modified_date: String::new(),
            last_modified_time: String::new(),
            last_modified_timezone: String::new(),
            metrics: Metrics::default(),
        }
    });

    // Add this commit hash to the author's commit list if not already present
    if !author_entry.commit_hashes.contains(&hash.to_string()) {
        author_entry.commit_hashes.push(hash.to_string());
    }

    // Update last modified info if this commit is newer than stored value.
    // Git log returns newest->oldest, so the first time we see an author we should
    // set their last_modified_* fields. For safety also update if the provided
    // timestamp is lexicographically greater.
    let incoming_ts = format!("{} {} {}", date, time, timezone);
    let existing_ts = format!(
        "{} {} {}",
        author_entry.last_modified_date,
        author_entry.last_modified_time,
        author_entry.last_modified_timezone
    );
    if author_entry.last_modified_date.is_empty() || incoming_ts > existing_ts {
        author_entry.last_modified_date = date.to_string();
        author_entry.last_modified_time = time.to_string();
        author_entry.last_modified_timezone = timezone.to_string();
    }

    // Add or update per-file metrics for this author
    for (file_id, file_metrics) in files_changed {
        // try to find existing entry
        let mut found = false;
        for (existing_id, existing_metrics) in &mut author_entry.files {
            if existing_id == file_id {
                // sum insertions/deletions
                let sum_ins = existing_metrics
                    .insertions
                    .unwrap_or(0)
                    .saturating_add(file_metrics.insertions.unwrap_or(0));
                let sum_del = existing_metrics
                    .deletions
                    .unwrap_or(0)
                    .saturating_add(file_metrics.deletions.unwrap_or(0));
                existing_metrics.insertions = Some(sum_ins);
                existing_metrics.deletions = Some(sum_del);
                found = true;
                break;
            }
        }
        if !found {
            author_entry.files.push((*file_id, file_metrics.clone()));
        }
    }

    // Recalculate aggregate metrics for the author (simple sum across files)
    let mut total_ins: usize = 0;
    let mut total_del: usize = 0;
    for (_fid, m) in &author_entry.files {
        total_ins = total_ins.saturating_add(m.insertions.unwrap_or(0));
        total_del = total_del.saturating_add(m.deletions.unwrap_or(0));
    }
    author_entry.metrics.insertions = Some(total_ins);
    author_entry.metrics.deletions = Some(total_del);
    author_entry.metrics.total_files = Some(author_entry.files.len());

    author_entry.id
}

/// Ensure a File entry exists in the map (keyed by full path) and update its metrics and
/// last modified info. Returns the file id.
fn update_file(
    file_map: &mut HashMap<String, File>,
    path: &str,
    metrics: &Metrics,
    date: &str,
    time: &str,
    timezone: &str,
    next_file_id: &mut usize,
) -> usize {
    if let Some(existing) = file_map.get_mut(path) {
        // Update metrics
        let sum_ins = existing
            .metrics
            .insertions
            .unwrap_or(0)
            .saturating_add(metrics.insertions.unwrap_or(0));
        let sum_del = existing
            .metrics
            .deletions
            .unwrap_or(0)
            .saturating_add(metrics.deletions.unwrap_or(0));
        existing.metrics.insertions = Some(sum_ins);
        existing.metrics.deletions = Some(sum_del);

        // Update last modified if incoming is newer
        let incoming_ts = format!("{} {} {}", date, time, timezone);
        let existing_ts = format!(
            "{} {} {}",
            existing.last_modified_date,
            existing.last_modified_time,
            existing.last_modified_timezone
        );
        if existing.last_modified_date.is_empty() || incoming_ts > existing_ts {
            existing.last_modified_date = date.to_string();
            existing.last_modified_time = time.to_string();
            existing.last_modified_timezone = timezone.to_string();
        }

        existing.id
    } else {
        let id = *next_file_id;
        *next_file_id += 1;
        let filename = path.split('/').last().unwrap_or("");
        let extension = if filename.contains('.') {
            filename.rsplitn(2, '.').next().unwrap_or("").to_string()
        } else {
            String::new()
        };
        let mut new_metrics = Metrics::default();
        new_metrics.insertions = metrics.insertions;
        new_metrics.deletions = metrics.deletions;

        let f = File {
            id,
            name: filename.to_string(),
            extension,
            path: path.to_string(),
            file_size: Some(0),
            lines: vec![],
            metrics: new_metrics,
            last_modified_date: date.to_string(),
            last_modified_time: time.to_string(),
            last_modified_timezone: timezone.to_string(),
        };
        file_map.insert(path.to_string(), f);
        id
    }
}

/// Build and verify a GlobBuilder for the given pattern.
/// This creates a temporary builder and attempts to `build()` it to verify the
/// pattern is valid. If validation succeeds, a new configured `GlobBuilder`
/// is returned to the caller. The returned builder has case-insensitive matching
/// enabled and uses the provided `literal_separator` setting.
pub(crate) fn glob_matcher_builder(
    pattern: &str,
    literal_separator: bool,
) -> Result<GlobMatcher, String> {
    // Configure a builder and attempt to build & compile it to validate the pattern.
    match GlobBuilder::new(pattern)
        .case_insensitive(true)
        .literal_separator(literal_separator)
        .build()
    {
        Ok(glob) => Ok(glob.compile_matcher()),
        Err(e) => Err(format!("Invalid glob pattern '{}': {}", pattern, e)),
    }
}

/// Build glob matchers for the four supported filters from AnalysisParameters.
/// Returns a vector of length 4 where each element corresponds to:
/// [commit_hash_filter, commit_message_filter, file_types_filter, path_filter]
/// Each element is Some(GlobMatcher) if the filter was present and successfully
/// compiled, or None if the filter was not set. If any present filter has an
/// invalid pattern the function returns an Err with a descriptive message.
pub fn build_glob_matchers_from_params(
    params: &AnalysisParameters,
) -> Result<Vec<Option<GlobMatcher>>, String> {
    let mut out: Vec<Option<GlobMatcher>> = Vec::with_capacity(4);

    // commit_hash_filter (case-insensitive, literal_separator = false)
    if let Some(filter) = &params.commit_hash_filter {
        let m = glob_matcher_builder(&filter.value, false)?;
        out.push(Some(m));
    } else {
        out.push(None);
    }

    // commit_message_filter (case-insensitive, literal_separator = false)
    if let Some(filter) = &params.commit_message_filter {
        let m = glob_matcher_builder(&filter.value, false)?;
        out.push(Some(m));
    } else {
        out.push(None);
    }

    // Author name filter (case-insensitive, literal_separator = false)
    if let Some(filter) = &params.author_name_filter {
        let m = glob_matcher_builder(&filter.value, false)?;
        out.push(Some(m));
    } else {
        out.push(None);
    }

    // Author email filter (case-insensitive, literal_separator = false)
    if let Some(filter) = &params.author_email_filter {
        let m = glob_matcher_builder(&filter.value, false)?;
        out.push(Some(m));
    } else {
        out.push(None);
    }
    
    // file_types_filter (case-insensitive, literal_separator = false)
    if let Some(filter) = &params.file_types_filter {
        let m = glob_matcher_builder(&filter.value, false)?;
        out.push(Some(m));
    } else {
        out.push(None);
    }

    // path_filter (case-insensitive, literal_separator = true)
    if let Some(filter) = &params.path_filter {
        let m = glob_matcher_builder(&filter.value, true)?;
        out.push(Some(m));
    } else {
        out.push(None);
    }

    Ok(out)
}

/// This function analyses a git repository between two commit hashes or time stamps.
/// If from_commit is None, analysis starts from the first commit.
/// If to_commit is None, analysis goes up to the latest commit.
/// If from_time or to_time are specified, they are used instead of commit hashes.
/// It returns an AnalysisResult containing the parsed commits, authors, and files.
/// Files are just fetched, not processed by the analysis. This functionality is handled by analyse_blames()
pub(crate) fn analyse_repository(params: &AnalysisParameters) -> Result<Repository, String> {
    // Resolve repo path
    let repo = Path::new(&params.repo_path);

    // Run git log to get commit info and changed files, separated by empty lines
    // We define a custom format to make parsing easier
    // This format is: short hash / author name <email> / date / message
    // Followed by the list of changed files, one per line

    // Build the Git Log command args
    let args = match build_git_log_args(params) {
        Ok(a) => a,
        Err(e) => return Err(e),
    };

    // Run the command
    let output = Command::new("git")
        .current_dir(repo)
        .args(&args)
        .output()
        .expect("Failed to run git log");

    if output.status.success() {
        let stdout = str::from_utf8(&output.stdout).unwrap();
        let commit_strings: Vec<&str> = stdout
            .split("\n\n")
            .filter(|s| !s.trim().is_empty())
            .collect();

        // Keep track of all commits
        let mut commits = Vec::new();

        // Use a map keyed by (name, email) so we can update existing authors with additional commits/files
        let mut author_map: HashMap<(String, String), Author> = HashMap::new();

        // Use a map keyed by file_path so we can update existing files with additional metrics
        let mut file_map: HashMap<String, File> = HashMap::new();

        // Build filter matchers from params. This will return a Vec<Option<GlobMatcher>>
        // in the order: [commit_hash, commit_message, file_types, path]. If any
        // provided filter pattern is invalid we propagate the error.
        let matchers = match build_glob_matchers_from_params(params) {
            Ok(m) => m,
            Err(e) => return Err(e),
        };

        let mut next_author_id = 1; // incremental id for authors
        let mut next_commit_id = 1; // incremental id for commits
        let mut next_file_id = 1; // incremental id for files

        for commit_str in commit_strings {
            // For each commit message, split into header and file changes
            let mut lines = commit_str.lines();

            // Checks that there is at least a header line
            if let Some(header) = lines.next() {
                // Parsing the header line using helper to keep the loop clean
                let (hash, author_name, author_email, date, time, timezone, message) =
                    match parse_commit_header(header) {
                        Ok(t) => t,
                        Err(e) => {
                            return Err(format!(
                                "Failed to parse commit header '{}' : {}",
                                header, e
                            ));
                        }
                    };

                // Check commit-hash filter (if present) and apply include/exclude semantics.
                // matchers[0] corresponds to commit_hash_filter.
                if let Some(matcher_opt) = matchers.get(0) {
                    if let Some(matcher) = matcher_opt {
                        if let Some(filter) = &params.commit_hash_filter {
                            let is_match = matcher.is_match(&hash);
                            if filter.include {
                                // include=true -> only keep commits that match
                                if !is_match {
                                    continue;
                                }
                            } else {
                                // include=false -> exclude commits that match
                                if is_match {
                                    continue;
                                }
                            }
                        }
                    }
                }

                // Check commit-message filter (if present) and apply include/exclude semantics.
                // matchers[1] corresponds to commit_message_filter.
                if let Some(matcher_opt) = matchers.get(1) {
                    if let Some(matcher) = matcher_opt {
                        if let Some(filter) = &params.commit_message_filter {
                            let is_match = matcher.is_match(&message);
                            if filter.include {
                                // include=true -> only keep commits whose message matches
                                if !is_match {
                                    continue;
                                }
                            } else {
                                // include=false -> exclude commits whose message matches
                                if is_match {
                                    continue;
                                }
                            }
                        }
                    }
                }

                // Check author name filter (if present) and apply include/exclude semantics.
                // matchers[2] corresponds to author_name_filter.
                if let Some(matcher_opt) = matchers.get(2) {
                    if let Some(matcher) = matcher_opt {
                        if let Some(filter) = &params.author_name_filter {
                            let is_match = matcher.is_match(&author_name);
                            if filter.include {
                                // include=true -> only keep commits whose author name matches
                                if !is_match {
                                    continue;
                                }
                            } else {
                                // include=false -> exclude commits whose author name matches
                                if is_match {
                                    continue;
                                }
                            }
                        }
                    }
                }

                // Check author email filter (if present) and apply include/exclude semantics.
                // Matchers[3] corresponds to author_email_filter.
                if let Some(matcher_opt) = matchers.get(3) {
                    if let Some(matcher) = matcher_opt {
                        if let Some(filter) = &params.author_email_filter {
                            let is_match = matcher.is_match(&author_email);
                            if filter.include {
                                // include=true -> only keep commits whose author email matches
                                if !is_match {
                                    continue;
                                }
                            } else {
                                // include=false -> exclude commits whose author email matches
                                if is_match {
                                    continue;
                                }
                            }
                        }
                    }
                }

                // Keep track of commit level statistics when looping through files
                // We collect (file_id, Metrics) tuples for the commit
                let mut files_changed: Vec<(usize, Metrics)> = Vec::new();
                let mut commit_insertions: usize = 0;
                let mut commit_deletions: usize = 0;
                let mut commit_total_files: usize = 0;

                for raw in lines {
                    let line = raw.trim();

                    if line.is_empty() {
                        continue;
                    }

                    // Parse files and --numstat entries. numstat lines look like:
                    // "<insertions>\t<deletions>\t<path>". Insertions/deletions may be "-" for binaries.
                    match parse_file_line(line) {
                        Ok((ins, del, path)) => {
                            // Apply file types filter (if present). matchers[4] corresponds to file_types_filter
                            if let Some(matcher_opt) = matchers.get(4) {
                                if let Some(matcher) = matcher_opt {
                                    if let Some(filter) = &params.file_types_filter {
                                        // Extract extension from the filename and add a leading dot
                                        // so matchers expecting ".rs" or ".gitignore" will match.
                                        let filename = path.split('/').last().unwrap_or("");
                                        let ext = if filename.contains('.') {
                                            format!(
                                                ".{}",
                                                filename.rsplitn(2, '.').next().unwrap_or("")
                                            )
                                        } else {
                                            String::new()
                                        };
                                        let is_match = matcher.is_match(&ext);
                                        if filter.include {
                                            // include=true -> only keep files whose extension matches
                                            if !is_match {
                                                continue;
                                            }
                                        } else {
                                            // include=false -> exclude files whose extension matches
                                            if is_match {
                                                continue;
                                            }
                                        }
                                    }
                                }
                            }

                            // Apply path filter (if present). matchers[5] corresponds to path_filter
                            if let Some(matcher_opt) = matchers.get(5) {
                                if let Some(matcher) = matcher_opt {
                                    if let Some(filter) = &params.path_filter {
                                        // Use the full file path for path matching
                                        let is_match = matcher.is_match(&path);
                                        if filter.include {
                                            // include=true -> only keep files whose path matches
                                            if !is_match {
                                                continue;
                                            }
                                        } else {
                                            // include=false -> exclude files whose path matches
                                            if is_match {
                                                continue;
                                            }
                                        }
                                    }
                                }
                            }

                            // Add to commit-level metrics
                            commit_total_files = commit_total_files.saturating_add(1);
                            commit_insertions = commit_insertions.saturating_add(ins);
                            commit_deletions = commit_deletions.saturating_add(del);

                            // Create file metrics
                            let mut file_metrics = Metrics::default();
                            file_metrics.insertions = Some(ins);
                            file_metrics.deletions = Some(del);

                            // Ensure file exists in file_map and get its id (updates file_map metrics)
                            let file_id = update_file(
                                &mut file_map,
                                &path,
                                &file_metrics,
                                &date,
                                &time,
                                &timezone,
                                &mut next_file_id,
                            );

                            // Add to files changed list as (file_id, metrics)
                            files_changed.push((file_id, file_metrics));
                        }
                        Err(_e) => {
                            // Skip malformed file lines and continue parsing other files in this commit.
                            continue;
                        }
                    }
                }

                // Check if commit has any files after filtering, if not, skip this commit
                if files_changed.is_empty() {
                    continue;
                }

                // Ensure an Author entry exists (or update existing) and get the author id.
                let author_id = update_author(
                    &mut author_map,
                    &author_name,
                    &author_email,
                    &hash,
                    &files_changed,
                    &mut next_author_id,
                    &date,
                    &time,
                    &timezone,
                );

                // Create commit metrics
                let mut metrics = Metrics::default();
                metrics.insertions = Some(commit_insertions);
                metrics.deletions = Some(commit_deletions);
                metrics.total_files = Some(commit_total_files);

                // Move parsed values into the commits vector
                commits.push(Commit {
                    id: next_commit_id,
                    hash,
                    author_id: author_id,
                    date: date.clone(),
                    time: time.clone(),
                    timezone: timezone.clone(),
                    message,
                    files_changed,
                    metrics,
                });

                next_commit_id += 1;
            }
        }

        // Reassign commit ids so the oldest commit receives id=1.
        // Git log returns commits newest->oldest, so we map the last element to id=1.
        let total_commits = commits.len();
        for (i, commit) in commits.iter_mut().enumerate() {
            commit.id = total_commits.saturating_sub(i);
        }

        // Build the Repository and AnalysisResult to return
        let repo_name = repo
            .file_name()
            .and_then(|os| os.to_str())
            .unwrap_or("")
            .to_string();

        // Compute repository-level aggregates
        // Use file_map keys (full paths) as the list of files considered
        let all_files: Vec<String> = file_map.keys().cloned().collect();
        let unique_files_set: HashSet<String> = all_files.iter().cloned().collect();

        let total_commits = commits.len();
        let total_files = unique_files_set.len();
        let total_authors = author_map.len();

        let total_insertions: usize = commits
            .iter()
            .map(|c| c.metrics.insertions.unwrap_or(0))
            .sum();
        let total_deletions: usize = commits
            .iter()
            .map(|c| c.metrics.deletions.unwrap_or(0))
            .sum();

        let mut repo_metrics = Metrics::default();
        repo_metrics.total_commits = Some(total_commits);
        repo_metrics.total_files = Some(total_files);
        repo_metrics.total_authors = Some(total_authors);
        repo_metrics.insertions = Some(total_insertions);
        repo_metrics.deletions = Some(total_deletions);

        let repository = Repository {
            name: repo_name,
            path: params.repo_path.clone(),
            authors: author_map.values().cloned().collect(),
            commits: commits.clone(),
            files: file_map.values().cloned().collect(),
            metrics: repo_metrics,
        };

        Ok(repository)
    } else {
        let stderr = str::from_utf8(&output.stderr).unwrap_or("Unknown error");
        Err(format!("Git log failed: {}", stderr))
    }
}

// fn filter_authors(result: AnalysisResult, authors_to_exclude: Vec<Author>) -> Result<AnalysisResult, String> {
//     let mut result = result;
//     let exclude_set: HashSet<Author> = authors_to_exclude.into_iter().collect();

//     // Keep only the commits whose author is NOT in authors_to_exclude
//     result.repository.commits.retain(|commit| !exclude_set.contains(&commit.author));

//     // Rebuild authors list
//     let unique_authors: HashSet<Author> = result.repository.commits
//         .iter()
//         .map(|commit| commit.author.clone())
//         .collect();
//     result.repository.authors = unique_authors.into_iter().collect();

//     // Get files from commits
//     let commit_files: HashSet<String> = result.repository.commits
//         .iter()
//         .flat_map(|commit| commit.files_changed.iter())
//         .map(|file| file.path.clone())
//         .collect();

//     result.repository.files = commit_files.into_iter().collect();

//     // TODO: Calculate repository-level metrics
//     // result.repository.metrics = calculate_metrics();
//     Ok(result)
// }

/// Filter repository by authors based on `author_name_filter` and `author_email_filter` in
/// `params`. Returns a new `Repository` with commits and authors filtered accordingly.
pub fn filter_authors(
    repository: &Repository,
    params: &AnalysisParameters,
) -> Result<Repository, String> {
// Placeholder for future implementation
    Ok(repository.clone())
}

/// Filter repository by files based on `file_types_filter` and `path_filter` in `params`.
/// Returns a new `Repository` with commits and files filtered accordingly.
pub fn filter_files(
    repository: &Repository,
    params: &AnalysisParameters,
) -> Result<Repository, String> {
// Placeholder for future implementation
    Ok(repository.clone())
}

fn filter_metrics(result: AnalysisResult) {
    // Placeholder for future implementation
}

/// This function retrieves blame information up until the latest commit in the AnalysisResult.
/// Running analyse_repository() is a prerequisite!
/// It updates the file objects in the repository with blame information.
fn analyse_blames(result: AnalysisResult) -> Result<AnalysisResult, String> {
    // Destructure the incoming AnalysisResult so we can mutate a local repository
    let AnalysisResult {
        original_repository,
        parameters,
        repository,
    } = result;
    let mut repository = repository;

    // Step 1: retrieve the latest commit hash (should be the first in the commits list)
    let latest_commit_hash = if let Some(latest_commit) = repository.commits.first() {
        latest_commit.hash.clone()
    } else {
        return Err("No commits found in repository".to_string());
    };

    // Step 2: For each file in the repository:
    // Step 2.1: Run git blame
    // Step 2.2: Parse the output
    // Step 2.3: Annotate each line with its type (should have another module being able to differentiate between line types for set of langs)
    // Step 2.3: Update the file's fields with author, commit_hash, date info

    Ok(AnalysisResult {
        original_repository,
        parameters,
        repository,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::path::PathBuf;

    // Test helper: print repository details (commits, authors, metrics).
    // This function is only compiled for tests and can be used by test cases to display
    // parsed repository information when needed.
    fn print_repository_info(repo: &Repository) {
        // Print commits
        for commit in &repo.commits {
            println!(
                "id {} | hash: {} | author_id: {} | date: {} time: {} tz: {} | message: {} | files: {} | metrics: insertions={}, deletions={}",
                commit.id,
                commit.hash,
                commit.author_id,
                commit.date,
                commit.time,
                commit.timezone,
                commit.message,
                commit.files_changed.len(),
                commit.metrics.insertions.unwrap_or(0),
                commit.metrics.deletions.unwrap_or(0)
            );

            // Build a quick map of file id -> path from repository files
            let mut id_to_path: std::collections::HashMap<usize, String> =
                std::collections::HashMap::new();
            for f in &repo.files {
                id_to_path.insert(f.id, f.path.clone());
            }

            // Print per-file details for this commit
            for (file_id, m) in &commit.files_changed {
                let path = id_to_path
                    .get(file_id)
                    .cloned()
                    .unwrap_or_else(|| "<unknown>".to_string());
                println!(
                    "  id: {} | path: {} | insertions: {} | deletions: {}",
                    file_id,
                    path,
                    m.insertions.unwrap_or(0),
                    m.deletions.unwrap_or(0)
                );
            }
        }

        // Print authors (show basic author info, then per-file lines)
        println!("\nUnique authors ({}):", repo.authors.len());
        // Build a map id->path once for author file lookups
        let mut id_to_path: std::collections::HashMap<usize, String> =
            std::collections::HashMap::new();
        for f in &repo.files {
            id_to_path.insert(f.id, f.path.clone());
        }

        for author in &repo.authors {
            println!(
                "{} <{}> id={} commits={:?}",
                author.name, author.email, author.id, author.commit_hashes
            );

            // For each file the author touched, print: file_id, file_path, insertions, deletions
            for (file_id, m) in &author.files {
                let path = id_to_path
                    .get(file_id)
                    .cloned()
                    .unwrap_or_else(|| "<unknown>".to_string());
                println!(
                    "  id: {} | path: {} | insertions: {} | deletions: {}",
                    file_id,
                    path,
                    m.insertions.unwrap_or(0),
                    m.deletions.unwrap_or(0)
                );
            }
        }

        // Print repo summary
        println!("\nRepository: {} at {}", repo.name, repo.path);
        println!(
            "Total commits: {}, authors: {}, files: {}, insertions: {}, deletions: {}",
            repo.metrics.total_commits.unwrap_or(0),
            repo.metrics.total_authors.unwrap_or(0),
            repo.metrics.total_files.unwrap_or(0),
            repo.metrics.insertions.unwrap_or(0),
            repo.metrics.deletions.unwrap_or(0),
        );
    }

    #[test]
    fn test_parse_commit_header_valid() {
        // Example header matching the --pretty=format used in build_git_log_args
        let header = "abc123 / Alice Example <alice@example.com> / 2025-11-13 12:34:56 +0000 / Fix critical bug";
        let res = parse_commit_header(header);
        assert!(res.is_ok());
        let (hash, name, email, date, time, tz, message) = res.unwrap();
        assert_eq!(hash, "abc123");
        assert_eq!(name, "Alice Example");
        assert_eq!(email, "alice@example.com");
        assert_eq!(date, "2025-11-13");
        assert_eq!(time, "12:34:56");
        assert_eq!(tz, "+0000");
        assert_eq!(message, "Fix critical bug");
    }

    #[test]
    fn test_parse_commit_header_invalid() {
        // Missing separators -> should return Err
        let header = "this is a malformed header without separators";
        let res = parse_commit_header(header);
        assert!(res.is_err());
        let err = res.err().unwrap();
        assert!(err.contains("Commit header does not contain 4 parts"));
    }

    #[test]
    fn test_parse_file_line_valid() {
        let line = "12\t3\tpath/to/file.rs";
        let res = parse_file_line(line);
        assert!(res.is_ok());
        let (ins, del, path) = res.unwrap();
        assert_eq!(ins, 12);
        assert_eq!(del, 3);
        assert_eq!(path, "path/to/file.rs");
    }

    #[test]
    fn test_parse_file_line_invalid() {
        let line = "this is not a valid numstat line";
        let res = parse_file_line(line);
        assert!(res.is_err());
        let err = res.err().unwrap();
        assert!(err.contains("Malformed numstat line"));
    }

    #[test]
    fn test_update_author_new_author() {
        let mut author_map: HashMap<(String, String), Author> = HashMap::new();
        let mut next_author_id: usize = 1;

        // simulate a file change by file id and metrics tuple
        let files_changed = vec![(1usize, Metrics::default())];

        let id = update_author(
            &mut author_map,
            "Alice",
            "alice@example.com",
            "abc123",
            &files_changed,
            &mut next_author_id,
            "",
            "",
            "",
        );

        assert_eq!(id, 1);
        assert_eq!(author_map.len(), 1);
        let key = ("Alice".to_string(), "alice@example.com".to_string());
        let author = author_map.get(&key).expect("Author should exist");
        assert_eq!(author.id, 1);
        assert!(author.commit_hashes.contains(&"abc123".to_string()));
        assert!(author.files.iter().any(|(id, _m)| *id == 1));
    }

    #[test]
    fn test_update_author_existing_author() {
        let mut author_map: HashMap<(String, String), Author> = HashMap::new();
        let existing = Author {
            id: 1,
            name: "Alice".to_string(),
            email: "alice@example.com".to_string(),
            commit_hashes: vec!["oldhash".to_string()],
            files: vec![(10usize, Metrics::default())],
            last_modified_date: "".to_string(),
            last_modified_time: "".to_string(),
            last_modified_timezone: "".to_string(),
            metrics: Metrics::default(),
        };
        author_map.insert(
            (existing.name.clone(), existing.email.clone()),
            existing.clone(),
        );

        let mut next_author_id: usize = 2;

        let files_changed = vec![(1usize, Metrics::default())];

        let id = update_author(
            &mut author_map,
            "Alice",
            "alice@example.com",
            "newhash",
            &files_changed,
            &mut next_author_id,
            "",
            "",
            "",
        );

        // Should return existing author's id
        assert_eq!(id, 1);
        // next_author_id should not have changed
        assert_eq!(next_author_id, 2);

        let key = ("Alice".to_string(), "alice@example.com".to_string());
        let author = author_map.get(&key).expect("Author should exist");
        // Both old and new hashes should be present
        assert!(author.commit_hashes.contains(&"oldhash".to_string()));
        assert!(author.commit_hashes.contains(&"newhash".to_string()));
        // Both old and new files should be present (ids 10 and 1)
        assert!(author.files.iter().any(|(id, _m)| *id == 10));
        assert!(author.files.iter().any(|(id, _m)| *id == 1));
    }

    #[test]
    fn test_glob_matcher_builder_valid() {
        // Valid glob should compile and match expected strings
        let res = glob_matcher_builder("*.rs", false);
        assert!(res.is_ok());
        let matcher = res.unwrap();
        assert!(matcher.is_match("main.rs"));
        assert!(!matcher.is_match("main.py"));
    }

    #[test]
    fn test_glob_matcher_builder_invalid() {
        // Invalid glob pattern should return Err
        // Use an obviously invalid pattern
        let res = glob_matcher_builder("[", false);
        assert!(res.is_err());
        let err = res.err().unwrap();
        assert!(err.contains("Invalid glob pattern"));
    }

    // Tests for build_git_log_args
    #[test]
    fn test_build_git_log_args_mutual_exclusive() {
        let mut params = AnalysisParameters::default();
        params.repo_path = String::from("/tmp");
        // set both commit-range and time-range -> should return Err
        params.from_commit = Some("a1b2c3".to_string());
        params.to_commit = Some("d4e5f6".to_string());
        params.from_time = Some("2025-01-01T00:00:00+0000".to_string());
        params.to_time = Some("2025-01-02T00:00:00+0000".to_string());

        let res = build_git_log_args(&params);
        assert!(res.is_err());
        let err = res.err().unwrap();
        assert!(err.contains("Cannot mix commit-range"));
    }

    #[test]
    fn test_build_git_log_args_commit_range_only() {
        let mut params = AnalysisParameters::default();
        params.repo_path = String::from("/tmp");
        params.from_commit = Some("aaaa111".to_string());
        params.to_commit = Some("bbbb222".to_string());

        let res = build_git_log_args(&params).expect("Should build args for commit range");
        // first element should be "log"
        assert_eq!(res.get(0).map(|s| s.as_str()), Some("log"));
        // should contain the range string
        let range = format!("{}..{}", "aaaa111", "bbbb222");
        assert!(res.contains(&range));
        // should include --numstat
        assert!(res.contains(&"--numstat".to_string()));
    }

    #[test]
    fn test_build_git_log_args_time_range_only() {
        let mut params = AnalysisParameters::default();
        params.repo_path = String::from("/tmp");
        params.from_time = Some("2025-10-03T17:38:00+0200".to_string());
        params.to_time = Some("2025-10-05T01:30:00+0200".to_string());

        let res = build_git_log_args(&params).expect("Should build args for time range");
        assert!(res.iter().any(|s| s.starts_with("--since=")));
        assert!(res.iter().any(|s| s.starts_with("--until=")));
        assert!(res.contains(&"--numstat".to_string()));
    }

    #[test]
    fn test_build_git_log_args_only_from_commit() {
        let mut params = AnalysisParameters::default();
        params.repo_path = String::from("/tmp");
        params.from_commit = Some("onlyfrom".to_string());

        let res =
            build_git_log_args(&params).expect("Should build args when only from_commit provided");
        // Since builder only adds a range when both from and to are present, ensure no range present
        let range = format!("{}..{}", "onlyfrom", "");
        assert!(!res.iter().any(|s| s.contains("..")) || !res.contains(&range));
        // still include default flags
        assert!(res.contains(&"--numstat".to_string()));
    }

    #[test]
    fn test_build_git_log_args_only_from_time() {
        let mut params = AnalysisParameters::default();
        params.repo_path = String::from("/tmp");
        params.from_time = Some("2025-12-01T00:00:00+0000".to_string());

        let res =
            build_git_log_args(&params).expect("Should build args when only from_time provided");
        assert!(res.iter().any(|s| s.starts_with("--since=")));
        assert!(!res.iter().any(|s| s.starts_with("--until=")));
    }

    #[test]
    fn test_analyse_repository_commit_range() {
        // Run analysis between two commit hashes in a known repository
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");
        // Excluding start, including end
        let start_commit = "02c101f";
        let end_commit = "c1dd7cd";

        // Build AnalysisParameters and run analysis
        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());
        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_analyse_repository_commit_range_start_end_same() {
        // Run analysis between two identical commit hashes in a known repository
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");
        let start_commit = "02c101f";
        let end_commit = "02c101f";
        // Running the analysis should error because the git log will be empty
        // for a range with the same start and end
        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());
        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_analyse_repository_commit_range_end_before_start() {
        // Run analysis between two commit hashes in a known repository where end is before start
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");
        let start_commit = "c1dd7cd";
        let end_commit = "02c101f";
        // Running the analysis should error because the git log will be empty
        // for a range where the end is before the start
        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());
        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_analyse_repository_time_range() {
        // Run analysis between two timestamps in a known repository
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");

        let from_ts = "2025-10-03T17:38:10+0200";
        let to_ts = "2025-10-05T00:49:14+0200";

        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_time = Some(from_ts.to_string());
        params.to_time = Some(to_ts.to_string());

        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_analyse_repository_time_range_start_end_same() {
        // Run analysis where from_time == to_time
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");
        let ts = "2025-10-03T17:38:10+0200";

        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_time = Some(ts.to_string());
        params.to_time = Some(ts.to_string());

        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_analyse_repository_time_range_end_before_start() {
        // from_time after to_time -> likely empty result
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");
        let from_ts = "2025-10-05T00:49:14+0200";
        let to_ts = "2025-10-03T17:38:10+0200";

        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_time = Some(from_ts.to_string());
        params.to_time = Some(to_ts.to_string());

        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_analyse_repository_mixed_commit_and_time_range_errors() {
        // Provide both commit-range and time-range; build_git_log_args should reject this
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");

        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some("aaaa111".to_string());
        params.to_commit = Some("bbbb222".to_string());
        params.from_time = Some("2025-10-03T17:38:10+0200".to_string());
        params.to_time = Some("2025-10-05T00:49:14+0200".to_string());

        let result = analyse_repository(&params);
        assert!(result.is_err());
        let err = result.err().unwrap();
        assert!(err.contains("Cannot mix commit-range"));
    }

    // // Helper function to create a complete test AnalysisResult
    // fn create_test_analysis_result() -> AnalysisResult {
    //     let author1 = Author {
    //         name: "Alice".to_string(),
    //         email: "alice@example.com".to_string(),
    //     };
    //     let author2 = Author {
    //         name: "Bert".to_string(),
    //         email: "bert@example.com".to_string(),
    //     };

    //     let commit1 = Commit {
    //         hash: "abc123".to_string(),
    //         author: author1.clone(),
    //         date: "02-08-2025".to_string(),
    //         message: "First commit".to_string(),
    //         files_changed: vec![
    //             File {
    //                 name: "main.rs".to_string(),
    //                 extension: "rs".to_string(),
    //                 path: "src/main.rs".to_string(),
    //                 file_size: 0,
    //                 lines: vec![],
    //                 metrics: Metrics::default(),
    //             }
    //         ],
    //         metrics: Metrics::default(),
    //     };

    //     let commit2 = Commit {
    //         hash: "def456".to_string(),
    //         author: author2.clone(),
    //         date: "2025-01-01".to_string(),
    //         message: "Second commit".to_string(),
    //         files_changed: vec![
    //             File {
    //                 name: "lib.rs".to_string(),
    //                 extension: "rs".to_string(),
    //                 path: "src/lib.rs".to_string(),
    //                 file_size: 0,
    //                 lines: vec![],
    //                 metrics: Metrics::default(),
    //             }
    //         ],
    //         metrics: Metrics::default(),
    //     };

    //     let repository = Repository {
    //         name: "test-repo".to_string(),
    //         path: "/path/to/repo".to_string(),
    //         authors: vec![author1, author2],
    //         commits: vec![commit1, commit2],
    //         files: vec!["src/main.rs".to_string(), "src/lib.rs".to_string()],
    //         metrics: Metrics::default(),
    //     };

    //     AnalysisResult {
    //         parameters: AnalysisParameters::default(),
    //         repository,
    //     }
    // }

    // #[test]
    // fn test_filter_authors_removes_commits_files_and_authors() {
    //     let analysis_result = create_test_analysis_result();
    //     let author_alice = analysis_result.repository.authors[0].clone();
    //     let author_bert = analysis_result.repository.authors[1].clone();

    //     let filtered = filter_authors(analysis_result, vec![author_alice]).unwrap();

    //     // Should have only 1 commit (from Bert)
    //     assert_eq!(filtered.repository.commits.len(), 1);
    //     assert_eq!(filtered.repository.commits[0].author, author_bert);

    //     // Should have only 1 author (Bert)
    //     assert_eq!(filtered.repository.authors.len(), 1);
    //     assert_eq!(filtered.repository.authors[0], author_bert);

    //     // Should only 1 file (lib.rs)
    //     assert_eq!(filtered.repository.files.len(), 1);
    //     assert!(filtered.repository.files.contains(&"src/lib.rs".to_string()));
    // }

    // #[test]
    // fn test_filter_non_existing_author() {
    //     let analysis_result = create_test_analysis_result();
    //     let non_existing_author = Author {
    //         name: "Fake".to_string(),
    //         email: "fake@example.com".to_string(),
    //     };

    //     let filtered = filter_authors(analysis_result, vec![non_existing_author]).unwrap();
    //     // Should have 2 commits
    //     assert_eq!(filtered.repository.commits.len(), 2);
    //     // Should have 2 authors
    //     assert_eq!(filtered.repository.authors.len(), 2);
    //     // Should have 2 files
    //     assert_eq!(filtered.repository.files.len(), 2);
    // }

    // #[test]
    // fn test_filter_empty_analysis_result() {
    //     let repository = Repository {
    //         name: "empty-repo".to_string(),
    //         path: "/path/to/empty".to_string(),
    //         authors: vec![],
    //         commits: vec![],
    //         files: vec![],
    //         metrics: Metrics::default(),
    //     };

    //     let analysis_result = AnalysisResult {
    //         parameters: AnalysisParameters::default(),
    //         repository,
    //     };

    //     let author_to_exclude = Author {
    //         name: "Fake".to_string(),
    //         email: "fake@example.com".to_string(),
    //     };

    //     // Filter on empty result
    //     let filtered = filter_authors(analysis_result, vec![author_to_exclude]).unwrap();

    //     // Should remain empty
    //     assert_eq!(filtered.repository.commits.len(), 0);
    //     assert_eq!(filtered.repository.authors.len(), 0);
    //     assert_eq!(filtered.repository.files.len(), 0);
    // }

    #[test]
    fn test_filter_files() {
        // Placeholder test
        // let dummy = make_dummy_analysis_result();
        // filter_files(dummy);
    }

    #[test]
    fn test_filter_metrics() {
        // Placeholder test
        // let dummy = make_dummy_analysis_result();
        // filter_metrics(dummy);
    }

    #[test]
    fn test_analyse_blames() {
        // Placeholder test
        // analyse_blames();
    }

    // TODO: CLEAN UP TEST AND MAKE MORE
    #[test]
    fn test_build_glob_matchers_commit_hash_numeric_start() {
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");
        // Excluding start, including end
        let start_commit = "02c101f";
        let end_commit = "c1dd7cd";

        // Build AnalysisParameters and run analysis
        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());

        // Build parameters with a commit_hash_filter that matches hashes starting with a digit
        params.commit_hash_filter = Some(Filter {
            // glob that matches any string starting with a numeric character
            value: "[0-9]*".to_string(),
            include: true,
        });

        let matchers = build_glob_matchers_from_params(&params).expect("Should build matchers");

        // Ensure we have 6 elements (two new author filters added)
        assert_eq!(matchers.len(), 6);
        let commit_matcher = matchers[0].as_ref().expect("commit matcher should be Some");

        // Should match hashes that start with a digit
        assert!(commit_matcher.is_match("1a2b3c"));
        assert!(commit_matcher.is_match("9abcdef"));

        // Should NOT match hashes that start with a letter
        assert!(!commit_matcher.is_match("a12345"));

        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_build_glob_matchers_commit_message_feat_analysis_prefix() {
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");
        // Excluding start, including end
        let start_commit = "02c101f";
        let end_commit = "c1dd7cd";

        // Build AnalysisParameters and run analysis
        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());

        // Build parameters with a commit_message_filter that matches messages
        // starting with "feat(analysis):"
        params.commit_message_filter = Some(Filter {
            value: "feat(analysis):*".to_string(),
            include: true,
        });

        let matchers = build_glob_matchers_from_params(&params).expect("Should build matchers");

        // Ensure we have 6 elements (two new author filters added)
        assert_eq!(matchers.len(), 6);
        let msg_matcher = matchers[1]
            .as_ref()
            .expect("commit message matcher should be Some");

        // Should match messages that start with feat(analysis):
        assert!(msg_matcher.is_match("feat(analysis): add new analyse_repository"));
        assert!(msg_matcher.is_match("feat(analysis):refactor: tidy up"));

        // Should NOT match unrelated messages
        assert!(!msg_matcher.is_match("fix: correct bug"));
        assert!(!msg_matcher.is_match("chore: bump deps"));

        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_build_glob_matchers_file_types_rs_and_gitignore() {
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");

        let start_commit = "02c101f";
        let end_commit = "c1dd7cd";

        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());

        // file types filter value provided as requested
        params.file_types_filter = Some(Filter {
            value: "{.rs,.gitignore,.js}".to_string(),
            include: true,
        });

        let matchers = build_glob_matchers_from_params(&params).expect("Should build matchers");
        assert_eq!(matchers.len(), 6);

        let ft_matcher = matchers[4]
            .as_ref()
            .expect("file types matcher should be Some");

        // Expect this matcher to match common extensions 'rs' and 'gitignore'
        assert!(ft_matcher.is_match(".rs"));
        assert!(ft_matcher.is_match(".gitignore"));
        assert!(ft_matcher.is_match(".js"));

        // Should not match other extensions
        assert!(!ft_matcher.is_match(".py"));
        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_build_glob_matchers_path_gi_core_shared_types() {
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");

        let start_commit = "02c101f";
        let end_commit = "c1dd7cd";

        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());

        // path filter for a specific file
        params.path_filter = Some(Filter {
            value: "gi_core/src/shared_types.rs".to_string(),
            include: true,
        });

        let matchers = build_glob_matchers_from_params(&params).expect("Should build matchers");
        assert_eq!(matchers.len(), 6);

        let path_matcher = matchers[5].as_ref().expect("path matcher should be Some");

        // Should match the exact path
        assert!(path_matcher.is_match("gi_core/src/shared_types.rs"));
        // Should not match other paths
        assert!(!path_matcher.is_match("gui/src/main.ts"));

        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_build_glob_matchers_author_name_max_include_true() {
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");

        let start_commit = "02c101f";
        let end_commit = "c1dd7cd";

        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());

        // Author name filter: include only names that end with 'Max'
        params.author_name_filter = Some(Filter {
            value: "*Max".to_string(),
            include: true,
        });

        let matchers = build_glob_matchers_from_params(&params).expect("Should build matchers");
        assert_eq!(matchers.len(), 6);

        let name_matcher = matchers[2].as_ref().expect("author name matcher should be Some");

        // Should match names that end with 'Max'
        assert!(name_matcher.is_match("Max"));
        assert!(name_matcher.is_match("Big Max"));

        // Should not match names that do not end with 'Max'
        assert!(!name_matcher.is_match("Maximilian"));

        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_build_glob_matchers_author_email_gmail_exclude() {
        let repo_path: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .canonicalize()
            .expect("Failed to canonicalize repo path");

        let start_commit = "02c101f";
        let end_commit = "c1dd7cd";

        let mut params = AnalysisParameters::default();
        params.repo_path = repo_path.to_string_lossy().to_string();
        params.from_commit = Some(start_commit.to_string());
        params.to_commit = Some(end_commit.to_string());

        // Author email filter: exclude any author emails that match '*gmail.com'
        params.author_email_filter = Some(Filter {
            value: "*gmail.com".to_string(),
            include: false,
        });

        let matchers = build_glob_matchers_from_params(&params).expect("Should build matchers");
        assert_eq!(matchers.len(), 6);

        let email_matcher = matchers[3].as_ref().expect("author email matcher should be Some");

        // Should match gmail addresses
        assert!(email_matcher.is_match("user@gmail.com"));
        assert!(!email_matcher.is_match("user@company.com"));

        let result = analyse_repository(&params);
        match result {
            Ok(repo) => {
                print_repository_info(&repo);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_glob_brace_matches_multiple_entries() {
        // Brace-style glob should match either alternative
        let res = glob_matcher_builder("{test,case}", false);
        assert!(res.is_ok(), "Brace glob should compile");
        let matcher = res.unwrap();
        assert!(matcher.is_match("test"), "Brace glob should match 'test'");
        assert!(matcher.is_match("case"), "Brace glob should match 'case'");
        // It should not match the literal comma string
        assert!(!matcher.is_match("test,case"), "Brace glob should not match the literal 'test,case'");
    }

    #[test]
    fn test_glob_without_braces_treats_comma_as_literal() {
        // Without braces the comma is a literal character in the pattern
        let res = glob_matcher_builder("test,case", false);
        assert!(res.is_ok(), "Literal-comma glob should compile");
        let matcher = res.unwrap();
        // Should match the full string containing the comma
        assert!(matcher.is_match("test,case"), "Literal-comma glob should match 'test,case'");
        // Should not match the individual alternatives
        assert!(!matcher.is_match("test"), "Literal-comma glob should not match 'test'");
        assert!(!matcher.is_match("case"), "Literal-comma glob should not match 'case'");
    }
}
