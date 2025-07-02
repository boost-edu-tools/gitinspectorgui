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
# Tauri app issues
rm -rf node_modules
pnpm install

# Python analysis engine issues
uv sync
python -c "import gigui.analysis; print('Python engine OK')"
```

## Log Locations

- **Python Analysis**: Embedded in desktop app logs
- **Frontend**: Browser DevTools Console (in development)
- **Tauri**: Terminal output from `pnpm run tauri dev`
- **Desktop App**: System logs (varies by platform)

## Related

- **[Deployment](deployment.md)** - Production deployment
- **[Troubleshooting](../development/troubleshooting.md)** - Issue resolution
