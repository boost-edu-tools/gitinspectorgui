# Maintenance Guide

Basic maintenance procedures for GitInspectorGUI.

## Overview

GitInspectorGUI is a Tauri desktop application with a Python HTTP API backend. This guide covers essential maintenance tasks for keeping the application running smoothly.

## Application Updates

### Updating Dependencies

#### Python Dependencies

```bash
# Update Python packages
cd /path/to/gitinspectorgui
uv sync --upgrade

# Check for security vulnerabilities
uv pip audit
```

#### Node.js Dependencies

```bash
# Update Node.js packages
npm update

# Check for security issues
npm audit
npm audit fix
```

#### Rust Dependencies

```bash
# Update Rust dependencies
cargo update
```

### Application Updates

When updating to a new version of GitInspectorGUI:

1. **Backup current installation**
2. **Stop running services**
3. **Update application files**
4. **Restart services**
5. **Verify functionality**

## Basic Troubleshooting

### Service Issues

**HTTP Server won't start:**

```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill process if needed
kill -9 $(lsof -ti:8080)

# Restart server
python -m gigui.start_server
```

**Tauri app won't start:**

```bash
# Check for build issues
npm run tauri dev

# Clear cache if needed
rm -rf node_modules
npm install
```

### Performance Issues

**Slow analysis:**

-   Reduce repository size or date range
-   Close other resource-intensive applications
-   Check available system memory

**High memory usage:**

-   Monitor with system tools (Activity Monitor, Task Manager, htop)
-   Restart application if memory usage is excessive

## Log Management

### Log Locations

-   **API Logs**: Console output when running `python -m gigui.start_server`
-   **Frontend Logs**: Browser DevTools Console (in development)
-   **Tauri Logs**: Terminal output when running `npm run tauri dev`

### Basic Log Analysis

```bash
# Check for errors in recent logs
grep -i error /path/to/logs

# Monitor logs in real-time
tail -f /path/to/logfile
```

## Backup Recommendations

### Important Files to Backup

-   **Configuration files**: Settings and preferences
-   **Custom analysis results**: If saved locally
-   **Application configuration**: Any custom setup

### Simple Backup

```bash
# Backup configuration
cp -r ~/.config/gitinspectorgui /backup/location/

# Backup application directory (if modified)
cp -r /path/to/gitinspectorgui /backup/location/
```

## Health Checks

### Basic Health Verification

```bash
# Check HTTP API health
curl http://127.0.0.1:8080/health

# Verify basic functionality
# 1. Start HTTP server
# 2. Start Tauri app
# 3. Load a test repository
# 4. Run a small analysis
```

### System Requirements

Ensure system meets minimum requirements:

-   **Python 3.12+**
-   **Node.js 16+**
-   **Rust 1.70+**
-   **Sufficient memory** for repository analysis
-   **Disk space** for temporary files

## Getting Help

If you encounter issues:

1. **Check the [Troubleshooting Guide](../development/troubleshooting.md)**
2. **Review error messages** in logs
3. **Verify system requirements**
4. **Check project repository** for known issues

This maintenance guide focuses on the essential tasks needed to keep GitInspectorGUI running effectively without unnecessary complexity.
