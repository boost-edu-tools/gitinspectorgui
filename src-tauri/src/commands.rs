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

#[command]
pub async fn execute_analysis(settings: Settings) -> Result<AnalysisResult, String> {
    println!("Executing analysis with settings: {:?}", settings);
    
    // Call Python backend
    let settings_json = serde_json::to_string(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    let output = std::process::Command::new("uv")
        .arg("run")
        .arg("python")
        .arg("python/gigui/api.py")
        .arg("execute_analysis")
        .arg(&settings_json)
        .output()
        .map_err(|e| format!("Failed to execute Python backend: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python backend failed: {}", stderr));
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: AnalysisResult = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse Python response: {}", e))?;
    
    Ok(result)
}

#[command]
pub async fn get_settings() -> Result<Settings, String> {
    let output = std::process::Command::new("uv")
        .arg("run")
        .arg("python")
        .arg("python/gigui/api.py")
        .arg("get_settings")
        .output()
        .map_err(|e| format!("Failed to execute Python backend: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python backend failed: {}", stderr));
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let settings: Settings = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse Python response: {}", e))?;
    
    Ok(settings)
}

#[command]
pub async fn save_settings(settings: Settings) -> Result<(), String> {
    println!("Saving settings: {:?}", settings);
    
    let settings_json = serde_json::to_string(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    let output = std::process::Command::new("uv")
        .arg("run")
        .arg("python")
        .arg("python/gigui/api.py")
        .arg("save_settings")
        .arg(&settings_json)
        .output()
        .map_err(|e| format!("Failed to execute Python backend: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python backend failed: {}", stderr));
    }
    
    Ok(())
}