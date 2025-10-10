pub use crate::shared_types::*;

use std::str;
use crate::shared_types::{AnalysisParameters, Commit, Author, File, Metrics};

use std::path::Path;
use std::collections::HashSet;
use std::process::Command;

fn analyse_between_timestamps(repo: &Path, start: &str, end: &str, params: &AnalysisParameters) {// -> Repository {
    // Placeholder for future implementation
}

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
    args.push("--name-only".to_string());

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
        let mut unique_authors: HashSet<Author> = HashSet::new();

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

                let author = Author { name: author_name, email: author_email };
                // Insert into unique authors set
                unique_authors.insert(author.clone());

                // Parse files (as File structs with only name/path, others default)
                let files_changed: Vec<File> = lines
                    .map(|l| l.trim())
                    .filter(|l| !l.is_empty())
                    .map(|file_path| File {
                        name: file_path.split('/').last().unwrap_or("").to_string(),
                        extension: file_path.split('.').last().unwrap_or("").to_string(),
                        path: file_path.to_string(),
                        file_size: 0,
                        lines: vec![],
                        metrics: Metrics::default(),
                    })
                    .collect();

                let metrics = Metrics::default();
                
                // Move parsed values into the commits vector (no cloning required)
                commits.push(Commit {
                    hash,
                    author,
                    date,
                    message,
                    files_changed,
                    metrics,
                });
            }
        }
        // For demonstration, print the parsed commits
        for commit in &commits {
            println!("hash: {} | author: {} <{}> | date: {} | message: {} | files: {:?}",
                commit.hash, commit.author.name, commit.author.email, commit.date, commit.message, commit.files_changed.iter().map(|f| &f.path).collect::<Vec<_>>());
        }

        // Print unique authors collected during parsing
        println!("\nUnique authors ({}):", unique_authors.len());
        for author in &unique_authors {
            println!("{} <{}>", author.name, author.email);
        }

        // Build the Repository and AnalysisResult to return
        let repo_name = repo.file_name()
            .and_then(|os| os.to_str())
            .unwrap_or("")
            .to_string();

        let repository = Repository {
            name: repo_name,
            path: params.repo_path.clone(),
            authors: unique_authors.clone().into_iter().collect(),
            commits: commits.clone(),
            files: commits.iter().flat_map(|c| c.files_changed.iter().map(|f| f.path.clone())).collect(),
            metrics: Metrics::default(),
        };

        Ok(AnalysisResult {
            parameters: params.clone(),
            repository,
        })
    } else {
        let stderr = str::from_utf8(&output.stderr).unwrap_or("Unknown error");
        Err(format!("Git log failed: {}", stderr))
    }
}

fn filter_authors(mut result: AnalysisResult, authors_to_exclude: &[Author]) -> AnalysisResult {
    let exclude_set: HashSet<&Author> = authors_to_exclude.iter().collect();

    // Keep only the commits whose author is NOT in authors_to_exclude
    result.repository.commits.retain(|commit| !exclude_set.contains(&commit.author));

    // Rebuild authors list
    let unique_authors: HashSet<Author> = result.repository.commits
        .iter()
        .map(|commit| commit.author.clone())
        .collect();

    result.repository.authors = unique_authors.into_iter().collect();
    
    result
}

fn filter_files(result: AnalysisResult) {
    // Placeholder for future implementation
}

fn filter_metrics(result: AnalysisResult) {
    // Placeholder for future implementation
}

fn retrieve_blames_per_commit(result: &AnalysisResult, params: &AnalysisParameters) {
    // Placeholder for future implementation
}

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

    #[test]
    fn test_filter_authors() {
        // Placeholder test
        // let dummy = make_dummy_analysis_result();
        // filter_authors(dummy);
    }

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
    fn test_retrieve_blames_per_commit() {
        // Placeholder test
        retrieve_blames_per_commit();
    }
}
