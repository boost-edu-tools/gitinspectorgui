# Application Management

GitInspectorGUI uses a single-process PyO3 architecture with embedded Python. This guide covers application lifecycle management and troubleshooting.

## Development vs Production

### Development Mode

```bash
# Single command starts everything
pnpm run tauri dev
```

**What this starts:**

- Tauri desktop application with embedded Python
- Vite development server for frontend hot reloading
- PyO3 bindings for direct Python integration

### Production Mode

```bash
# Build single executable
pnpm run tauri build
```

**What this creates:**

- Single desktop application executable
- Embedded Python interpreter
- All dependencies bundled

## Application Lifecycle

### Starting the Application

**Development:**

```bash
# Start development environment
pnpm run tauri dev

# Expected output:
# - Tauri application window opens
# - Python analysis engine is ready
# - Frontend hot reloading enabled
```

**Production:**

```bash
# Run built application (example paths)
# Windows: ./target/release/gitinspectorgui.exe
# macOS: ./target/release/bundle/macos/GitInspectorGUI.app
# Linux: ./target/release/gitinspectorgui
```

### Stopping the Application

**Development:**

- Close the Tauri application window, or
- Press `Ctrl+C` in the terminal running `pnpm run tauri dev`

**Production:**

- Close the application window
- Application terminates cleanly with embedded Python

## Troubleshooting

### Application Won't Start

**Check Python Dependencies:**

```bash
# Verify Python environment
cd python
uv sync

# Test Python modules directly
python -c "from gigui.analysis import execute_analysis; print('Python modules OK')"
```

**Check Rust/Tauri Dependencies:**

```bash
# Verify Rust toolchain
rustc --version
cargo --version

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
```

**Check Node.js Dependencies:**

```bash
# Verify frontend dependencies
pnpm install
pnpm run build
```

### Application Crashes

**Check Logs:**

```bash
# Development mode logs appear in terminal
pnpm run tauri dev

# Production logs (platform-specific locations):
# Windows: %APPDATA%/com.gitinspectorgui.app/logs/
# macOS: ~/Library/Logs/com.gitinspectorgui.app/
# Linux: ~/.local/share/com.gitinspectorgui.app/logs/
```

**Common Crash Causes:**

1. **Python Import Errors** - Missing Python modules or incorrect module structure
2. **PyO3 Binding Issues** - Incompatible Python/Rust versions
3. **Memory Issues** - Large repository analysis exceeding available memory
4. **File Permission Issues** - Cannot access git repositories

### Python Integration Issues

**Test Python Functions Independently:**

```bash
cd python
python -c "
from gigui.analysis import execute_analysis, Settings
settings = Settings(input_fstrs=['.'], n_files=10)
try:
    result = execute_analysis(settings)
    print('Python analysis OK')
except Exception as e:
    print(f'Python error: {e}')
"
```

**Check PyO3 Integration:**

```bash
# Rebuild with PyO3 debug info
cd src-tauri
cargo build --features pyo3/auto-initialize
```

### Performance Issues

**Monitor Resource Usage:**

```bash
# Check memory usage (Unix-like systems)
ps aux | grep gitinspectorgui

# Check CPU usage
top -p $(pgrep gitinspectorgui)
```

**Optimize Analysis Settings:**

- Reduce `n_files` parameter for large repositories
- Use `ex_files` to exclude unnecessary files
- Limit `processes` to available CPU cores

### File Access Issues

**Check Repository Permissions:**

```bash
# Verify git repository access
cd /path/to/repository
git status

# Check file permissions
ls -la .git/
```

**Common Permission Issues:**

- Repository on network drive with limited access
- Git repository corrupted or incomplete
- Insufficient permissions to read git objects

## Application Configuration

### Python Environment

**Location:** `python/pyproject.toml`

```toml
[project]
dependencies = [
    "gitpython>=3.1.44",
    "psutil>=7.0.0",
    # ... other dependencies
]
```

### Tauri Configuration

**Location:** `src-tauri/tauri.conf.json`

```json
{
  "build": {
    "beforeBuildCommand": "pnpm run build",
    "beforeDevCommand": "pnpm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  }
}
```

### PyO3 Configuration

**Location:** `src-tauri/Cargo.toml`

```toml
[dependencies]
pyo3 = { version = "0.20", features = ["auto-initialize"] }
```

## Maintenance Tasks

### Update Dependencies

**Python Dependencies:**

```bash
cd python
uv sync --upgrade
```

**Rust Dependencies:**

```bash
cd src-tauri
cargo update
```

**Node.js Dependencies:**

```bash
pnpm update
```

### Clean Build Artifacts

**Complete Clean:**

```bash
# Clean all build artifacts
rm -rf target/
rm -rf dist/
rm -rf node_modules/
cd python && rm -rf .venv/
cd src-tauri && cargo clean
```

**Rebuild Everything:**

```bash
# Reinstall dependencies and rebuild
pnpm install
cd python && uv sync
cd ../src-tauri && cargo build
pnpm run tauri dev
```

### Backup and Restore

**Important Files to Backup:**

- `python/` - Python analysis engine
- `src/` - Frontend source code
- `src-tauri/src/` - Rust integration code
- Configuration files: `package.json`, `pyproject.toml`, `Cargo.toml`

**Settings and Data:**

- User settings are stored in platform-specific locations
- No database or persistent server state to backup

## Best Practices

### Development Workflow

1. **Always test Python functions independently** before running in Tauri
2. **Use development mode** for rapid iteration
3. **Monitor terminal output** for PyO3 integration issues
4. **Clean rebuild** when switching between development and production

### Production Deployment

1. **Test thoroughly in development mode** before building
2. **Verify all dependencies** are included in build
3. **Test on target platforms** before distribution
4. **Include error reporting** for production issues

### Troubleshooting Approach

1. **Isolate the problem** - Test Python, Rust, and frontend separately
2. **Check logs first** - Most issues are logged with clear error messages
3. **Verify dependencies** - Ensure all required packages are installed
4. **Clean rebuild** - Many issues resolve with a clean build

This single-process architecture eliminates the complexity of managing multiple servers while providing robust desktop application functionality with embedded Python analysis capabilities.
