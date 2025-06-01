use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub input_fstrs: Vec<String>,
    pub depth: i32,
    pub n_files: i32,
    pub include_files: Vec<String>,
    pub ex_files: Vec<String>,
    pub ex_authors: Vec<String>,
    pub ex_emails: Vec<String>,
    pub ex_revisions: Vec<String>,
    pub ex_messages: Vec<String>,
    pub copy_move: i32,
    pub scaled_percentages: bool,
    pub blame_exclusions: bool,
    pub dynamic_blame_history: bool,
    pub dryrun: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            input_fstrs: vec![],
            depth: 3,
            n_files: 100,
            include_files: vec![],
            ex_files: vec![],
            ex_authors: vec![],
            ex_emails: vec![],
            ex_revisions: vec![],
            ex_messages: vec![],
            copy_move: 0,
            scaled_percentages: false,
            blame_exclusions: false,
            dynamic_blame_history: false,
            dryrun: false,
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