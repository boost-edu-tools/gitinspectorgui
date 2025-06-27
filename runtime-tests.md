# PyO3 Runtime Debug Plan - Cline Implementation

## Overview

Systematic debugging plan for FastAPI to PyO3 conversion runtime issues. Application builds successfully but hangs during startup.

## Pre-Debugging Setup

### Create Debug Directory Structure

```bash
mkdir -p debug_pyo3/{minimal_tests,logs,temp_builds}
cd debug_pyo3
```

### Environment Verification Script

```bash
# Create: debug_pyo3/verify_env.py
cat > verify_env.py << 'EOF'
#!/usr/bin/env python3
import sys
import os
import json
from pathlib import Path

def verify_environment():
    info = {
        "python_executable": sys.executable,
        "python_version": sys.version,
        "python_path": sys.path,
        "current_working_directory": os.getcwd(),
        "gigui_importable": False,
        "gigui_location": None,
        "virtual_env": os.environ.get("VIRTUAL_ENV"),
        "conda_env": os.environ.get("CONDA_DEFAULT_ENV")
    }

    try:
        import gigui
        info["gigui_importable"] = True
        info["gigui_location"] = str(Path(gigui.__file__).parent)
        info["gigui_version"] = getattr(gigui, "__version__", "unknown")
    except ImportError as e:
        info["gigui_import_error"] = str(e)

    print(json.dumps(info, indent=2))
    return info

if __name__ == "__main__":
    verify_environment()
EOF

python verify_env.py > logs/python_env_baseline.json
```

## Phase 1: Minimal PyO3 Testing (30-60 minutes)

### Step 1.1: Basic PyO3 Hello World

```bash
# Create: debug_pyo3/minimal_tests/Cargo.toml
cat > minimal_tests/Cargo.toml << 'EOF'
[package]
name = "pyo3-minimal-test"
version = "0.1.0"
edition = "2021"

[dependencies]
pyo3 = { version = "0.22", features = ["auto-initialize"] }
env_logger = "0.11"
log = "0.4"
EOF

# Create: debug_pyo3/minimal_tests/src/main.rs
cat > minimal_tests/src/main.rs << 'EOF'
use pyo3::prelude::*;
use log::{info, error, debug};
use std::time::Instant;

fn main() -> PyResult<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();

    info!("=== PyO3 Minimal Test Starting ===");
    let start = Instant::now();

    info!("Step 1: Attempting Python initialization...");

    // Test 1: Basic Python initialization
    Python::with_gil(|py| -> PyResult<()> {
        info!("✅ Python GIL acquired successfully");

        info!("Step 2: Testing basic Python execution...");
        py.run("print('Hello from embedded Python!')", None, None)?;

        info!("Step 3: Testing sys module...");
        py.run("import sys; print(f'Python version: {sys.version}')", None, None)?;
        py.run("import sys; print(f'Python executable: {sys.executable}')", None, None)?;
        py.run("import sys; print(f'Python path has {len(sys.path)} entries')", None, None)?;

        info!("Step 4: Testing JSON module...");
        py.run("import json; print('JSON module imported successfully')", None, None)?;

        info!("Step 5: Testing current directory...");
        py.run("import os; print(f'Current directory: {os.getcwd()}')", None, None)?;

        Ok(())
    })?;

    let duration = start.elapsed();
    info!("=== PyO3 Minimal Test Completed in {:?} ===", duration);

    Ok(())
}
EOF

mkdir -p minimal_tests/src
```

### Step 1.2: Test Basic PyO3 Function

```bash
cd minimal_tests
cargo run 2>&1 | tee ../logs/minimal_test_1.log
cd ..
```

**Expected Outcome**: Should complete in under 5 seconds. If it hangs here, the issue is fundamental PyO3 setup.

### Step 1.3: Environment Detection Test

```rust
// Add to minimal_tests/src/main.rs before the main test
fn test_python_environment() -> PyResult<()> {
    info!("=== Testing Python Environment Detection ===");

    Python::with_gil(|py| -> PyResult<()> {
        // Get Python configuration
        let sys = py.import("sys")?;
        let os = py.import("os")?;

        info!("Python executable: {:?}", sys.getattr("executable")?);
        info!("Python version: {:?}", sys.getattr("version")?);
        info!("Python platform: {:?}", sys.getattr("platform")?);

        // Check virtual environment
        let virtual_env = os.getattr("environ")?.call_method1("get", ("VIRTUAL_ENV",))?;
        info!("Virtual environment: {:?}", virtual_env);

        // Check if we can access the current project
        let path_list: Vec<String> = sys.getattr("path")?.extract()?;
        info!("Python path entries:");
        for (i, path) in path_list.iter().enumerate() {
            info!("  {}: {}", i, path);
        }

        Ok(())
    })
}
```

## Phase 2: Module Import Testing (1-2 hours)

### Step 2.1: Progressive Import Test

```bash
# Create: debug_pyo3/minimal_tests/src/import_test.rs
cat > minimal_tests/src/import_test.rs << 'EOF'
use pyo3::prelude::*;
use log::{info, error, warn};
use std::time::Instant;

pub fn test_imports_progressively() -> PyResult<()> {
    info!("=== Progressive Import Testing ===");

    let imports_to_test = vec![
        // Standard library imports
        ("sys", "System module"),
        ("os", "Operating system interface"),
        ("json", "JSON encoder/decoder"),
        ("pathlib", "Path manipulation"),
        ("time", "Time functions"),

        // Third-party imports (may fail in embedded environment)
        ("requests", "HTTP library"),
        ("fastapi", "FastAPI framework"),
        ("pydantic", "Data validation"),
        ("uvicorn", "ASGI server"),

        // Project-specific imports
        ("gigui", "Main project module"),
        ("gigui.core", "Core functionality"),
        ("gigui.api", "API functionality"),
    ];

    Python::with_gil(|py| -> PyResult<()> {
        for (module_name, description) in imports_to_test {
            let start = Instant::now();
            info!("Testing import: {} ({})", module_name, description);

            match py.run(&format!("import {}", module_name), None, None) {
                Ok(_) => {
                    let duration = start.elapsed();
                    info!("  ✅ {} imported successfully in {:?}", module_name, duration);

                    // Try to get module info
                    if let Ok(module) = py.import(module_name) {
                        if let Ok(file_attr) = module.getattr("__file__") {
                            info!("     Location: {:?}", file_attr);
                        }
                        if let Ok(version_attr) = module.getattr("__version__") {
                            info!("     Version: {:?}", version_attr);
                        }
                    }
                }
                Err(e) => {
                    let duration = start.elapsed();
                    warn!("  ❌ {} failed to import in {:?}: {}", module_name, duration, e);

                    // If this is a critical module, provide more details
                    if module_name == "gigui" {
                        error!("CRITICAL: gigui module import failed!");
                        error!("This is likely the root cause of the runtime hang.");

                        // Try to understand why
                        match py.run("import sys; print('\\n'.join(sys.path))", None, None) {
                            Ok(_) => info!("Python path printed above"),
                            Err(e) => error!("Could not print Python path: {}", e),
                        }
                    }
                }
            }
        }
        Ok(())
    })
}
EOF

# Add to main.rs
echo '
mod import_test;
use import_test::test_imports_progressively;

// Add this call in main() after the basic test
test_imports_progressively()?;
' >> minimal_tests/src/main.rs
```

### Step 2.2: Run Import Test

```bash
cd minimal_tests
cargo run 2>&1 | tee ../logs/import_test.log
cd ..
```

## Phase 3: Timeout and Recovery Mechanisms (30 minutes)

### Step 3.1: Timeout Wrapper

```bash
# Create: debug_pyo3/minimal_tests/src/timeout_test.rs
cat > minimal_tests/src/timeout_test.rs << 'EOF'
use pyo3::prelude::*;
use log::{info, error, warn};
use std::time::{Duration, Instant};
use std::thread;
use std::sync::mpsc;

pub fn test_with_timeout<F>(name: &str, timeout_secs: u64, test_fn: F) -> Result<(), String>
where
    F: FnOnce() -> PyResult<()> + Send + 'static,
{
    info!("Running test '{}' with {}s timeout", name, timeout_secs);

    let (tx, rx) = mpsc::channel();
    let test_name = name.to_string();

    // Spawn test in separate thread
    thread::spawn(move || {
        let start = Instant::now();
        match test_fn() {
            Ok(_) => {
                let duration = start.elapsed();
                let _ = tx.send(Ok(format!("✅ {} completed in {:?}", test_name, duration)));
            }
            Err(e) => {
                let duration = start.elapsed();
                let _ = tx.send(Err(format!("❌ {} failed in {:?}: {}", test_name, duration, e)));
            }
        }
    });

    // Wait for result or timeout
    match rx.recv_timeout(Duration::from_secs(timeout_secs)) {
        Ok(Ok(success_msg)) => {
            info!("{}", success_msg);
            Ok(())
        }
        Ok(Err(error_msg)) => {
            error!("{}", error_msg);
            Err(error_msg)
        }
        Err(_) => {
            let error_msg = format!("⏰ Test '{}' timed out after {}s", name, timeout_secs);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

pub fn test_gigui_import_with_timeout() -> Result<(), String> {
    test_with_timeout("gigui_import", 10, || {
        Python::with_gil(|py| -> PyResult<()> {
            info!("Attempting to import gigui module...");
            py.run("import gigui", None, None)?;
            info!("gigui imported successfully");

            py.run("from gigui.core import AnalysisEngine", None, None)?;
            info!("AnalysisEngine imported successfully");

            py.run("from gigui.api import create_settings_from_dict", None, None)?;
            info!("API functions imported successfully");

            Ok(())
        })
    })
}
EOF
```

### Step 3.2: Integration Test with Actual FastAPI Code

```bash
# Create: debug_pyo3/minimal_tests/src/fastapi_test.rs
cat > minimal_tests/src/fastapi_test.rs << 'EOF'
use pyo3::prelude::*;
use log::{info, error};
use std::collections::HashMap;

pub fn test_fastapi_integration() -> PyResult<()> {
    info!("=== Testing FastAPI Integration ===");

    Python::with_gil(|py| -> PyResult<()> {
        // Test 1: Import core components
        info!("Importing core analysis components...");
        py.run("from gigui.core import AnalysisEngine", None, None)?;
        py.run("from gigui.api import create_settings_from_dict", None, None)?;
        py.run("from gigui.settings import Settings", None, None)?;
        info!("✅ Core components imported");

        // Test 2: Create settings (mimicking API request)
        info!("Testing settings creation...");
        let settings_dict = r#"
settings_dict = {
    "input_fstrs": ["."],
    "n_files": 10,
    "file_filter": ".*\\.(py|rs|js|ts)$"
}
settings = create_settings_from_dict(settings_dict)
print(f"Settings created: {type(settings)}")
"#;
        py.run(settings_dict, None, None)?;
        info!("✅ Settings created successfully");

        // Test 3: Initialize AnalysisEngine
        info!("Testing AnalysisEngine initialization...");
        py.run("engine = AnalysisEngine()", None, None)?;
        py.run("print(f'Engine initialized: {type(engine)}')", None, None)?;
        info!("✅ AnalysisEngine initialized");

        // Test 4: Get engine info (lightweight operation)
        info!("Testing engine info retrieval...");
        py.run("info = engine.get_engine_info()", None, None)?;
        py.run("print(f'Engine info keys: {list(info.keys())}')", None, None)?;
        info!("✅ Engine info retrieved");

        Ok(())
    })
}
EOF
```

## Phase 4: Build Script Debugging (1 hour)

### Step 4.1: Python Detection Script

```bash
# Create: debug_pyo3/build_debug.py
cat > build_debug.py << 'EOF'
#!/usr/bin/env python3
"""
Debug script to verify Python environment for PyO3 embedding
Run this before attempting PyO3 build
"""
import sys
import os
import sysconfig
import subprocess
from pathlib import Path

def get_python_config():
    """Get Python configuration for PyO3"""
    config = {
        "executable": sys.executable,
        "version": sys.version_info,
        "platform": sys.platform,
        "prefix": sys.prefix,
        "exec_prefix": sys.exec_prefix,
        "base_prefix": sys.base_prefix,
        "library_dirs": [],
        "include_dirs": [],
        "libraries": [],
        "python_path": sys.path,
        "virtual_env": os.environ.get("VIRTUAL_ENV"),
        "conda_env": os.environ.get("CONDA_DEFAULT_ENV"),
    }

    # Get library information
    try:
        config["library_dirs"] = sysconfig.get_path("stdlib")
        config["include_dirs"] = sysconfig.get_path("include")
        config["platlib"] = sysconfig.get_path("platlib")
        config["purelib"] = sysconfig.get_path("purelib")
    except Exception as e:
        print(f"Warning: Could not get sysconfig paths: {e}")

    # Try to find Python library
    try:
        import distutils.util
        config["platform_tag"] = distutils.util.get_platform()
    except Exception:
        pass

    return config

def verify_gigui_installation():
    """Verify gigui can be imported and its location"""
    try:
        import gigui
        return {
            "importable": True,
            "location": str(Path(gigui.__file__).parent),
            "version": getattr(gigui, "__version__", "unknown"),
            "submodules": []
        }
    except ImportError as e:
        return {
            "importable": False,
            "error": str(e),
            "suggestion": "Run 'uv sync' or 'pip install -e .' in the python directory"
        }

def check_uv_environment():
    """Check if we're in a uv-managed environment"""
    try:
        result = subprocess.run(["uv", "pip", "list"], capture_output=True, text=True)
        if result.returncode == 0:
            return {
                "uv_available": True,
                "packages": result.stdout.split('\n')[:10],  # First 10 packages
                "in_uv_env": "VIRTUAL_ENV" in os.environ
            }
    except FileNotFoundError:
        pass

    return {"uv_available": False}

def main():
    print("=== Python Environment Debug for PyO3 ===")
    print()

    config = get_python_config()
    print("Python Configuration:")
    for key, value in config.items():
        if isinstance(value, list) and len(value) > 5:
            print(f"  {key}: {len(value)} items (showing first 3)")
            for item in value[:3]:
                print(f"    - {item}")
        else:
            print(f"  {key}: {value}")

    print("\n" + "="*50)
    print("gigui Module Check:")
    gigui_info = verify_gigui_installation()
    for key, value in gigui_info.items():
        print(f"  {key}: {value}")

    print("\n" + "="*50)
    print("uv Environment Check:")
    uv_info = check_uv_environment()
    for key, value in uv_info.items():
        print(f"  {key}: {value}")

    print("\n" + "="*50)
    print("Recommendations:")
    if not gigui_info.get("importable", False):
        print("❌ gigui not importable - this will cause PyO3 to hang")
        print("   Fix: cd python && uv sync")
    else:
        print("✅ gigui is importable")

    if config.get("virtual_env"):
        print("✅ Running in virtual environment")
    else:
        print("⚠️  Not in virtual environment - may cause path issues")

    if uv_info.get("uv_available", False):
        print("✅ uv is available")
    else:
        print("⚠️  uv not available - using pip instead")

if __name__ == "__main__":
    main()
EOF

python build_debug.py > logs/build_debug.log 2>&1
```

## Phase 5: Integration and Final Testing (2-3 hours)

### Step 5.1: Full Integration Test

```bash
# Create: debug_pyo3/integration_test/Cargo.toml
mkdir -p integration_test/src
cat > integration_test/Cargo.toml << 'EOF'
[package]
name = "pyo3-integration-test"
version = "0.1.0"
edition = "2021"

[dependencies]
pyo3 = { version = "0.22", features = ["auto-initialize"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
env_logger = "0.11"
log = "0.4"
tokio = { version = "1.0", features = ["full"] }

[build-dependencies]
pyo3-build-config = "0.22"
EOF

# Create: debug_pyo3/integration_test/build.rs
cat > integration_test/build.rs << 'EOF'
use pyo3_build_config::PythonVersion;
use std::env;

fn main() {
    println!("cargo:rerun-if-changed=build.rs");

    // Get Python configuration
    let config = pyo3_build_config::get();
    println!("cargo:warning=Python version: {}", config.version);
    println!("cargo:warning=Python executable: {:?}", config.executable);

    // Print environment variables for debugging
    for (key, value) in env::vars() {
        if key.starts_with("PYTHON") || key.contains("VIRTUAL") {
            println!("cargo:warning={}={}", key, value);
        }
    }
}
EOF

# Create: debug_pyo3/integration_test/src/main.rs
cat > integration_test/src/main.rs << 'EOF'
use pyo3::prelude::*;
use serde_json::Value;
use log::{info, error};
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    info!("=== PyO3 Full Integration Test ===");

    // Test 1: Basic initialization
    test_basic_initialization()?;

    // Test 2: Module imports
    test_module_imports()?;

    // Test 3: API simulation
    test_api_simulation().await?;

    info!("=== All Integration Tests Passed ===");
    Ok(())
}

fn test_basic_initialization() -> PyResult<()> {
    info!("Testing basic PyO3 initialization...");
    let start = Instant::now();

    Python::with_gil(|py| -> PyResult<()> {
        py.run("print('PyO3 initialization successful')", None, None)?;
        Ok(())
    })?;

    info!("✅ Basic initialization completed in {:?}", start.elapsed());
    Ok(())
}

fn test_module_imports() -> PyResult<()> {
    info!("Testing critical module imports...");
    let start = Instant::now();

    Python::with_gil(|py| -> PyResult<()> {
        // Test core imports
        py.run("import sys, os, json", None, None)?;
        info!("  ✅ Standard library imports successful");

        // Test gigui import (this is where it likely hangs)
        py.run("import gigui", None, None)?;
        info!("  ✅ gigui import successful");

        py.run("from gigui.core import AnalysisEngine", None, None)?;
        py.run("from gigui.api import create_settings_from_dict", None, None)?;
        info!("  ✅ gigui component imports successful");

        Ok(())
    })?;

    info!("✅ Module imports completed in {:?}", start.elapsed());
    Ok(())
}

async fn test_api_simulation() -> PyResult<()> {
    info!("Testing API simulation (mimicking FastAPI request)...");
    let start = Instant::now();

    Python::with_gil(|py| -> PyResult<()> {
        // Simulate API request processing
        let code = r#"
import json
from gigui.core import AnalysisEngine
from gigui.api import create_settings_from_dict

# Create settings (simulating API request)
settings_dict = {
    "input_fstrs": ["."],
    "n_files": 5,
    "file_filter": r".*\.(py|rs)$"
}

# Initialize engine and settings
engine = AnalysisEngine()
settings = create_settings_from_dict(settings_dict)

# Get engine info (lightweight operation)
engine_info = engine.get_engine_info()
print(f"Engine info retrieved: {len(engine_info)} keys")

# Test settings validation
is_valid, error_msg = engine.validate_settings(settings)
print(f"Settings validation: valid={is_valid}, error='{error_msg}'")

result = {"status": "success", "engine_active": True}
print(json.dumps(result))
"#;

        py.run(code, None, None)?;
        Ok(())
    })?;

    info!("✅ API simulation completed in {:?}", start.elapsed());
    Ok(())
}
EOF
```

## Execution Plan for Cline

### Phase 1: Environment Setup

```bash
# Run this first to establish baseline
./debug_pyo3/verify_env.py
python debug_pyo3/build_debug.py
```

### Phase 2: Minimal Testing

```bash
cd debug_pyo3/minimal_tests
cargo run --release
```

### Phase 3: Progressive Testing

If minimal test passes, run integration test:

```bash
cd debug_pyo3/integration_test
cargo run --release
```

### Phase 4: Log Analysis

```bash
# Analyze all logs
grep -n "CRITICAL\|ERROR\|TIMEOUT" debug_pyo3/logs/*.log
```

## Success Criteria

**Phase 1 Success**: Basic PyO3 initialization completes in < 5 seconds
**Phase 2 Success**: All standard library imports work, gigui import identified as pass/fail
**Phase 3 Success**: Full API simulation runs without hanging
**Phase 4 Success**: Build script correctly detects Python environment

## Failure Points and Next Steps

**If Phase 1 fails**: PyO3 configuration issue - check Rust/Python versions
**If Phase 2 fails at gigui import**: Python path/environment issue - fix uv sync
**If Phase 3 fails**: Complex dependency issue - investigate specific import
**If Phase 4 fails**: Build configuration issue - check build.rs and pyo3-build-config

## Log Analysis Commands

```bash
# Quick status check
tail -n 20 debug_pyo3/logs/*.log

# Find where hangs occur
grep -B5 -A5 "Step.*:" debug_pyo3/logs/*.log

# Check for timeout patterns
grep -n "timeout\|hang\|stuck" debug_pyo3/logs/*.log
```

This plan provides a systematic, isolated approach to debug the PyO3 runtime issues with clear success/failure criteria and actionable next steps at each phase.
