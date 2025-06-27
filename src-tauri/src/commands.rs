use serde::{Deserialize, Serialize};
use tauri::command;

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

use pyo3::prelude::*;
use std::sync::Mutex;

// Global Python interpreter state
static PYTHON_INITIALIZED: Mutex<bool> = Mutex::new(false);

// Helper function to call Python functions with PyO3
async fn call_python_function(
    function_name: &str,
    args: Option<&str>,
) -> Result<String, String> {
    // Ensure Python is initialized
    {
        let mut initialized = PYTHON_INITIALIZED.lock().unwrap();
        if !*initialized {
            // Set up Python environment variables based on our debugging findings
            // These paths are critical for PyO3 to find the Python standard library
            let python_home = "/Users/dvbeek/.local/share/uv/python/cpython-3.13.2-macos-aarch64-none";
            let python_stdlib = "/Users/dvbeek/.local/share/uv/python/cpython-3.13.2-macos-aarch64-none/lib/python3.13";
            let venv_site_packages = "/Users/dvbeek/1-repos/github-boost/gitinspectorgui/.venv/lib/python3.13/site-packages";
            let project_python = "/Users/dvbeek/1-repos/github-boost/gitinspectorgui/python";

            std::env::set_var("PYTHONHOME", python_home);
            let python_path = format!("{}:{}:{}:{}", python_stdlib, venv_site_packages, project_python, python_stdlib);
            std::env::set_var("PYTHONPATH", &python_path);

            pyo3::prepare_freethreaded_python();
            *initialized = true;
        }
    }

    Python::with_gil(|py| {
        // Initialize Python path
        let sys = py.import_bound("sys")
            .map_err(|e| format!("Failed to import sys: {}", e))?;
        let path = sys.getattr("path")
            .map_err(|e| format!("Failed to get sys.path: {}", e))?;

        // Add both Python directories to the path
        // 1. The bridge module is in src-tauri/python/
        let bridge_python_dir = std::env::current_dir()
            .map_err(|e| format!("Failed to get current dir: {}", e))?
            .join("src-tauri")
            .join("python");

        path.call_method1("insert", (0, bridge_python_dir.to_string_lossy().as_ref()))
            .map_err(|e| format!("Failed to add bridge python dir to sys.path: {}", e))?;

        // 2. The main gigui package is in python/
        let main_python_dir = std::env::current_dir()
            .map_err(|e| format!("Failed to get current dir: {}", e))?
            .join("python");

        path.call_method1("insert", (0, main_python_dir.to_string_lossy().as_ref()))
            .map_err(|e| format!("Failed to add main python dir to sys.path: {}", e))?;

        // Import our main module
        let module = py.import_bound("main")
            .map_err(|e| format!("Failed to import main module: {}", e))?;

        let function = module.getattr(function_name)
            .map_err(|e| format!("Function '{}' not found: {}", function_name, e))?;

        let result = match args {
            Some(args_str) => {
                function.call1((args_str,))
                    .map_err(|e| format!("Python function call failed: {}", e))?
            }
            None => {
                function.call0()
                    .map_err(|e| format!("Python function call failed: {}", e))?
            }
        };

        let result_str: String = result.extract()
            .map_err(|e| format!("Failed to extract result as string: {}", e))?;

        Ok(result_str)
    })
}

#[command]
pub async fn execute_analysis(
    mut settings: Settings,
) -> Result<AnalysisResult, String> {
    println!("Executing analysis with PyO3");

    // Convert relative paths to absolute paths (same logic as before)
    let mut absolute_paths = Vec::new();
    for path in &settings.input_fstrs {
        let absolute_path = if std::path::Path::new(path).is_absolute() {
            path.clone()
        } else {
            match std::env::current_dir() {
                Ok(current_dir) => {
                    let full_path = current_dir.join(path);
                    match full_path.canonicalize() {
                        Ok(canonical_path) => canonical_path.to_string_lossy().to_string(),
                        Err(_) => full_path.to_string_lossy().to_string(),
                    }
                }
                Err(_) => path.clone(),
            }
        };
        absolute_paths.push(absolute_path);
    }
    settings.input_fstrs = absolute_paths;

    // Serialize settings to JSON
    let settings_json = serde_json::to_string(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    // Call Python function
    let result_json = call_python_function("execute_analysis", Some(&settings_json)).await?;

    // Deserialize result
    let result: AnalysisResult = serde_json::from_str(&result_json)
        .map_err(|e| format!("Failed to deserialize analysis result: {}", e))?;

    Ok(result)
}

#[command]
pub async fn get_settings() -> Result<Settings, String> {
    let result_json = call_python_function("get_settings", None).await?;

    let settings: Settings = serde_json::from_str(&result_json)
        .map_err(|e| format!("Failed to deserialize settings: {}", e))?;

    Ok(settings)
}

#[command]
pub async fn save_settings(settings: Settings) -> Result<(), String> {
    let settings_json = serde_json::to_string(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    let result_json = call_python_function("save_settings", Some(&settings_json)).await?;

    #[derive(Deserialize)]
    struct SaveResponse {
        success: bool,
        error: Option<String>,
    }

    let response: SaveResponse = serde_json::from_str(&result_json)
        .map_err(|e| format!("Failed to deserialize save response: {}", e))?;

    if response.success {
        Ok(())
    } else {
        Err(response.error.unwrap_or_else(|| "Unknown error saving settings".to_string()))
    }
}

#[command]
pub async fn get_engine_info() -> Result<serde_json::Value, String> {
    let result_json = call_python_function("get_engine_info", None).await?;

    let engine_info: serde_json::Value = serde_json::from_str(&result_json)
        .map_err(|e| format!("Failed to deserialize engine info: {}", e))?;

    Ok(engine_info)
}

#[command]
pub async fn get_performance_stats() -> Result<serde_json::Value, String> {
    let result_json = call_python_function("get_performance_stats", None).await?;

    let stats: serde_json::Value = serde_json::from_str(&result_json)
        .map_err(|e| format!("Failed to deserialize performance stats: {}", e))?;

    Ok(stats)
}

#[command]
pub async fn health_check() -> Result<serde_json::Value, String> {
    let result_json = call_python_function("health_check", None).await?;

    let health_status: serde_json::Value = serde_json::from_str(&result_json)
        .map_err(|e| format!("Failed to deserialize health status: {}", e))?;

    Ok(health_status)
}
