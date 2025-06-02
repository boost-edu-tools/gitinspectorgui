use serde::{Deserialize, Serialize};
use tauri::command;
use reqwest;
use std::time::Duration;

const API_BASE_URL: &str = "http://127.0.0.1:8080";
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
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
pub async fn execute_analysis(_app: tauri::AppHandle, settings: Settings) -> Result<AnalysisResult, String> {
    println!("Executing analysis with settings: {:?}", settings);
    
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
