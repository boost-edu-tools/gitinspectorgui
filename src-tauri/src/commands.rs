use serde::{Deserialize, Serialize};

// Keep existing Settings struct for type safety and compatibility
#[derive(Debug, Serialize, Deserialize)]
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

    // Development/Testing
    pub dryrun: i32,

    // GUI-specific
    pub gui_settings_full_path: bool,
    pub col_percent: i32,

    // Additional required fields for Python backend compatibility
    pub ex_author_patterns: Vec<String>,
    pub ex_email_patterns: Vec<String>,
    pub ex_message_patterns: Vec<String>,
    pub ex_file_patterns: Vec<String>,
    pub ignore_revs_file: String,
    pub enable_ignore_revs: bool,
    pub blame_follow_moves: bool,
    pub blame_ignore_whitespace: bool,
    pub blame_minimal_context: bool,
    pub blame_show_email: bool,
    pub output_encoding: String,
    pub date_format: String,
    pub author_display_format: String,
    pub line_number_format: String,
    pub excel_max_rows: i32,
    pub excel_abbreviate_names: bool,
    pub excel_freeze_panes: bool,
    pub html_theme: String,
    pub html_enable_search: bool,
    pub html_max_entries_per_page: i32,
    pub server_port: i32,
    pub server_host: String,
    pub max_browser_tabs: i32,
    pub auto_open_browser: bool,
    pub profile: i32,
    pub debug_show_main_event_loop: bool,
    pub debug_multiprocessing: bool,
    pub debug_git_commands: bool,
    pub log_git_output: bool,
    pub legacy_mode: bool,
    pub preserve_legacy_output_format: bool,
    pub max_thread_workers: i32,
    pub git_log_chunk_size: i32,
    pub blame_chunk_size: i32,
    pub max_core_workers: i32,
    pub memory_limit_mb: i32,
    pub enable_gc_optimization: bool,
    pub max_commit_count: i32,
    pub max_file_size_kb: i32,
    pub follow_renames: bool,
    pub ignore_merge_commits: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            // Repository and Input Settings
            input_fstrs: vec![],
            depth: 5,
            subfolder: String::new(),

            // File Analysis Settings
            n_files: 5,
            include_files: vec![],
            ex_files: vec![],
            extensions: vec!["c".to_string(), "cc".to_string(), "cif".to_string(), "cpp".to_string(),
                           "glsl".to_string(), "h".to_string(), "hh".to_string(), "hpp".to_string(),
                           "java".to_string(), "js".to_string(), "py".to_string(), "rb".to_string(),
                           "sql".to_string(), "ts".to_string()],

            // Author and Commit Filtering
            ex_authors: vec![],
            ex_emails: vec![],
            ex_revisions: vec![],
            ex_messages: vec![],
            since: String::new(),
            until: String::new(),

            // Output and Format Settings
            outfile_base: "gitinspect".to_string(),
            fix: "prefix".to_string(),
            file_formats: vec!["html".to_string()],
            view: "auto".to_string(),

            // Analysis Options
            copy_move: 1,
            scaled_percentages: false,
            blame_exclusions: "hide".to_string(),
            blame_skip: false,
            show_renames: false,

            // Content Analysis
            deletions: false,
            whitespace: false,
            empty_lines: false,
            comments: false,

            // Performance Settings
            multithread: true,
            multicore: false,
            verbosity: 0,

            // Development/Testing
            dryrun: 0,

            // GUI-specific
            gui_settings_full_path: false,
            col_percent: 75,

            // Additional required fields for Python backend compatibility
            ex_author_patterns: vec![],
            ex_email_patterns: vec![],
            ex_message_patterns: vec![],
            ex_file_patterns: vec![],
            ignore_revs_file: String::new(),
            enable_ignore_revs: false,
            blame_follow_moves: true,
            blame_ignore_whitespace: false,
            blame_minimal_context: false,
            blame_show_email: true,
            output_encoding: "utf-8".to_string(),
            date_format: "iso".to_string(),
            author_display_format: "name".to_string(),
            line_number_format: "decimal".to_string(),
            excel_max_rows: 1048576,
            excel_abbreviate_names: true,
            excel_freeze_panes: true,
            html_theme: "default".to_string(),
            html_enable_search: true,
            html_max_entries_per_page: 100,
            server_port: 8000,
            server_host: "localhost".to_string(),
            max_browser_tabs: 20,
            auto_open_browser: true,
            profile: 0,
            debug_show_main_event_loop: false,
            debug_multiprocessing: false,
            debug_git_commands: false,
            log_git_output: false,
            legacy_mode: false,
            preserve_legacy_output_format: false,
            max_thread_workers: 6,
            git_log_chunk_size: 100,
            blame_chunk_size: 20,
            max_core_workers: 16,
            memory_limit_mb: 1024,
            enable_gc_optimization: true,
            max_commit_count: 0,
            max_file_size_kb: 1024,
            follow_renames: true,
            ignore_merge_commits: false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub repositories: Vec<RepositoryResult>,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepositoryResult {
    pub name: String,
    pub path: String,
    pub authors: Vec<AuthorStat>,
    pub files: Vec<FileStat>,
    pub blame_data: Vec<BlameEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthorStat {
    pub name: String,
    pub email: String,
    pub commits: i32,
    pub insertions: i32,
    pub deletions: i32,
    pub files: i32,
    pub percentage: f64,
    pub age: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileStat {
    pub name: String,
    pub path: String,
    pub lines: i32,
    pub commits: i32,
    pub authors: i32,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlameEntry {
    pub file: String,
    pub line_number: i32,
    pub author: String,
    pub commit: String,
    pub date: String,
    pub content: String,
}

// NOTE: With tauri-plugin-python, these commands are now just placeholders.
// The actual Python functions are called directly from JavaScript using the plugin API.
// These commands are kept for backward compatibility with the existing frontend.

#[tauri::command]
pub async fn execute_analysis(_settings: Settings) -> Result<AnalysisResult, String> {
    Err("This command is deprecated. Use the JavaScript API with tauri-plugin-python instead.".to_string())
}

#[tauri::command]
pub async fn get_settings() -> Result<Settings, String> {
    Err("This command is deprecated. Use the JavaScript API with tauri-plugin-python instead.".to_string())
}

#[tauri::command]
pub async fn save_settings(_settings: Settings) -> Result<(), String> {
    Err("This command is deprecated. Use the JavaScript API with tauri-plugin-python instead.".to_string())
}

#[tauri::command]
pub async fn get_engine_info() -> Result<serde_json::Value, String> {
    Err("This command is deprecated. Use the JavaScript API with tauri-plugin-python instead.".to_string())
}

#[tauri::command]
pub async fn get_performance_stats() -> Result<serde_json::Value, String> {
    Err("This command is deprecated. Use the JavaScript API with tauri-plugin-python instead.".to_string())
}

#[tauri::command]
pub async fn health_check() -> Result<serde_json::Value, String> {
    Err("This command is deprecated. Use the JavaScript API with tauri-plugin-python instead.".to_string())
}
