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

**Symptoms**: Server fails to start or port conflicts occur

**Solutions**:

-   Kill processes on port 8000 (see [Port Management](development-commands.md#port-management))
-   Use different port (see [Basic Server Commands](development-commands.md#basic-server-commands))

### Frontend Connection Issues

**Symptoms**: Frontend cannot reach backend API

**Solutions**:

-   Test API health (see [Service Health Checks](development-commands.md#service-health-checks))
-   Restart development server (see [Quick Start Commands](development-commands.md#quick-start-commands))

## Development Issues

### Hot Reload Not Working

**Symptoms**: Changes not reflected automatically in development

**Solutions**:

-   Restart with reload enabled (see [Backend Debugging Commands](development-commands.md#backend-debugging-commands))
-   Kill and restart servers (see [Troubleshooting Commands](development-commands.md#troubleshooting-commands))

### Debugging Issues

**Symptoms**: Unable to debug or get detailed error information

**Solutions**:

-   Enable debug logging (see [Backend Debugging Commands](development-commands.md#backend-debugging-commands))
-   Verify VS Code extensions are installed

### Build Failures

**Symptoms**: Build process fails or produces errors

**Solutions**:

-   Clean build artifacts (see [Cache Management](development-commands.md#cache-management))
-   Update dependencies (see [Environment Reset](development-commands.md#environment-reset))

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
telnet 127.0.0.1 8000
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
