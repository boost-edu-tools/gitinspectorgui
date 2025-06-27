use std::env;
use std::path::PathBuf;
use std::process::Command;

fn main() {
    // Get Python configuration from the current Python executable
    let python_exe = env::var("PYO3_PYTHON")
        .or_else(|_| env::var("VIRTUAL_ENV").map(|venv| format!("{}/bin/python3", venv)))
        .unwrap_or_else(|_| {
            // Try to find the project's virtual environment
            let current_dir = env::current_dir().unwrap();
            let venv_python = current_dir.join(".venv").join("bin").join("python3");
            if venv_python.exists() {
                venv_python.to_string_lossy().to_string()
            } else {
                "python3".to_string()
            }
        });

    // Get Python configuration
    if let Ok(output) = Command::new(&python_exe)
        .args(&["-c", "import sys; print(sys.executable); print(sys.prefix); print(':'.join(sys.path))"])
        .output()
    {
        let output_str = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = output_str.trim().split('\n').collect();

        if lines.len() >= 3 {
            let python_executable = lines[0];
            let python_prefix = lines[1];
            let python_path = lines[2];

            println!("cargo:rustc-env=PYO3_PYTHON={}", python_executable);
            println!("cargo:rustc-env=PYTHONHOME={}", python_prefix);
            println!("cargo:rustc-env=PYTHONPATH={}", python_path);

            // Also set the library path for linking
            let lib_path = PathBuf::from(python_prefix).join("lib");
            if lib_path.exists() {
                println!("cargo:rustc-link-search=native={}", lib_path.display());
            }
        }
    }

    tauri_build::build()
}
