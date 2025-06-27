use pyo3::prelude::*;
use log::info;
use std::time::Instant;
use std::env;

fn main() -> PyResult<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();

    info!("=== PyO3 GIGUI Import Test Starting ===");
    let start = Instant::now();

    // Set up Python environment
    let python_home = "/Users/dvbeek/.local/share/uv/python/cpython-3.13.2-macos-aarch64-none";
    let python_stdlib = "/Users/dvbeek/.local/share/uv/python/cpython-3.13.2-macos-aarch64-none/lib/python3.13";
    let venv_site_packages = "/Users/dvbeek/1-repos/github-boost/gitinspectorgui/.venv/lib/python3.13/site-packages";
    let project_python = "/Users/dvbeek/1-repos/github-boost/gitinspectorgui/python";

    env::set_var("PYTHONHOME", python_home);
    let python_path = format!("{}:{}:{}:{}", python_stdlib, venv_site_packages, project_python, python_stdlib);
    env::set_var("PYTHONPATH", &python_path);

    Python::with_gil(|py| -> PyResult<()> {
        info!("✅ Python GIL acquired successfully");

        info!("Step 1: Testing gigui import...");
        py.run_bound("import gigui; print(f'✅ gigui imported successfully, version: {getattr(gigui, \"__version__\", \"unknown\")}')", None, None)?;

        info!("Step 2: Testing gigui.api import...");
        py.run_bound("from gigui.api import main; print('✅ gigui.api.main imported successfully')", None, None)?;

        info!("Step 3: Testing gigui.core import...");
        py.run_bound("from gigui.core import orchestrator; print('✅ gigui.core.orchestrator imported successfully')", None, None)?;

        info!("Step 4: Testing gigui.analysis import...");
        py.run_bound("from gigui.analysis.blame import engine; print('✅ gigui.analysis.blame.engine imported successfully')", None, None)?;

        Ok(())
    })?;

    let duration = start.elapsed();
    info!("=== PyO3 GIGUI Import Test Completed in {:?} ===", duration);

    Ok(())
}
