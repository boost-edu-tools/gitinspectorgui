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
    pub ex_files: Vec<String>,
    pub extensions: Vec<String>,

    // Author and Commit Filtering
    pub ex_authors: Vec<String>,
    pub ex_emails: Vec<String>,
    pub ex_revisions: Vec<String>,
    pub ex_messages: Vec<String>,
    pub since: String,
    pub until: String,

    // Output and Format Settings
    pub outfile_base: String,
    pub fix: String,
    pub file_formats: Vec<String>,
    pub view: String,

    // Analysis Options
    pub copy_move: i32,
    pub scaled_percentages: bool,
    pub blame_exclusions: String,
    pub blame_skip: bool,
    pub show_renames: bool,

    // Content Analysis
    pub deletions: bool,
    pub whitespace: bool,
    pub empty_lines: bool,
    pub comments: bool,

    // Performance Settings
    pub multithread: bool,
    pub multicore: bool,
    pub verbosity: i32,

    // Advanced Performance Tuning
    pub max_thread_workers: i32,
    pub git_log_chunk_size: i32,
    pub blame_chunk_size: i32,
    pub max_core_workers: i32,

    // Memory Management Settings
    pub memory_limit_mb: i32,
    pub enable_gc_optimization: bool,

    // Repository Analysis Depth and Scope Controls
    pub max_commit_count: i32,
    pub max_file_size_kb: i32,
    pub follow_renames: bool,
    pub ignore_merge_commits: bool,

    // Advanced Filtering Options
    pub ex_author_patterns: Vec<String>,
    pub ex_email_patterns: Vec<String>,
    pub ex_message_patterns: Vec<String>,
    pub ex_file_patterns: Vec<String>,

    // Ignore-revs File Support
    pub ignore_revs_file: String,
    pub enable_ignore_revs: bool,

    // Blame Analysis Configuration
    pub blame_follow_moves: bool,
    pub blame_ignore_whitespace: bool,
    pub blame_minimal_context: bool,
    pub blame_show_email: bool,

    // Output Format and Display Options
    pub output_encoding: String,
    pub date_format: String,
    pub author_display_format: String,
    pub line_number_format: String,

    // Excel-specific Output Options
    pub excel_max_rows: i32,
    pub excel_abbreviate_names: bool,
    pub excel_freeze_panes: bool,

    // HTML-specific Output Options
    pub html_theme: String,
    pub html_enable_search: bool,
    pub html_max_entries_per_page: i32,

    // Web Server Options
    pub server_port: i32,
    pub server_host: String,
    pub max_browser_tabs: i32,
    pub auto_open_browser: bool,

    // Development/Testing
    pub dryrun: i32,
    pub profile: i32,

    // Debug and Logging Options
    pub debug_show_main_event_loop: bool,
    pub debug_multiprocessing: bool,
    pub debug_git_commands: bool,
    pub log_git_output: bool,

    // GUI-specific
    pub gui_settings_full_path: bool,
    pub col_percent: i32,

    // Legacy Compatibility Settings
    pub legacy_mode: bool,
    pub preserve_legacy_output_format: bool,
}
