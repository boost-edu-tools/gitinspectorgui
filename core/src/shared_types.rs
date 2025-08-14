use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AuthorStat {
    pub name: String,
    pub email: String,
    pub commits: i32,
    pub insertions: i32,
    pub deletions: i32,
    pub files: i32,
    pub percentage: f64,
    pub age: String, // Optional, default ""
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileStat {
    pub name: String,
    pub path: String,
    pub lines: i32,
    pub commits: i32,
    pub authors: i32,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BlameEntry {
    pub file: String,
    pub line_number: i32,
    pub author: String,
    pub commit: String,
    pub date: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RepositoryResult {
    pub name: String,
    pub path: String,
    pub authors: Vec<AuthorStat>,
    pub files: Vec<FileStat>,
    pub blame_data: Vec<BlameEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AnalysisResult {
    pub repositories: Vec<RepositoryResult>,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Settings {
    // Repository and Input Settings
    pub input_fstrs: Vec<String>,
    pub depth: i32,
    pub subfolder: String,

    // File Analysis Settings
    pub n_files: i32,
    pub include_files: Vec<String>,
    // ...rest of fields...
}
