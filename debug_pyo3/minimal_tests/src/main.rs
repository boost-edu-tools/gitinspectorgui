use pyo3::prelude::*;
use log::info;
use std::time::Instant;
use std::env;

fn main() -> PyResult<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();

    info!("=== PyO3 Minimal Test Starting ===");
    let start = Instant::now();

    info!("Step 1: Setting up Python environment...");

    // Set Python environment variables to help PyO3 find the Python installation
    // Based on the actual Python installation structure from `python -c "import sys; print(sys.path)"`
    let python_home = "/Users/dvbeek/.local/share/uv/python/cpython-3.13.2-macos-aarch64-none";
    let python_stdlib = "/Users/dvbeek/.local/share/uv/python/cpython-3.13.2-macos-aarch64-none/lib/python3.13";
    let venv_site_packages = "/Users/dvbeek/1-repos/github-boost/gitinspectorgui/.venv/lib/python3.13/site-packages";
    let project_python = "/Users/dvbeek/1-repos/github-boost/gitinspectorgui/python";

    info!("Setting PYTHONHOME to: {}", python_home);
    env::set_var("PYTHONHOME", python_home);

    let python_path = format!("{}:{}:{}:{}", python_stdlib, venv_site_packages, project_python, python_stdlib);
    info!("Setting PYTHONPATH to: {}", python_path);
    env::set_var("PYTHONPATH", &python_path);

    info!("Step 2: Attempting Python initialization...");

    // Test 1: Basic Python initialization
    Python::with_gil(|py| -> PyResult<()> {
        info!("✅ Python GIL acquired successfully");

        info!("Step 3: Testing basic Python execution...");
        py.run_bound("print('Hello from embedded Python!')", None, None)?;

        info!("Step 4: Testing sys module...");
        py.run_bound("import sys; print(f'Python version: {sys.version}')", None, None)?;
        py.run_bound("import sys; print(f'Python executable: {sys.executable}')", None, None)?;
        py.run_bound("import sys; print(f'Python path has {len(sys.path)} entries')", None, None)?;

        info!("Step 5: Testing JSON module...");
        py.run_bound("import json; print('JSON module imported successfully')", None, None)?;

        info!("Step 6: Testing current directory...");
        py.run_bound("import os; print(f'Current directory: {os.getcwd()}')", None, None)?;

        Ok(())
    })?;

    let duration = start.elapsed();
    info!("=== PyO3 Minimal Test Completed in {:?} ===", duration);

    Ok(())
}
