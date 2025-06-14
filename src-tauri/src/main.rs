// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{execute_analysis, get_settings, save_settings, get_engine_info, get_performance_stats, health_check, start_python_server};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            execute_analysis,
            get_settings,
            save_settings,
            get_engine_info,
            get_performance_stats,
            health_check,
            start_python_server
        ])
        .setup(|app| {
            // Start the Python HTTP server when the app starts
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = start_python_server(app_handle).await {
                    eprintln!("Failed to start Python server: {}", e);
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
