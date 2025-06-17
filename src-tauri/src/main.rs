// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{execute_analysis, get_settings, save_settings, get_engine_info, get_performance_stats, health_check, start_python_server, stop_python_server};
use std::sync::{Arc, Mutex};
use std::process::Child;

// Global state to track the Python server process
type ServerProcess = Arc<Mutex<Option<Child>>>;

fn main() {
    let server_process: ServerProcess = Arc::new(Mutex::new(None));
    let server_process_clone = server_process.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .manage(server_process)
        .invoke_handler(tauri::generate_handler![
            execute_analysis,
            get_settings,
            save_settings,
            get_engine_info,
            get_performance_stats,
            health_check,
            start_python_server,
            stop_python_server
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
        .on_window_event(move |_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Clean up Python server when window is closing
                if let Ok(mut process) = server_process_clone.lock() {
                    if let Some(mut child) = process.take() {
                        println!("Stopping Python server on app exit...");
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
