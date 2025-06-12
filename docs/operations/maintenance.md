# Maintenance Guide

Essential maintenance procedures for GitInspectorGUI.

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

### Service Issues

```bash
# HTTP Server won't start
lsof -ti:8080 | xargs kill -9
python -m gigui.start_server

# Tauri app issues
rm -rf node_modules
pnpm install
```

### Performance Issues

-   **Slow analysis**: Reduce repository scope, close other apps
-   **High memory**: Monitor with system tools, restart if needed

## Logs

### Locations

-   **API**: Console output from `python -m gigui.start_server`
-   **Frontend**: Browser DevTools Console
-   **Tauri**: Terminal output from `pnpm run tauri dev`

### Analysis

```bash
# Check for errors
grep -i error /path/to/logs

# Monitor real-time
tail -f /path/to/logfile
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

### API Health

```bash
# Check HTTP API
curl http://127.0.0.1:8080/health

# Basic functionality test
# 1. Start HTTP server
# 2. Start Tauri app
# 3. Load test repository
# 4. Run small analysis
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
