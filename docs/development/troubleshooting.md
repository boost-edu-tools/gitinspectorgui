# Troubleshooting Guide

Common issues and solutions for GitInspectorGUI development with PyO3 architecture.

## Quick Diagnostics

### System Check

```bash
# Verify installations
python --version  # 3.8+
node --version    # 22+
rustc --version   # 1.63+

# Test Python imports
python -c "import gigui; print('OK')"

# Check PyO3 compatibility
python -c "from gigui.analysis import execute_analysis; print('PyO3 ready')"

# Check development ports
lsof -i :5173  # Vite dev server
lsof -i :1420  # Tauri dev server
```

## Installation Issues

### Python Module Not Found

```bash
# Reinstall dependencies
uv sync

# Verify installation
python -c "import gigui; print(gigui.__file__)"

# Check virtual environment
which python
source .venv/bin/activate  # if not activated
```

### PyO3 Compilation Issues

```bash
# Check Python development headers
python -c "import sysconfig; print(sysconfig.get_path('include'))"

# Rebuild PyO3 helper functions
cd src-tauri && cargo clean && cargo build

# Check for missing dependencies
python -c "import sysconfig; print(sysconfig.get_config_vars())"
```

### Node.js Dependencies

```bash
# Clear and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Fix permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.local/share/pnpm
```

### Rust Compilation

```bash
# Update and clean
rustup update
cd src-tauri && cargo clean

# Check Rust installation
rustc --version
cargo --version
```

## Runtime Issues

### Desktop App Won't Start

**Symptoms**: Tauri application fails to launch or crashes immediately

**Solutions**:

```bash
# Clear all caches and rebuild
pnpm clean
rm -rf src-tauri/target
rm -rf node_modules/.vite
pnpm install
pnpm run tauri dev

# Check for port conflicts
lsof -i :5173  # Kill if needed: kill -9 $(lsof -t -i:5173)
lsof -i :1420  # Kill if needed: kill -9 $(lsof -t -i:1420)

# Enable debug logging
RUST_LOG=debug pnpm run tauri dev
```

### Python Integration Issues

**Symptoms**: Python functions not working in desktop app, PyO3 helper errors

**Solutions**:

```bash
# Test Python functions independently
cd python
python -c "from gigui.analysis import execute_analysis; print('OK')"

# Check PyO3 helper functions
cd src-tauri && cargo test

# Enable PyO3 debug logging
RUST_LOG=pyo3=debug pnpm run tauri dev

# Verify Python environment
python -c "import sys; print(sys.executable)"
python -c "import sysconfig; print(sysconfig.get_path('include'))"
```
# Check PyO3 helper functions
cd src-tauri && cargo test

# Enable PyO3 debug logging
RUST_LOG=pyo3=debug pnpm run tauri dev

# Verify Python environment
python -c "import sys; print(sys.executable)"
python -c "import sysconfig; print(sysconfig.get_path('include'))"
```

### Frontend Issues

**Symptoms**: UI not loading, components not updating, JavaScript errors

**Solutions**:

```bash
# Test frontend independently
pnpm dev  # Should open http://localhost:5173

# Clear frontend cache
rm -rf node_modules/.vite
pnpm dev

# Check for TypeScript errors
pnpm type-check

# Check browser console
# Right-click in app → "Inspect" → "Console" tab
```

## Development Issues

### Hot Reload Not Working

**Symptoms**: Changes not reflected automatically in development

**Frontend hot reload issues**:

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart frontend only
pnpm dev

# Check for TypeScript errors
pnpm type-check
```

**Python changes not reflected**:

```bash
# Python is embedded via PyO3, restart required
# Stop desktop app (Ctrl+C)
pnpm run tauri dev
```

### PyO3 Helper Function Debugging Issues

**Symptoms**: Unable to debug Python code, PyO3 helper errors unclear

**Solutions**:

```bash
# Enable detailed PyO3 logging
export RUST_LOG=pyo3=debug
export RUST_BACKTRACE=1
pnpm run tauri dev

# Test Python functions independently
cd python
python -c "from gigui.analysis import problematic_function; print(problematic_function())"

# Check for Python import issues
python -c "import gigui; print('Import OK')"

# Verify PyO3 helper compilation
cd src-tauri && cargo build --verbose
```

### Build Failures

**Symptoms**: Build process fails or produces errors

**Solutions**:

```bash
# Complete environment reset
pnpm clean
rm -rf .venv node_modules src-tauri/target
uv venv && uv sync
pnpm install

# Check for missing system dependencies (see Platform Issues below)

# Build with verbose output
cd src-tauri && cargo build --verbose
pnpm build --verbose
```

## Platform Issues

### macOS

```bash
# Install Xcode command line tools
xcode-select --install

# Fix permissions
sudo chown -R $(whoami) ~/.local/share/pnpm

# PyO3 compilation issues
export MACOSX_DEPLOYMENT_TARGET=10.9

# Skip code signing in development
export TAURI_SKIP_DEVTOOLS_INSTALL=true
```

### Windows

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install Visual Studio Build Tools (required for PyO3)
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Add project to Windows Defender exclusions
# Windows Security → Exclusions → Add folder

# PyO3 compilation issues
$env:RUSTFLAGS="-C target-feature=+crt-static"
```

### Linux

```bash
# Ubuntu/Debian - Install build dependencies
sudo apt install build-essential libssl-dev pkg-config python3-dev

# Fedora/RHEL
sudo dnf install gcc openssl-devel pkgconfig python3-devel

# Arch Linux
sudo pacman -S base-devel openssl pkgconf python

# Fix library linking issues
export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/usr/local/lib"
```

## Error Detection and Debugging

### Desktop App Error Display

**The desktop app shows errors in multiple places:**

1. **Application Error Area** (within the app interface)

    - The app automatically detects and displays most errors here
    - Look for red error messages in the main interface
    - Shows user-friendly messages like "Repository path does not exist"

2. **Developer Console** (for technical details)

    - Right-click anywhere in the desktop app window
    - Select "Inspect" from the context menu
    - Click the "Console" tab in the developer tools panel
    - Look for detailed error messages and technical information

3. **Terminal Output** (for PyO3 and Rust errors)
    - Check the terminal where you ran `pnpm run tauri dev`
    - PyO3 errors and Rust compilation issues appear here
    - Python exceptions are also logged here

**Troubleshooting Flow:**

1. Check the app error area first
2. Look at terminal output for PyO3/Rust errors
3. Use developer console for frontend debugging
4. Copy error messages for bug reports

### Common Error Patterns

**PyO3 Helper Import Errors**:

```
Error: Python module 'gigui' not found
```

Solution: Check Python environment and run `uv sync`

**PyO3 Helper Type Conversion Errors**:

```
TypeError: argument 'settings' must be dict, not str
```

Solution: Check data types being passed through helper functions between Rust and Python

**Tauri PyO3 Helper Compilation Errors**:

```
error: failed to run custom build command for `pyo3`
```

Solution: Check Python development headers and rebuild helper functions

## Diagnostics

### Logging and Debug Information

```bash
# Enable comprehensive debug logging
export RUST_LOG=debug
export RUST_BACKTRACE=1
export PYTHONPATH="${PWD}/python"
pnpm run tauri dev

# PyO3 specific debugging
export RUST_LOG=pyo3=debug
pnpm run tauri dev

# Python module testing
cd python
python -c "import gigui; print('Module OK')"
python -m pytest tests/ -v
```

### Integration Testing

```bash
# Test PyO3 helper functions
cd src-tauri && cargo test

# Test Python analysis engine
cd python && python -m pytest

# Test frontend components
pnpm test

# Test complete integration
pnpm run tauri dev
```

### Performance Diagnostics

```bash
# Monitor memory usage
top -p $(pgrep gitinspectorgui)

# Profile PyO3 helper performance
RUST_LOG=debug pnpm run tauri dev

# Python memory profiling
python -c "import tracemalloc; tracemalloc.start()"

# Check for memory leaks
# Monitor memory usage over time during analysis
```

## Environment Issues

### Virtual Environment Problems

```bash
# Recreate Python environment
rm -rf .venv
uv venv
source .venv/bin/activate  # macOS/Linux
# or .venv\Scripts\activate  # Windows
uv sync

# Verify environment
which python
python -c "import sys; print(sys.prefix)"
```

### Path and Import Issues

```bash
# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Set PYTHONPATH if needed
export PYTHONPATH="${PWD}/python:$PYTHONPATH"

# Verify module location
python -c "import gigui; print(gigui.__file__)"
```

### Dependency Conflicts

```bash
# Check for conflicting packages
uv pip list | grep -i gigui
pnpm list --depth=0

# Clean install
rm -rf .venv node_modules
uv venv && uv sync
pnpm install
```

## Bug Reports

### Information to Include

```bash
# System information
uname -a
python --version
node --version
rustc --version
pnpm --version

# Environment details
echo $RUST_LOG
echo $PYTHONPATH
which python

# PyO3 specific info
python -c "import sysconfig; print(sysconfig.get_path('include'))"
cd src-tauri && cargo --version
```

### Report Template

```markdown
**Environment:**

-   OS: [macOS/Windows/Linux version]
-   Python: [version]
-   Node.js: [version]
-   Rust: [version]
-   PyO3: [version if known]

**Steps to Reproduce:**

1. [Exact commands and actions]
2. [Include any specific repository or settings used]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Error Messages:**
```

[Terminal output]
[Developer console output]
[Any error dialogs]

```

**Additional Context:**
[Any other relevant information]
```

## Best Practices

### Development Environment Maintenance

1. **Keep dependencies updated**:

    ```bash
    rustup update
    uv sync
    pnpm update
    ```

2. **Clean build artifacts regularly**:

    ```bash
    pnpm clean
    rm -rf src-tauri/target
    rm -rf node_modules/.vite
    ```

3. **Monitor system resources**:

    ```bash
    top -p $(pgrep gitinspectorgui)
    ```

4. **Regular health checks**:
    ```bash
    python -c "from gigui.analysis import execute_analysis; print('PyO3 Helper OK')"
    pnpm run tauri dev  # Should start without errors
    ```

### Debugging Workflow

1. **Isolate the problem**:

    - Python function issue?
    - PyO3 integration issue?
    - Frontend display issue?

2. **Test each layer independently**:

    ```bash
    cd python && python -m pytest  # Python layer
    cd src-tauri && cargo test      # PyO3 helper layer
    pnpm test                       # Frontend layer
    ```

3. **Use appropriate debugging tools**:
    - Python: print statements, pytest, logging
    - Rust: RUST_LOG=debug, cargo test
    - Frontend: console.log, React DevTools

## Related Documentation

-   **[Environment Setup](environment-setup.md)** - Development setup
-   **[Development Workflow](development-workflow.md)** - Development patterns
-   **[Development Commands](development-commands.md)** - Command reference
-   **[PyO3 Helper Integration](../architecture/design-decisions.md)** - PyO3 helper function architecture details
