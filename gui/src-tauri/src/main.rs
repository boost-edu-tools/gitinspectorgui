#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging - this makes RUST_LOG environment variable functional
    env_logger::init();
    log::info!("Starting GitInspectorGUI application");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::execute_analysis,
            commands::get_settings,
            commands::save_settings,
            commands::retrieve_repositories,
            commands::create_analysis_parameters,
            commands::run_initial_analysis
        ])
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
