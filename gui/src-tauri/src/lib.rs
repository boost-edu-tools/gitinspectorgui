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

#[tauri::command]
async fn rerun_analysis(previous: serde_json::Value, new_parameters: serde_json::Value) -> Result<serde_json::Value, String> {
    let prev: gi_core::AnalysisResult = serde_json::from_value(previous).map_err(|e| e.to_string())?;
    let params: gi_core::AnalysisParameters = serde_json::from_value(new_parameters).map_err(|e| e.to_string())?;

    let res = tauri::async_runtime::spawn_blocking(move || gi_core::rerun_analysis(&prev, params))
        .await
        .map_err(|e| format!("Join error: {}", e))?;

    match res {
        Ok(analysis_result) => serde_json::to_value(analysis_result).map_err(|e| e.to_string()),
        Err(e) => Err(e),
    }
}

#[tauri::command]
fn verify_filter(filter: gi_core::Filter, is_path_filter: bool) -> bool {
    gi_core::verify_filter(&filter, is_path_filter)
}

#[tauri::command]
async fn load_settings_json(path: String) -> Result<serde_json::Value, String> {
    let p = path.clone();
    let res = tauri::async_runtime::spawn_blocking(move || gi_core::load_settings_json(std::path::Path::new(&p)))
        .await
        .map_err(|e| format!("Join error: {}", e))?;

    match res {
        Ok(settings) => serde_json::to_value(settings).map_err(|e| e.to_string()),
        Err(e) => Err(e),
    }
}

#[tauri::command]
async fn save_settings_json(settings: serde_json::Value, path: String) -> Result<serde_json::Value, String> {
    let s: gi_core::Settings = serde_json::from_value(settings).map_err(|e| e.to_string())?;
    let p = path.clone();
    let res = tauri::async_runtime::spawn_blocking(move || gi_core::save_settings_json(&s, std::path::Path::new(&p)))
        .await
        .map_err(|e| format!("Join error: {}", e))?;

    match res {
        Ok(pathbuf) => serde_json::to_value(pathbuf.to_string_lossy().to_string()).map_err(|e| e.to_string()),
        Err(e) => Err(e),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            retrieve_repositories,
            create_analysis_parameters,
            run_initial_analysis,
            rerun_analysis,
            verify_filter,
            load_settings_json,
            save_settings_json,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
