# Maintenance Guide

Essential maintenance procedures for GitInspectorGUI desktop application with embedded Python analysis engine.

## Updates

### Dependencies

```bash
# Python packages
uv sync --upgrade

# Node.js packages
pnpm update
pnpm audit fix

# Rust dependencies
cargo update
```

### Application Updates

1. **Backup** current installation
2. **Stop** running services
3. **Update** application files
4. **Restart** services
5. **Verify** functionality

## Troubleshooting

### Application Issues

```bash
# Desktop app won't start
# Check if another instance is running
ps aux | grep gitinspectorgui

# Tauri app issues
rm -rf node_modules
pnpm install

# Python analysis engine issues
uv sync
python -c "import gigui.analysis; print('Python engine OK')"
```

### Performance Issues

-   **Slow analysis**: Reduce repository scope, close other apps
-   **High memory**: Monitor with system tools, restart if needed

## Logs

### Locations

-   **Python Analysis**: Embedded in desktop app logs
-   **Frontend**: Browser DevTools Console (in development)
-   **Tauri**: Terminal output from `pnpm run tauri dev`
-   **Desktop App**: System logs (varies by platform)

### Analysis

```bash
# Check for errors in development
pnpm run tauri dev 2>&1 | grep -i error

# Monitor real-time during development
pnpm run tauri dev
```

## Backup

### Important Files

-   Configuration files and settings
-   Custom analysis results
-   Application configuration

### Commands

```bash
# Backup configuration
cp -r ~/.config/gitinspectorgui /backup/location/

# Backup application
cp -r /path/to/gitinspectorgui /backup/location/
```

## Health Checks

### Application Health

```bash
# Test Python analysis engine
python -c "from gigui.analysis import execute_analysis; print('Analysis engine OK')"

# Basic functionality test
# 1. Start desktop app: pnpm run tauri dev
# 2. Load test repository
# 3. Run small analysis
# 4. Verify results display
```

### System Requirements

-   **Python 3.13+**
-   **Node.js 22+**
-   **Rust 1.85+**
-   **Sufficient memory** for analysis
-   **Disk space** for temporary files

## Support

1. **[Troubleshooting Guide](../development/troubleshooting.md)** - Common issues
2. **Review logs** for error messages
3. **Verify requirements** are met
4. **Check repository** for known issues

## Related

-   **[Deployment](deployment.md)** - Production deployment
-   **[Monitoring](monitoring.md)** - System monitoring
-   **[Troubleshooting](../development/troubleshooting.md)** - Issue resolution
