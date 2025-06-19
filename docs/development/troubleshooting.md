# Troubleshooting Guide

Common issues and solutions for GitInspectorGUI development.

## Quick Diagnostics

### System Check

```bash
# Verify installations
python --version  # 3.13+
node --version    # 22+
rustc --version   # 1.85+

# Test imports
python -c "import gigui; print('OK')"

# Check ports
lsof -i :8000
```

## Installation Issues

### Python Module Not Found

```bash
# Reinstall dependencies
uv sync

# Verify installation
python -c "import gigui; print(gigui.__file__)"
```

### Node.js Dependencies

```bash
# Clear and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Rust Compilation

```bash
# Update and clean
rustup update
cargo clean
```

## Runtime Issues

### Server Won't Start

```bash
# Kill process on port 8080
lsof -ti:8000 | xargs kill -9

# Use different port
python -m gigui.start_server --port 8081
```

For all server command options, see **[Development Workflow](development-workflow.md#development-server-commands-single-source-of-truth)**.

### Frontend Connection Issues

```bash
# Test API health
curl http://127.0.0.1:8000/health

# Restart development server (see Development Workflow for all options)
python -m gigui.start_server --reload
```

## Development Issues

### Hot Reload Not Working

```bash
# Restart with reload enabled (see Development Workflow for all options)
python -m gigui.start_server --reload

# Kill and restart servers
pkill -f "gigui.start_server"
pkill -f "tauri dev"
```

### Debugging Issues

```bash
# Enable debug logging (see Development Workflow for all options)
python -m gigui.start_server --log-level DEBUG

# Verify VS Code extensions
code --list-extensions | grep python
```

### Build Failures

```bash
# Clean artifacts
rm -rf target/ dist/ node_modules/

# Update dependencies
pnpm update
cargo update
uv sync --upgrade
```

## Platform Issues

### macOS

```bash
# Fix permissions
sudo chown -R $(whoami) ~/.local/share/pnpm

# Install Xcode tools
xcode-select --install

# Skip code signing in development
export TAURI_SKIP_DEVTOOLS_INSTALL=true
```

### Windows

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Add project to Windows Defender exclusions
# Windows Security → Exclusions → Add folder
```

### Linux

```bash
# Ubuntu/Debian
sudo apt install build-essential libssl-dev pkg-config

# Fedora/RHEL
sudo dnf install gcc openssl-devel pkgconfig

# Arch Linux
sudo pacman -S base-devel openssl pkgconf
```

## Error Detection and Debugging

### GUI Error Display

**The GUI shows errors in two places:**

1. **Error Display Area** (below the Execute button)

    - The GUI automatically detects and displays most errors here
    - Look for red error messages in this area first
    - Shows user-friendly messages like "Repository path does not exist"

2. **Browser Console** (for additional technical details)
    - If the error display area doesn't show enough information
    - Right-click anywhere in the GUI window
    - Select "Inspect" from the context menu
    - Click the "Console" tab in the developer tools panel
    - Look for detailed error messages and technical information

**Troubleshooting Flow:**

1. Check the GUI error area first
2. If you need more details, use the browser console
3. Copy error messages for bug reports or further investigation

## Diagnostics

### Logging

```bash
# Enable debug logging
python -m gigui.start_server --log-level DEBUG

# Python API logs
python -m gigui.start_server --reload

# Frontend logs: Browser DevTools → Console
```

### API Testing

```bash
# Health check
curl -v http://127.0.0.1:8000/health

# Settings
curl -v http://127.0.0.1:8000/api/settings

# Test connectivity
telnet 127.0.0.1 8080
```

### Performance

```bash
# Python profiling
python -m memory_profiler -m gigui.start_server

# Frontend: Browser DevTools → Performance tab
```

## Bug Reports

### Information to Include

```bash
# System information
uname -a
python --version
node --version
rustc --version
```

### Report Template

```markdown
**Environment:** OS, Python/Node/Rust versions
**Steps:** Exact commands and actions
**Expected:** What should happen
**Actual:** What actually happens
**Logs:** Error messages and stack traces
```

## Best Practices

1. **Keep dependencies updated**
2. **Clean build artifacts regularly**
3. **Monitor system resources**
4. **Document custom configurations**
5. **Regular health checks**

```bash
# Health monitoring
curl http://127.0.0.1:8000/health
tail -f logs/api.log | grep -i warning
```

## Related

-   **[Environment Setup](environment-setup.md)** - Development setup
-   **[Development Workflow](development-workflow.md)** - Development workflow
-   **[Package Management](package-management.md)** - Dependencies and tools
