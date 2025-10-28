pub use crate::shared_types::*;

use std::path::{Path, PathBuf};
use std::{str, collections::{HashSet, HashMap}, process::Command, fs::File as FsFile, io::{BufRead, BufReader}};

fn analyse_between_timestamps(repo: &Path, start: &str, end: &str, params: &AnalysisParameters) {// -> Repository {
    // Placeholder for future implementation
}

/// This function analyses a git repository between two commit hashes (from_commit to to_commit).
/// If from_commit is None, analysis starts from the first commit.
/// If to_commit is None, analysis goes up to the latest commit.
/// It returns an AnalysisResult containing the parsed commits, authors, and files.
/// Files are just fetched, not processed by the analysis. This functionality is handled by retrieve_blames_between_commits()
fn analyse_between_commits(params: &AnalysisParameters) -> Result<AnalysisResult, String> {
    // Resolve repo path and commit range from params
    let repo = Path::new(&params.repo_path);
    let start = params.from_commit.as_deref().unwrap_or("");
    let end = params.to_commit.as_deref().unwrap_or("");
    
    // Run git log to get commit info and changed files, separated by empty lines
    // We define a custom format to make parsing easier
    // This format is: short hash / author name <email> / date / message
    // Followed by the list of changed files, one per line

    // Build the Git Log command
    let mut args: Vec<String> = Vec::new();
    args.push("log".to_string());

    // Add the commit range if (partially) specified
    if !(start.is_empty() && end.is_empty()) {
    let range = format!("{}..{}", start, end);
    args.push(range);
    }

    // Add the pretty format and other flags
    args.push("--pretty=format:%h / %an <%ae> / %ad / %s".to_string());
    args.push("--date=short".to_string());
    args.push("--numstat".to_string());

    // Run the command
    let output = Command::new("git")
        .current_dir(repo)
        .args(&args)
        .output()
        .expect("Failed to run git log");

    if output.status.success() {
        let stdout = str::from_utf8(&output.stdout).unwrap();
        let commit_strings: Vec<&str> = stdout.split("\n\n").filter(|s| !s.trim().is_empty()).collect();

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
                let date = parts.next().unwrap_or("").trim().to_string();
                let message = parts.next().unwrap_or("").trim().to_string();
                
                // Parse author name and email
                let (author_name, author_email) = if let Some(start) = author_str.find('<') {
                    let end = author_str.find('>').unwrap_or(author_str.len());
                    (
                        author_str[..start].trim().to_string(),
                        author_str[start+1..end].trim().to_string(),
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
                    if parts.len() >= 3 {
                        let ins_str = parts[0];
                        let del_str = parts[1];
                        let path_str = parts[2];

                        let ins = if ins_str == "-" { 0 } else { ins_str.parse::<usize>().unwrap_or(0) };
                        let del = if del_str == "-" { 0 } else { del_str.parse::<usize>().unwrap_or(0) };

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
                        });
                    } else {
                        // Fallback: treat whole line as a path
                        let path = line.to_string();
                        files_changed.push(File {
                            name: path.split('/').last().unwrap_or("").to_string(),
                            extension: path.split('.').last().unwrap_or("").to_string(),
                            path: path.clone(),
                            file_size: Some(0),
                            lines: vec![],
                            metrics: Metrics::default(),
                        });
                    }
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
                metrics.total_files_changed = Some(commit_total_files);
                
                // Move parsed values into the commits vector (no cloning required)
                commits.push(Commit {
                    id: next_commit_id,
                    hash,
                    author_id: author_entry.id,
                    date,
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
                "id {} | hash: {} | author_id: {} | date: {} | message: {} | files: {:?} | metrics: insertions={}, deletions={}",
                commit.id,
                commit.hash,
                commit.author_id,
                commit.date,
                commit.message,
                commit.files_changed.iter().map(|f| &f.path).collect::<Vec<_>>(),
                commit.metrics.insertions.unwrap_or(0),
                commit.metrics.deletions.unwrap_or(0)
            );
        }

        // Print unique authors collected during parsing
        println!("\nUnique authors ({}):", author_map.len());
        for author in author_map.values() {
            println!("{} <{}> id={} commits={:?} files={:?}", author.name, author.email, author.id, author.commit_hashes, author.files);
        }

        // Build the Repository and AnalysisResult to return
        let repo_name = repo.file_name()
            .and_then(|os| os.to_str())
            .unwrap_or("")
            .to_string();

        let repository = Repository {
            name: repo_name,
            path: params.repo_path.clone(),
            authors: author_map.values().cloned().collect(),
            commits: commits.clone(),
            files: commits.iter().flat_map(|c| c.files_changed.iter().map(|f| f.path.clone())).collect(),
            metrics: Metrics::default(),
        };

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

    #[test]
    fn test_analyse_between_timestamps() {
        // Placeholder test
        // analyse_between_timestamps();
    }

    #[test]
    fn test_analyse_between_commits() {
        // Placeholder test
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
        let result = analyse_between_commits(&params);
        match result {
            Ok(analysis) => {
                println!("AnalysisResult: commits={}, authors={}", analysis.repository.commits.len(), analysis.repository.authors.len());
            },
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_analyse_between_commits_start_end_same() {
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
        let result = analyse_between_commits(&params);
        match result {
            Ok(analysis) => {
                println!("AnalysisResult: commits={}, authors={}", analysis.repository.commits.len(), analysis.repository.authors.len());
            },
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    #[test]
    fn test_analyse_between_commits_end_before_start() {
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
        let result = analyse_between_commits(&params);
        match result {
            Ok(analysis) => {
                println!("AnalysisResult: commits={}, authors={}", analysis.repository.commits.len(), analysis.repository.authors.len());
            },
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
