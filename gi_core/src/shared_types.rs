use serde::{Serialize, Deserialize};


/// The File struct represents a file in the repository with its associated data.
#[derive(Clone)]
pub struct File {
    pub name: String,
    pub extension: String,
    pub path: String,
    pub file_size: Option<usize>,
    pub lines: Vec<Line>,
    pub metrics: Metrics,
    pub last_modified_date: String,
    pub last_modified_time: String,
    pub last_modified_timezone: String,
}


/// The Line struct represents a line in a file with its associated data.
#[derive(Clone)]
pub struct Line {
    pub number: usize,
    pub content: String,
    pub author_id: usize,
    pub commit_hash: String,
    pub date: String,
    // pub line_type: LineType,
}


// pub enum LineType {
//     SLOC,
//     CLOC
// }
    

/// The Repository struct represents a git repository with its associated data.
#[derive(Clone)]
pub struct Repository {
    pub name: String,
    pub path: String,
    pub authors: Vec<Author>,
    pub commits: Vec<Commit>,
    pub files: Vec<String>,
    pub metrics: Metrics,
}


/// The Commit struct represents a git commit with its associated data.
#[derive(Clone)]
pub struct Commit {
    pub id: usize,
    pub hash: String,
    pub author_id: usize,
    pub date: String,
    pub time: String,
    pub timezone: String,
    pub message: String,
    pub files_changed: Vec<File>,
    pub metrics: Metrics,
}

/// The Author struct represents an author of commits in the repository.
/// We derive Hash and Eq to allow usage in HashSet for uniqueness.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Author {
    pub id: usize,
    pub name: String,
    pub email: String,
    pub commit_hashes: Vec<String>, // List of commit hashes authored by this author
    pub files: Vec<String>,   // List of file paths modified by this author
    pub metrics: Metrics,
}


/// The Metrics struct stores metrics in the context of the struct it is used in.
/// For example, in the context of a Repository, it stores overall repository metrics.
/// All metrics are optional and can be None if not calculated or not applicable.
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
pub struct Metrics {
    pub loc: Option<usize>,
    pub sloc: Option<usize>,
    pub cloc: Option<usize>, // cloc = loc - sloc
    pub insertions: Option<usize>,
    pub deletions: Option<usize>,
    pub total_commits: Option<usize>,
    pub total_authors: Option<usize>,
    pub total_files: Option<usize>,
}

// Implement a default empty Metrics struct
impl Default for Metrics {
    fn default() -> Self {
        Metrics { 
            loc: None,
            sloc: None,
            cloc: None,
            insertions: None,
            deletions: None,
            total_commits: None,
            total_authors: None,
            total_files: None,
        }
    }
}


/// The AnalysisParameters struct defines parameters for filtering the analysis of a repository.
#[derive(Clone)]
pub struct AnalysisParameters {
    pub repo_path: String,
    pub from_time: Option<String>, // e.g., "2023-01-01"
    pub to_time: Option<String>,   // e.g., "2023-12-31"
    pub from_commit: Option<String>,
    pub to_commit: Option<String>,
    pub exclude_authors: Vec<Author>,
    pub exclude_files: Vec<File>,       
}

impl Default for AnalysisParameters {
    fn default() -> Self {
        AnalysisParameters {
            repo_path: String::new(),
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
    pub original_repository: Option<Repository>, // The full repository (unfiltered). None until set.
    pub parameters: AnalysisParameters,
    pub repository: Repository, // The filtered repository based on analysis parameters
}


/// The Settings struct holds configuration settings for the analysis.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Settings {
    pub repositories: Vec<String>,
    pub search_depth: usize,
    pub ignored_file_extensions: Vec<String>,
    pub allowed_file_extensions: Vec<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            repositories: vec![],
            search_depth: 3,
            ignored_file_extensions: vec![],
            allowed_file_extensions: vec![],
        }
    }
}