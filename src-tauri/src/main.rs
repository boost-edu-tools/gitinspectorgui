// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{execute_analysis, get_settings, save_settings};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            execute_analysis,
            get_settings,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}