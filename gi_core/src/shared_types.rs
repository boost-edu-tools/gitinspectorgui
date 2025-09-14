use serde::{Serialize, Deserialize};


/// The File struct represents a file in the repository with its associated data.
pub struct File {
    pub name: String,
    pub extension: String,
    pub path: String,
    pub file_size: usize,
    pub lines: Vec<Line>,
    pub metrics: Metrics,
}


/// The Line struct represents a line in a file with its associated data.
pub struct Line {
    pub number: usize,
    pub content: String,
    pub author: Author,
    pub commit_hash: String,
    pub date: String,
}


/// The Repository struct represents a git repository with its associated data.
pub struct Repository {
    pub name: String,
    pub path: String,
    pub authors: Vec<Author>,
    pub commits: Vec<Commit>,
    pub files: Vec<File>,
    pub metrics: Metrics,
}


/// The Commit struct represents a git commit with its associated data.
pub struct Commit {
    pub hash: String,
    pub author: Author,
    pub date: String,
    pub message: String,
    pub files_changed: Vec<File>,
    pub metrics: Metrics,
}

/// The Author struct represents an author of commits in the repository.
pub struct Author {
    pub name: String,
    pub email: String,
}


/// The Metrics struct stores metrics in the context of the struct it is used in.
/// For example, in the context of a Repository, it stores overall repository metrics.
/// All metrics are optional and can be None if not calculated or not applicable.
pub struct Metrics {
    pub loc: Option<usize>,
    pub sloc: Option<usize>,
    pub cloc: Option<usize>,
    pub insertions: Option<usize>,
    pub deletions: Option<usize>,
    pub total_commits: Option<usize>,
    pub total_authors: Option<usize>,
    pub total_files: Option<usize>,
}


/// The AnalysisParameters struct defines parameters for filtering the analysis of a repository.
pub struct AnalysisParameters {
    pub from_time: Option<String>, // e.g., "2023-01-01"
    pub to_time: Option<String>,   // e.g., "2023-12-31"
    pub from_commit: Option<String>,
    pub to_commit: Option<String>,
    // TODO: Check if Vec<&T> is appropriate here or if we should use Vec<String> or similar
    pub exclude_authors: Vec<Author>,
    pub exclude_files: Vec<File>,       
}

impl Default for AnalysisParameters {
    fn default() -> Self {
        AnalysisParameters {
            from_time: None,
            to_time: None,
            from_commit: None,
            to_commit: None,
            exclude_authors: vec![],
            exclude_files: vec![],
        }
    }
}


/// The AnalysisResult struct encapsulates the results of analyzing a repository.
/// It includes the full repository (unfiltered), lists of authors, commits, and files involved in the analysis,
/// as well as aggregated metrics, which can be filtered based on the analysis parameters.
pub struct AnalysisResult {
    pub repository: Repository,
    pub authors: Vec<Author>,
    pub commits: Vec<Commit>,
    pub files: Vec<File>,
    pub metrics: Metrics,
}


/// The Settings struct holds configuration settings for the analysis.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Settings {
    pub repositories: Vec<String>,
    pub search_depth: usize,
    pub ignored_file_extensions: Vec<String>,

}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            repositories: vec![],
            search_depth: 3,
            ignored_file_extensions: vec![],
        }
    }
}