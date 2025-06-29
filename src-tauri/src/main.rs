#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_python::init_and_register(vec![
            "execute_analysis",
            "get_settings",
            "save_settings",
            "get_engine_info",
            "get_performance_stats",
            "health_check"
        ]))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            commands::execute_analysis,
            commands::get_settings,
            commands::save_settings,
            commands::get_engine_info,
            commands::get_performance_stats,
            commands::health_check
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
