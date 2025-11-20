// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn retrieve_repositories(path: String, depth: usize) -> Result<serde_json::Value, String> {
    let result = gi_core::retrieve_repositories(&path.clone(), depth);

    match result {
        Ok(repos) => {
            let json = serde_json::to_value(repos).map_err(|e| e.to_string())?;
            Ok(json)
        },
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn create_analysis_parameters(
    repo_path: String, 
    from_time: Option<String>,
    to_time: Option<String>,
    from_commit: Option<String>,
    to_commit: Option<String>,
    commit_hash_filter: Option<gi_core::Filter>,
    commit_message_filter: Option<gi_core::Filter>,
    file_types_filter: Option<gi_core::Filter>,
    path_filter: Option<gi_core::Filter>,
) -> Result<serde_json::Value, String> {
    let params = gi_core::create_analysis_parameters(
        repo_path,
        from_time,
        to_time,
        from_commit,
        to_commit,
        commit_hash_filter,
        commit_message_filter,
        file_types_filter,
        path_filter,
    );

    let json = serde_json::to_value(params).map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
async fn run_initial_analysis(params: gi_core::AnalysisParameters) -> Result<serde_json::Value, String> {
    // Deserialize parameters into the gi_core AnalysisParameters
    // let params: gi_core::AnalysisParameters = serde_json::from_value(parameters).map_err(|e| e.to_string())?;
    
    let result = gi_core::run_initial_analysis(params);

    match result {
        Ok(analysis_result) => {
            let json = serde_json::to_value(analysis_result).map_err(|e| e.to_string())?;
            Ok(json)
        },
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, retrieve_repositories, create_analysis_parameters, run_initial_analysis])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
