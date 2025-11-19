// All Tauri commands now return an error indicating Python backend is removed
#[tauri::command]
pub async fn execute_analysis(_settings: serde_json::Value) -> Result<serde_json::Value, String> {
    Err("Python backend has been removed from this application.".to_string())
}

#[tauri::command]
pub async fn get_settings() -> Result<serde_json::Value, String> {
    Err("Python backend has been removed from this application.".to_string())
}

#[tauri::command]
pub async fn save_settings(_settings: serde_json::Value) -> Result<(), String> {
    Err("Python backend has been removed from this application.".to_string())
}

// New command: call into gi_core::retrieve_repositories
#[tauri::command]
pub async fn retrieve_repositories(path: String, depth: u32) -> Result<serde_json::Value, String> {
    // Call the synchronous gi_core function on a blocking thread to avoid blocking the async runtime
    let path_clone = path.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        gi_core::retrieve_repositories(&path_clone, depth as usize)
    })
    .await
    .map_err(|e| format!("Join error: {}", e))?;

    match result {
        Ok(paths) => {
            let vec: Vec<String> = paths.into_iter().map(|p| p.to_string_lossy().to_string()).collect();
            serde_json::to_value(vec).map_err(|e| e.to_string())
        }
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn create_analysis_parameters(
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

    serde_json::to_value(params).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn run_initial_analysis(parameters: serde_json::Value) -> Result<serde_json::Value, String> {
    // Deserialize parameters into the gi_core AnalysisParameters
    let params: gi_core::AnalysisParameters = serde_json::from_value(parameters).map_err(|e| e.to_string())?;

    // Run the synchronous initial analysis on a blocking thread
    let res = tauri::async_runtime::spawn_blocking(move || gi_core::run_initial_analysis(params))
        .await
        .map_err(|e| format!("Join error: {}", e))?;

    match res {
        Ok(analysis_result) => serde_json::to_value(analysis_result).map_err(|e| e.to_string()),
        Err(e) => Err(e),
    }
}
