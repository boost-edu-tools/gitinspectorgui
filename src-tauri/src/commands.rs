use serde::{Deserialize, Serialize};
use tauri::command;
use reqwest;
use std::time::Duration;
use std::process::{Command, Stdio, Child};
use std::io::{BufReader, Read};
use tauri::Manager;
use std::sync::{Arc, Mutex};

const API_BASE_URL: &str = "http://127.0.0.1:8080";
const REQUEST_TIMEOUT: Duration = Duration::from_secs(300); // 5 minutes for analysis operations
const MAX_RETRIES: u32 = 3;

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
            server_port: 8080,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct EngineInfo {
    pub version: String,
    pub capabilities: Vec<String>,
    pub supported_formats: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PerformanceStats {
    pub total_requests: u64,
    pub average_response_time: f64,
    pub last_analysis_duration: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthStatus {
    pub status: String,
    pub version: String,
    pub timestamp: String,
    pub api_info: EngineInfo,
}

// HTTP client helper functions
async fn create_http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))
}

async fn make_request_with_retry<T, R>(
    _client: &reqwest::Client,
    request_builder: impl Fn() -> reqwest::RequestBuilder,
    operation_name: &str,
) -> Result<R, String>
where
    T: for<'de> Deserialize<'de>,
    R: From<T>,
{
    let mut last_error = String::new();

    for attempt in 1..=MAX_RETRIES {
        match request_builder()
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    match response.json::<T>().await {
                        Ok(data) => return Ok(R::from(data)),
                        Err(e) => {
                            last_error = format!("Failed to parse response: {}", e);
                            println!("Attempt {}/{} failed for {}: {}", attempt, MAX_RETRIES, operation_name, last_error);
                        }
                    }
                } else {
                    let status = response.status();
                    let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                    last_error = format!("HTTP {} - {}", status, error_text);
                    println!("Attempt {}/{} failed for {}: {}", attempt, MAX_RETRIES, operation_name, last_error);
                }
            }
            Err(e) => {
                last_error = format!("Request failed: {}", e);
                println!("Attempt {}/{} failed for {}: {}", attempt, MAX_RETRIES, operation_name, last_error);
            }
        }

        if attempt < MAX_RETRIES {
            tokio::time::sleep(Duration::from_millis(1000 * attempt as u64)).await;
        }
    }

    Err(format!("{} failed after {} attempts. Last error: {}", operation_name, MAX_RETRIES, last_error))
}

// Tauri command implementations
#[command]
pub async fn execute_analysis(_app: tauri::AppHandle, mut settings: Settings) -> Result<AnalysisResult, String> {
    println!("Executing analysis with settings: {:?}", settings);

    // Convert relative paths to absolute paths to fix the path resolution issue
    let mut absolute_paths = Vec::new();
    for path in &settings.input_fstrs {
        let absolute_path = if std::path::Path::new(path).is_absolute() {
            path.clone()
        } else {
            // Convert relative path to absolute path
            match std::env::current_dir() {
                Ok(current_dir) => {
                    let full_path = current_dir.join(path);
                    match full_path.canonicalize() {
                        Ok(canonical_path) => canonical_path.to_string_lossy().to_string(),
                        Err(_) => {
                            // If canonicalize fails, just use the joined path
                            full_path.to_string_lossy().to_string()
                        }
                    }
                }
                Err(_) => path.clone(), // Fallback to original path if current_dir fails
            }
        };
        absolute_paths.push(absolute_path);
        println!("Converted path '{}' to absolute path '{}'", path, absolute_paths.last().unwrap());
    }

    // Update settings with absolute paths
    settings.input_fstrs = absolute_paths;

    let client = create_http_client().await?;

    make_request_with_retry::<AnalysisResult, AnalysisResult>(
        &client,
        || client.post(&format!("{}/api/execute_analysis", API_BASE_URL))
            .json(&settings),
        "Analysis execution"
    ).await
}

#[command]
pub async fn get_settings(_app: tauri::AppHandle) -> Result<Settings, String> {
    let client = create_http_client().await?;

    make_request_with_retry::<Settings, Settings>(
        &client,
        || client.get(&format!("{}/api/settings", API_BASE_URL)),
        "Get settings"
    ).await
}

#[command]
pub async fn save_settings(_app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    println!("Saving settings: {:?}", settings);

    let client = create_http_client().await?;

    #[derive(Deserialize)]
    struct SaveResponse {
        success: bool,
        message: String,
    }

    let response: SaveResponse = make_request_with_retry::<SaveResponse, SaveResponse>(
        &client,
        || client.post(&format!("{}/api/settings", API_BASE_URL))
            .json(&settings),
        "Save settings"
    ).await?;

    if response.success {
        Ok(())
    } else {
        Err(format!("Failed to save settings: {}", response.message))
    }
}

#[command]
pub async fn get_engine_info(_app: tauri::AppHandle) -> Result<EngineInfo, String> {
    let client = create_http_client().await?;

    make_request_with_retry::<EngineInfo, EngineInfo>(
        &client,
        || client.get(&format!("{}/api/engine_info", API_BASE_URL)),
        "Get engine info"
    ).await
}

#[command]
pub async fn get_performance_stats(_app: tauri::AppHandle) -> Result<PerformanceStats, String> {
    let client = create_http_client().await?;

    make_request_with_retry::<PerformanceStats, PerformanceStats>(
        &client,
        || client.get(&format!("{}/api/performance_stats", API_BASE_URL)),
        "Get performance stats"
    ).await
}

#[command]
pub async fn health_check(_app: tauri::AppHandle) -> Result<HealthStatus, String> {
    let client = create_http_client().await?;

    make_request_with_retry::<HealthStatus, HealthStatus>(
        &client,
        || client.get(&format!("{}/health", API_BASE_URL)),
        "Health check"
    ).await
}

// Type alias for the server process state
type ServerProcess = Arc<Mutex<Option<Child>>>;

#[command]
pub async fn start_python_server(app: tauri::AppHandle) -> Result<String, String> {
    println!("Starting Python HTTP server...");

    // Check if server is already running
    let client = create_http_client().await?;
    if let Ok(response) = client.get(&format!("{}/health", API_BASE_URL)).send().await {
        if response.status().is_success() {
            println!("Python server is already running");
            return Ok("Python HTTP server is already running".to_string());
        }
    }

    // Get the resource directory path
    let resource_dir = app.path().resource_dir()
        .map_err(|e| format!("Failed to get resource directory: {}", e))?;

    // Try multiple possible paths for the Python sidecar
    let possible_paths = vec![
        resource_dir.join("dist").join("gitinspector-api-sidecar"),
        resource_dir.join("gitinspector-api-sidecar"),
        resource_dir.join("bin").join("gitinspector-api-sidecar"),
        // Python files are bundled directly in resource directory
        resource_dir.join("gigui").join("start_server.py"),
        // For development, try the source directory
        resource_dir.parent().unwrap_or(&resource_dir).join("python").join("gigui").join("start_server.py"),
    ];

    let mut sidecar_path = None;
    for path in possible_paths {
        if path.exists() {
            sidecar_path = Some(path);
            break;
        }
    }

    let sidecar_path = sidecar_path.ok_or_else(|| {
        format!("Python sidecar not found. Searched paths: {:?}",
                vec![
                    resource_dir.join("dist").join("gitinspector-api-sidecar"),
                    resource_dir.join("gitinspector-api-sidecar"),
                    resource_dir.join("bin").join("gitinspector-api-sidecar"),
                ])
    })?;

    println!("Found Python sidecar at: {}", sidecar_path.display());

    // Determine if we're using a Python script or executable
    let is_python_script = sidecar_path.extension().map_or(false, |ext| ext == "py");

    // Start the HTTP server
    let mut cmd = if is_python_script {
        let mut cmd = Command::new("python3");
        // Run as module to support relative imports
        cmd.args(["-m", "gigui.start_server"]);
        cmd.args(["--host=127.0.0.1", "--port=8080"]);
        cmd
    } else {
        let mut cmd = Command::new(&sidecar_path);
        cmd.args(["--host=127.0.0.1", "--port=8080"]);
        cmd
    };

    cmd.current_dir(&resource_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    match cmd.spawn() {
        Ok(child) => {
            let child_id = child.id();
            println!("Python HTTP server started with PID: {}", child_id);

            // Store the process handle for later cleanup
            let server_process: tauri::State<ServerProcess> = app.state();
            if let Ok(mut process) = server_process.lock() {
                *process = Some(child);
            }

            // Wait longer for server to start (especially for Python scripts)
            let wait_time = if is_python_script { 5000 } else { 3000 };
            tokio::time::sleep(Duration::from_millis(wait_time)).await;

            // Check if the server is responding
            let mut attempts = 0;
            let max_attempts = 10;

            while attempts < max_attempts {
                match client.get(&format!("{}/health", API_BASE_URL)).send().await {
                    Ok(response) if response.status().is_success() => {
                        println!("Python HTTP server is responding");
                        return Ok("Python HTTP server started successfully".to_string());
                    }
                    Ok(response) => {
                        println!("Server responded with status: {}, attempt {}/{}", response.status(), attempts + 1, max_attempts);
                    }
                    Err(e) => {
                        println!("Health check failed, attempt {}/{}: {}", attempts + 1, max_attempts, e);
                    }
                }

                attempts += 1;
                if attempts < max_attempts {
                    tokio::time::sleep(Duration::from_millis(1000)).await;
                }
            }

            // Check if process is still running
            let server_process: tauri::State<ServerProcess> = app.state();
            if let Ok(mut process) = server_process.lock() {
                if let Some(ref mut child) = process.as_mut() {
                    if let Ok(Some(exit_status)) = child.try_wait() {
                        if let Some(stderr) = child.stderr.take() {
                            let mut error_output = String::new();
                            if let Ok(_) = std::io::BufReader::new(stderr).read_to_string(&mut error_output) {
                                return Err(format!("Python server failed after startup. Exit status: {:?}, Error: {}", exit_status, error_output));
                            }
                        }
                        return Err(format!("Python server process exited with status: {:?}", exit_status));
                    }
                }
            }

            Err("Python HTTP server started but is not responding to health checks".to_string())
        }
        Err(e) => {
            Err(format!("Failed to start Python sidecar: {}", e))
        }
    }
}

#[command]
pub async fn stop_python_server(app: tauri::AppHandle) -> Result<String, String> {
    println!("Stopping Python HTTP server...");

    let server_process: tauri::State<ServerProcess> = app.state();
    let result = {
        if let Ok(mut process) = server_process.lock() {
            if let Some(mut child) = process.take() {
                match child.kill() {
                    Ok(_) => {
                        let _ = child.wait(); // Wait for the process to actually terminate
                        println!("Python server stopped successfully");
                        Ok("Python HTTP server stopped successfully".to_string())
                    }
                    Err(e) => {
                        Err(format!("Failed to stop Python server: {}", e))
                    }
                }
            } else {
                Ok("No Python server process to stop".to_string())
            }
        } else {
            Err("Failed to access server process state".to_string())
        }
    };
    result
}
