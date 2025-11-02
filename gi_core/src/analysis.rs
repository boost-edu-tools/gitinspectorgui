pub use crate::shared_types::*;

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

/// This function analyses a git repository between two commit hashes or time stamps.
/// If from_commit is None, analysis starts from the first commit.
/// If to_commit is None, analysis goes up to the latest commit.
/// If from_time or to_time are specified, they are used instead of commit hashes.
/// It returns an AnalysisResult containing the parsed commits, authors, and files.
/// Files are just fetched, not processed by the analysis. This functionality is handled by retrieve_blames_between_commits()
fn analyse_repository(params: &AnalysisParameters) -> Result<AnalysisResult, String> {
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

        let mut commits = Vec::new();
        // Use a map keyed by (name, email) so we can update existing authors with additional commits/files
        let mut author_map: HashMap<(String, String), Author> = HashMap::new();
        let mut next_author_id = 1; // incremental id for authors
        let mut next_commit_id = 1; // incremental id for commits

        for commit_str in commit_strings {
            let mut lines = commit_str.lines();
            if let Some(header) = lines.next() {
                // Parsing the header line
                let mut parts = header.splitn(4, " / ");
                let hash = parts.next().unwrap_or("").trim().to_string();
                let author_str = parts.next().unwrap_or("").trim().to_string();
                // date may include time and timezone when using --date=iso
                let date_full = parts.next().unwrap_or("").trim().to_string();
                // split into date, time, timezone where possible
                let mut date_only = String::new();
                let mut time_only = String::new();
                let mut tz_only = String::new();
                let date_parts: Vec<&str> = date_full.split_whitespace().collect();
                // We assume date_parts always has 3 parts. This may change if the git output changes.
                date_only = date_parts[0].to_string();
                time_only = date_parts[1].to_string();
                tz_only = date_parts[2].to_string();

                let message = parts.next().unwrap_or("").trim().to_string();

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

                // Parse files and --numstat entries. numstat lines look like:
                // "<insertions>\t<deletions>\t<path>". Insertions/deletions may be "-" for binaries.
                let mut files_changed: Vec<File> = Vec::new();
                let mut commit_insertions: usize = 0;
                let mut commit_deletions: usize = 0;
                let mut commit_total_files: usize = 0;

                for raw in lines {
                    let line = raw.trim();

                    if line.is_empty() {
                        continue;
                    }

                    // Add to total files count
                    commit_total_files = commit_total_files.saturating_add(1);

                    // Split on tab as produced by --numstat
                    let parts: Vec<&str> = line.split('\t').collect();
                    // We assume well-formed numstat lines have 3 parts, this may change if git output changes.
                    let ins_str = parts[0];
                    let del_str = parts[1];
                    let path_str = parts[2];

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

                    commit_insertions = commit_insertions.saturating_add(ins);
                    commit_deletions = commit_deletions.saturating_add(del);

                    let path = path_str.to_string();
                    let mut file_metrics = Metrics::default();
                    file_metrics.insertions = Some(ins);
                    file_metrics.deletions = Some(del);

                    files_changed.push(File {
                        name: path.split('/').last().unwrap_or("").to_string(),
                        extension: path.split('.').last().unwrap_or("").to_string(),
                        path: path.clone(),
                        file_size: Some(0),
                        lines: vec![],
                        metrics: file_metrics,
                        last_modified_date: date_only.clone(),
                        last_modified_time: time_only.clone(),
                        last_modified_timezone: tz_only.clone(),
                    });
                }

                // Ensure an Author entry exists (or update existing). Use (name,email) as the key.
                let key = (author_name.clone(), author_email.clone());
                let author_entry = author_map.entry(key).or_insert_with(|| {
                    let id = next_author_id;
                    next_author_id += 1;
                    Author {
                        id,
                        name: author_name.clone(),
                        email: author_email.clone(),
                        commit_hashes: Vec::new(),
                        files: Vec::new(),
                        metrics: Metrics::default(),
                    }
                });

                // Add this commit hash to the author's commit list if not already present
                if !author_entry.commit_hashes.contains(&hash) {
                    author_entry.commit_hashes.push(hash.clone());
                }

                // Add any files changed in this commit to the author's file list (avoid duplicates)
                for f in &files_changed {
                    if !author_entry.files.contains(&f.path) {
                        author_entry.files.push(f.path.clone());
                    }
                }

                let mut metrics = Metrics::default();
                metrics.insertions = Some(commit_insertions);
                metrics.deletions = Some(commit_deletions);
                metrics.total_files = Some(commit_total_files);

                // Move parsed values into the commits vector (no cloning required)
                commits.push(Commit {
                    id: next_commit_id,
                    hash,
                    author_id: author_entry.id,
                    date: date_only.clone(),
                    time: time_only.clone(),
                    timezone: tz_only.clone(),
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

        // For demonstration, print the parsed commits (showing author_id rather than full author object)
        for commit in &commits {
            println!(
                "id {} | hash: {} | author_id: {} | date: {} time: {} tz: {} | message: {} | files: {:?} | metrics: insertions={}, deletions={}",
                commit.id,
                commit.hash,
                commit.author_id,
                commit.date,
                commit.time,
                commit.timezone,
                commit.message,
                commit
                    .files_changed
                    .iter()
                    .map(|f| &f.path)
                    .collect::<Vec<_>>(),
                commit.metrics.insertions.unwrap_or(0),
                commit.metrics.deletions.unwrap_or(0)
            );
        }

        // Print unique authors collected during parsing
        println!("\nUnique authors ({}):", author_map.len());
        for author in author_map.values() {
            println!(
                "{} <{}> id={} commits={:?} files={:?}",
                author.name, author.email, author.id, author.commit_hashes, author.files
            );
        }

        // Build the Repository and AnalysisResult to return
        let repo_name = repo
            .file_name()
            .and_then(|os| os.to_str())
            .unwrap_or("")
            .to_string();

        // Compute repository-level aggregates
        let all_files: Vec<String> = commits
            .iter()
            .flat_map(|c| c.files_changed.iter().map(|f| f.path.clone()))
            .collect();
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
            files: unique_files_set.into_iter().collect(),
            metrics: repo_metrics,
        };

        // Print the repo summary and metrics for verification
        println!("\nRepository: {} at {}", repository.name, repository.path);
        println!(
            "Total commits: {}, authors: {}, files: {}, insertions: {}, deletions: {}",
            repository.metrics.total_commits.unwrap_or(0),
            repository.metrics.total_authors.unwrap_or(0),
            repository.metrics.total_files.unwrap_or(0),
            repository.metrics.insertions.unwrap_or(0),
            repository.metrics.deletions.unwrap_or(0),
        );

        Ok(AnalysisResult {
            original_repository: None,
            parameters: params.clone(),
            repository,
        })
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

fn filter_files(result: AnalysisResult) {
    // Placeholder for future implementation
}

fn filter_metrics(result: AnalysisResult) {
    // Placeholder for future implementation
}

/// This function retrieves blame information up until the latest commit in the AnalysisResult.
/// It updates the files in each commit with line-by-line author information.
// fn retrieve_blames_between_commits(result: AnalysisResult) -> AnalysisResult {
//     // Destructure the incoming AnalysisResult so we can mutate a local repository
//     let AnalysisResult { parameters, repository } = result;
//     let mut repository = repository;

//     // For each commit, for each file changed in that commit, try to read the file
//     // from the repository working tree (using repository.path + file.path) and
//     // populate file_size and lines. We leave author/commit_hash/date empty for now.
//     let repo_root = Path::new(&repository.path);

//     for commit in &mut repository.commits {
//         for file in &mut commit.files_changed {
//             let file_path: PathBuf = repo_root.join(&file.path);
//             if let Ok(metadata) = std::fs::metadata(&file_path) {
//                 file.file_size = metadata.len() as usize;
//             } else {
//                 file.file_size = 0;
//             }

//             // Try to open and read lines
//             let mut lines_vec: Vec<Line> = Vec::new();
//             if let Ok(f) = FsFile::open(&file_path) {
//                 let reader = BufReader::new(f);
//                 for (idx, line_res) in reader.lines().enumerate() {
//                     match line_res {
//                         Ok(line_content) => {
//                             // Create a Line with placeholder author/commit/date
//                             let placeholder_author = Author { name: String::new(), email: String::new() };
//                             let l = Line {
//                                 number: idx + 1,
//                                 content: line_content,
//                                 author: placeholder_author,
//                                 commit_hash: String::new(),
//                                 date: String::new(),
//                             };
//                             lines_vec.push(l);
//                         }
//                         Err(_) => {
//                             // Ignore line read errors; continue
//                         }
//                     }
//                 }
//             }

//             file.lines = lines_vec;
//         }
//     }

//     AnalysisResult { parameters, repository }
// }

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;


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

        let res = build_git_log_args(&params).expect("Should build args when only from_commit provided");
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

        let res = build_git_log_args(&params).expect("Should build args when only from_time provided");
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
            Ok(analysis) => {
                println!(
                    "AnalysisResult: commits={}, authors={}",
                    analysis.repository.commits.len(),
                    analysis.repository.authors.len()
                );
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
            Ok(analysis) => {
                println!(
                    "AnalysisResult: commits={}, authors={}",
                    analysis.repository.commits.len(),
                    analysis.repository.authors.len()
                );
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
            Ok(analysis) => {
                println!(
                    "AnalysisResult: commits={}, authors={}",
                    analysis.repository.commits.len(),
                    analysis.repository.authors.len()
                );
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
            Ok(analysis) => {
                println!(
                    "AnalysisResult (time range): commits={}, authors={}",
                    analysis.repository.commits.len(),
                    analysis.repository.authors.len()
                );
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
            Ok(analysis) => {
                println!(
                    "AnalysisResult (time same): commits={}, authors={}",
                    analysis.repository.commits.len(),
                    analysis.repository.authors.len()
                );
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
            Ok(analysis) => {
                println!(
                    "AnalysisResult (time end before start): commits={}, authors={}",
                    analysis.repository.commits.len(),
                    analysis.repository.authors.len()
                );
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
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
    fn test_retrieve_blames_between_commits() {
        // Placeholder test
        // retrieve_blames_between_commits();
    }
}
