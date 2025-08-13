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

#[tauri::command]
pub async fn get_engine_info() -> Result<serde_json::Value, String> {
    Err("Python backend has been removed from this application.".to_string())
}

#[tauri::command]
pub async fn get_performance_stats() -> Result<serde_json::Value, String> {
    Err("Python backend has been removed from this application.".to_string())
}

#[tauri::command]
pub async fn get_blame_data(_settings: serde_json::Value) -> Result<serde_json::Value, String> {
    Err("Python backend has been removed from this application.".to_string())
}
