# Development Environment Setup

Development environment configuration for GitInspectorGUI.

**Prerequisites**: Complete the **[Getting Started Guide](../getting-started/01-prerequisites.md)** first for system requirements and project installation.

## Understanding the Development Stack

If you're unfamiliar with the technologies used, see the **[Technology Primer](../technology-primer.md)** first.

**Development environment components**:

-   **Frontend**: Tauri (desktop framework) + React (UI library) + TypeScript (typed JavaScript) + Vite (build tool)
-   **Backend**: Python analysis engine embedded via PyO3 helper functions (simplified Rust-Python integration)
-   **Package Management**: uv (fast Python package manager), pnpm (fast JavaScript package manager)
-   **Build System**: Cargo (Rust compiler with PyO3 helpers), Vite (frontend bundler)

## Development Configuration

### VS Code Extensions

```json
{
    "recommendations": [
        "ms-python.python",
        "rust-lang.rust-analyzer",
        "tauri-apps.tauri-vscode",
        "bradlc.vscode-tailwindcss"
    ]
}
```

### Python Environment Configuration

If using VS Code:

1. `Ctrl+Shift+P` → "Python: Select Interpreter"
2. Choose `.venv/bin/python` (created by `uv sync`)

## Rust Logging

**RUST_LOG** is Rust's standard environment variable for controlling log levels. The format is:

- `RUST_LOG=module=level` - Sets logging level for specific modules
- `pyo3=debug` - Enables debug-level logging for the PyO3 crate

### Common RUST_LOG Patterns

```bash
# General debug logging
export RUST_LOG=debug

# Application-specific logging
export RUST_LOG=gitinspectorgui=debug

# PyO3 integration debugging (Python-Rust communication)
export RUST_LOG=pyo3=debug

# Multiple modules
export RUST_LOG=pyo3=debug,gitinspectorgui=info

# All PyO3 and Tauri logging
export RUST_LOG=pyo3=debug,tauri=debug
```

### Log Levels

Available log levels (from most to least verbose):

- `trace` - Very detailed tracing information
- `debug` - Debug information for development
- `info` - General information messages
- `warn` - Warning messages
- `error` - Error messages only

### GitInspectorGUI Specific Usage

In this project, RUST_LOG is particularly useful for:

- **PyO3 debugging**: `RUST_LOG=pyo3=debug` shows Python-Rust integration details
- **Application debugging**: `RUST_LOG=gitinspectorgui=debug` shows app-specific logs
- **Performance monitoring**: Debug logs include timing and memory information

## Development Server Configuration

For development server commands and workflows, see **[Development Workflow](development-workflow.md)**.

### Single-Process Development

GitInspectorGUI uses a single-process architecture with embedded Python:

```bash
# Start complete development environment
pnpm run tauri dev

# This starts:
# - Vite dev server for frontend hot reload
# - Tauri application with embedded Python via PyO3 helpers
# - Simplified PyO3 helper function calls (no separate server)
```

### Development Modes

```bash
# Complete development environment (recommended)
pnpm run tauri dev

# Frontend only (without desktop wrapper)
pnpm run dev

# Note: Python changes require restarting the desktop app
# since Python is embedded via PyO3 helpers
```

## Debugging

### PyO3 Helper Function Debugging

```json
{
    "name": "Debug Tauri with PyO3",
    "type": "lldb",
    "request": "launch",
    "program": "${workspaceFolder}/src-tauri/target/debug/gitinspectorgui",
    "args": [],
    "cwd": "${workspaceFolder}",
    "env": {
        "RUST_LOG": "debug",
        "RUST_BACKTRACE": "1"
    }
}
```

### Python Code Debugging

Since Python is embedded via PyO3 helpers, debugging requires different approaches:

```python
# Add logging to Python code
import logging
logger = logging.getLogger(__name__)

def execute_analysis(settings):
    logger.info(f"Starting analysis with settings: {settings}")
    # Your analysis code here
    logger.info("Analysis completed")
```

### Frontend Debugging

-   **DevTools**: Right-click → "Inspect Element"
-   **Console**: Use `console.log()` for debugging
-   **Breakpoints**: Set in VS Code or browser DevTools

### PyO3 Helper Function Error Debugging

```bash
# Enable PyO3 debug logging
RUST_LOG=pyo3=debug pnpm run tauri dev

# Check for Python import issues
python -c "from gigui.analysis import execute_analysis; print('OK')"
```

## Testing

### Python Unit Tests

```bash
# All Python tests
cd python && python -m pytest

# With coverage
cd python && python -m pytest --cov=gigui

# Specific test file
cd python && python -m pytest tests/test_analysis.py
```

### PyO3 Helper Function Integration Tests

```bash
# Test PyO3 helper functions
cd src-tauri && cargo test

# Test with Python integration through helpers
cd src-tauri && cargo test --features python-tests
```

### Frontend Tests

```bash
# React tests
pnpm test

# With coverage
pnpm run test:coverage
```

## Tools

### Development Tools

-   **Tauri DevTools**: Built into development mode
-   **React DevTools**: Available in browser inspector
-   **Rust Analyzer**: VS Code extension for Rust development
-   **Python Debugger**: VS Code Python extension

### Build Commands

```bash
# Development (single command for everything)
pnpm run tauri dev

# Production builds
pnpm run tauri build    # Desktop application
cd python && uv build  # Python CLI package
mkdocs build           # Documentation
```

## Performance Monitoring

### PyO3 Helper Function Performance

```rust
// Add timing to Rust code
use std::time::Instant;

#[tauri::command]
pub async fn execute_analysis_command(settings: Settings) -> Result<AnalysisResult, String> {
    let start = Instant::now();
    let result = execute_analysis(settings)?;
    let duration = start.elapsed();
    println!("Analysis took: {:?}", duration);
    Ok(result)
}
```

### Python Performance

```python
import time
import logging

logger = logging.getLogger(__name__)

def execute_analysis(settings):
    start_time = time.time()
    # Your analysis code here
    duration = time.time() - start_time
    logger.info(f"Analysis completed in {duration:.2f} seconds")
```

## Troubleshooting

### PyO3 Helper Function Compilation Issues

```bash
# Check Python development headers
python -c "import sysconfig; print(sysconfig.get_path('include'))"

# Rebuild PyO3 helper functions
cd src-tauri && cargo clean && cargo build
```

### Python Environment Issues

```bash
# Reinstall Python dependencies
uv sync

# Check Python module imports
python -c "import gigui; print('OK')"

# Verify virtual environment
which python
```

### Frontend Issues

```bash
# Clear and reinstall frontend dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Rust/Tauri Issues

```bash
# Update Rust toolchain
rustup update

# Clean Rust build cache
cd src-tauri && cargo clean

# Rebuild everything
pnpm run tauri build
```

### Memory Issues

```bash
# Monitor memory usage during development
top -p $(pgrep gitinspectorgui)

# Check for Python memory leaks
python -c "import tracemalloc; tracemalloc.start()"
```

## Environment Variables

### Development Environment

```bash
# Enable debug logging (now functional with env_logger)
export RUST_LOG=debug                    # General debug logging
export RUST_LOG=gitinspectorgui=debug    # Application-specific logging
export RUST_LOG=pyo3=debug               # PyO3 integration debugging
export RUST_BACKTRACE=1                  # Show panic backtraces

# Note: PYTHONPATH is automatically configured by the build system

# Start development with debug info
pnpm run tauri dev
```

### Production Environment

```bash
# Optimized builds
export CARGO_PROFILE_RELEASE_LTO=true
export CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1

# Build optimized release
pnpm run tauri build
```

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Development patterns and best practices
-   **[Package Management](package-management-overview.md)** - Dependencies and tools
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
-   **[PyO3 Helper Integration](../architecture/pyo3-integration.md)** - PyO3 helper function architecture details
