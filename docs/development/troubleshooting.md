# Troubleshooting Guide

Comprehensive troubleshooting guide for GitInspectorGUI development and usage issues.

## Quick Diagnostics

### System Health Check

Run these commands to verify your setup:

```bash
# Check Python installation
python --version
python -c "import gigui; print('GitInspectorGUI installed successfully')"

# Check Node.js installation
node --version
npm --version

# Check Rust installation
rustc --version
cargo --version

# Test HTTP server
curl http://127.0.0.1:8080/health
```

### Service Status

```bash
# Check if HTTP server is running
lsof -i :8080

# Check Tauri development server
ps aux | grep "tauri dev"

# Check for port conflicts
netstat -tulpn | grep :8080
```

## Common Issues

### Installation Issues

#### Python Module Not Found

**Symptoms:**

```
ModuleNotFoundError: No module named 'gigui'
```

**Solutions:**

```bash
# Install in development mode
pip install -e .

# Or using uv
uv sync

# Verify installation
python -c "import gigui; print(gigui.__file__)"
```

#### Node.js Dependency Issues

**Symptoms:**

```
npm ERR! peer dep missing
npm ERR! Cannot resolve dependency
```

**Solutions:**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Update Node.js if needed
node --version  # Should be 16+
```

#### Rust Compilation Errors

**Symptoms:**

```
error: failed to compile `tauri-cli`
```

**Solutions:**

```bash
# Update Rust
rustup update

# Clean build cache
cargo clean

# Reinstall Tauri CLI
npm uninstall -g @tauri-apps/cli
npm install -g @tauri-apps/cli
```

### Runtime Issues

#### HTTP Server Won't Start

**Symptoms:**

```
Address already in use (port 8080)
Permission denied
```

**Solutions:**

```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Use different port
python -m gigui.start_server --port 8081

# Check permissions
sudo netstat -tulpn | grep :8080
```

#### Frontend Won't Connect to API

**Symptoms:**

-   Tauri app opens but shows connection errors
-   Network errors in browser console
-   Empty results or loading states

**Solutions:**

```bash
# Verify server is running
curl http://127.0.0.1:8080/health

# Check CORS settings
export GIGUI_CORS_ENABLED=true
python -m gigui.start_server --reload

# Verify network connectivity
ping 127.0.0.1
telnet 127.0.0.1 8080
```

#### Analysis Fails or Hangs

**Symptoms:**

-   Analysis never completes
-   Empty results
-   Timeout errors

**Solutions:**

```bash
# Check repository path
ls -la /path/to/repository/.git

# Verify git repository
cd /path/to/repository
git status

# Test with smaller repository
git log --oneline | head -10

# Check available memory
free -h  # Linux
vm_stat  # macOS
```

### Performance Issues

#### Slow Analysis Performance

**Symptoms:**

-   Analysis takes very long time
-   High CPU/memory usage
-   System becomes unresponsive

**Solutions:**

```bash
# Limit analysis scope
# Use date ranges in settings
# Exclude large binary files

# Monitor resource usage
htop  # Linux
Activity Monitor  # macOS

# Optimize git repository
cd /path/to/repository
git gc --aggressive
git repack -ad
```

#### Memory Issues

**Symptoms:**

```
MemoryError
Out of memory
System becomes slow
```

**Solutions:**

```bash
# Monitor memory usage
python -m memory_profiler -m gigui.start_server

# Reduce analysis scope
# Use smaller date ranges
# Analyze fewer files

# Increase system memory or swap
```

### Development Issues

#### Hot Reload Not Working

**Symptoms:**

-   Changes to Python files don't trigger restart
-   Frontend changes don't update
-   Need to manually restart

**Solutions:**

```bash
# Ensure development mode is enabled
python -m gigui.start_server --reload

# Check file permissions
ls -la python/gigui/

# Restart development servers
pkill -f "gigui.start_server"
pkill -f "tauri dev"
```

#### Debugging Not Working

**Symptoms:**

-   Breakpoints not hit
-   No debug output
-   VS Code debugger not connecting

**Solutions:**

```bash
# Verify VS Code Python extension
code --list-extensions | grep python

# Check launch configuration
cat .vscode/launch.json

# Enable debug logging
export GIGUI_DEBUG=true
export GIGUI_LOG_LEVEL=DEBUG
```

#### Build Failures

**Symptoms:**

```
Build failed
Compilation errors
Missing dependencies
```

**Solutions:**

```bash
# Clean build artifacts
rm -rf target/
rm -rf dist/
rm -rf node_modules/

# Update dependencies
npm update
cargo update
pip install --upgrade -e .

# Check system requirements
rustc --version  # 1.70+
node --version   # 16+
python --version # 3.8+
```

## Platform-Specific Issues

### macOS Issues

#### Permission Denied Errors

**Symptoms:**

```
Permission denied (publickey)
Operation not permitted
```

**Solutions:**

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Allow Terminal full disk access
# System Preferences → Security & Privacy → Privacy → Full Disk Access

# Fix Xcode command line tools
xcode-select --install
```

#### Code Signing Issues

**Symptoms:**

```
Code signing failed
Developer ID not found
```

**Solutions:**

```bash
# Skip code signing in development
export TAURI_SKIP_DEVTOOLS_INSTALL=true

# Or configure proper signing
# See Tauri documentation for production signing
```

### Windows Issues

#### PowerShell Execution Policy

**Symptoms:**

```
Execution of scripts is disabled
```

**Solutions:**

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run specific commands
powershell -ExecutionPolicy Bypass -Command "npm run tauri dev"
```

#### Windows Defender Issues

**Symptoms:**

-   Slow compilation
-   Files being quarantined
-   Antivirus warnings

**Solutions:**

```
# Add project folder to Windows Defender exclusions
# Windows Security → Virus & threat protection → Exclusions
# Add folder: C:\path\to\gitinspectorgui
```

### Linux Issues

#### Missing System Dependencies

**Symptoms:**

```
Package not found
Library not found
```

**Solutions:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install build-essential libssl-dev pkg-config

# Fedora/RHEL
sudo dnf install gcc openssl-devel pkgconfig

# Arch Linux
sudo pacman -S base-devel openssl pkgconf
```

## Advanced Diagnostics

### Log Analysis

#### Enable Detailed Logging

```bash
# Python API logging
export GIGUI_LOG_LEVEL=DEBUG
python -m gigui.start_server --reload

# Frontend logging
# Open browser DevTools → Console tab

# Tauri logging
export RUST_LOG=debug
npm run tauri dev
```

#### Log Locations

-   **API Logs**: Console output or `./logs/api.log`
-   **Frontend Logs**: Browser DevTools Console
-   **Tauri Logs**: Terminal running `npm run tauri dev`
-   **System Logs**:
    -   macOS: `Console.app` or `/var/log/`
    -   Linux: `journalctl` or `/var/log/`
    -   Windows: Event Viewer

### Network Diagnostics

#### Test API Endpoints

```bash
# Health check
curl -v http://127.0.0.1:8080/health

# Settings endpoint
curl -v -X GET http://127.0.0.1:8080/api/settings

# Test with verbose output
curl -v -X POST http://127.0.0.1:8080/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{"repository_path": "/tmp"}'
```

#### Network Connectivity

```bash
# Test local connectivity
ping 127.0.0.1
telnet 127.0.0.1 8080

# Check firewall
sudo ufw status  # Linux
# Windows Firewall settings
# macOS System Preferences → Security & Privacy → Firewall
```

### Performance Profiling

#### Python Profiling

```bash
# Install profiling tools
pip install memory-profiler line-profiler

# Memory profiling
python -m memory_profiler -m gigui.start_server

# Line profiling
kernprof -l -v python/gigui/api.py
```

#### Frontend Profiling

```bash
# React DevTools Profiler
# Install React DevTools browser extension
# Use Profiler tab in DevTools

# Performance monitoring
# Browser DevTools → Performance tab
# Record performance while using the app
```

## Getting Help

### Information to Collect

When reporting issues, include:

1. **System Information**:

    ```bash
    uname -a  # System details
    python --version
    node --version
    rustc --version
    ```

2. **Error Messages**: Full error output with stack traces

3. **Steps to Reproduce**: Exact commands and actions

4. **Log Files**: Relevant log excerpts

5. **Configuration**: Settings and environment variables

### Support Channels

1. **Documentation**: Check this troubleshooting guide first
2. **Repository Issues**: Search existing issues
3. **Development Team**: Create detailed issue reports
4. **Community**: Discussions and forums

### Creating Good Bug Reports

```markdown
## Bug Report

**Environment:**

-   OS: macOS 14.0
-   Python: 3.11.5
-   Node.js: 18.17.0
-   Rust: 1.72.0

**Steps to Reproduce:**

1. Start HTTP server: `python -m gigui.start_server`
2. Start Tauri app: `npm run tauri dev`
3. Load repository: `/path/to/repo`
4. Click "Execute Analysis"

**Expected Behavior:**
Analysis should complete and show results

**Actual Behavior:**
Analysis hangs at 50% progress

**Error Messages:**
```

[ERROR] Timeout waiting for git command
[ERROR] Repository analysis failed

```

**Additional Context:**
- Repository has 10,000+ commits
- Works fine with smaller repositories
- No network connectivity issues
```

## Prevention

### Best Practices

1. **Regular Updates**: Keep dependencies updated
2. **Clean Environment**: Regularly clean build artifacts
3. **Resource Monitoring**: Monitor system resources during development
4. **Backup Configuration**: Keep working configurations backed up
5. **Documentation**: Document custom configurations and workarounds

### Health Monitoring

```bash
# Regular health checks
curl http://127.0.0.1:8080/health

# Monitor logs for warnings
tail -f logs/api.log | grep -i warning

# Check system resources
df -h  # Disk space
free -h  # Memory usage
```

This troubleshooting guide should help resolve most common issues. For persistent problems, don't hesitate to seek help from the development team or community.
