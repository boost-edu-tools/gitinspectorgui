# npm to pnpm Migration Guide

This guide helps team members transition from npm to pnpm for the GitInspectorGUI project.

## What Changed

We've migrated from npm to pnpm for better performance, disk space efficiency, and dependency management.

## Quick Migration Steps

### 1. Install pnpm

```bash
# Enable pnpm (recommended)
corepack enable

# Or install globally
npm install -g pnpm
```

### 2. Remove Old Dependencies

```bash
# Remove npm lock file and node_modules
rm -rf node_modules package-lock.json

# Install with pnpm
pnpm install
```

### 3. Update Your Commands

| Old npm Command | New pnpm Command |
|----------------|------------------|
| `npm install` | `pnpm install` |
| `npm run tauri:dev` | `pnpm run tauri:dev` |
| `npm run tauri:build` | `pnpm run tauri:build` |
| `npm run dev` | `pnpm run dev` |
| `npm test` | `pnpm test` |
| `npm update` | `pnpm update` |
| `npm audit` | `pnpm audit` |

## Key Benefits

- **Faster installs**: Up to 2x faster than npm
- **Disk space savings**: Shared dependency storage
- **Better security**: Stricter dependency resolution
- **Monorepo support**: Better workspace management

## Development Workflow

### Starting Development

```bash
# 1. Start the HTTP API server
python -m gigui.start_server --reload

# 2. Start the Tauri application (in new terminal)
pnpm run tauri:dev
```

### Building for Production

```bash
# Build the application
pnpm run tauri:build
```

### Running Tests

```bash
# Run frontend tests
pnpm test

# Run with coverage
pnpm run test:coverage
```

## Troubleshooting

### Common Issues

**pnpm command not found**
```bash
# Enable corepack
corepack enable

# Or install globally
npm install -g pnpm
```

**Permission errors**
```bash
# Fix pnpm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.local/share/pnpm
```

**Cache issues**
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## IDE Integration

### VS Code

Update your VS Code tasks and launch configurations to use `pnpm` instead of `npm`.

**Example task (.vscode/tasks.json):**
```json
{
    "label": "Start Tauri Dev",
    "type": "shell",
    "command": "pnpm",
    "args": ["run", "tauri", "dev"]
}
```

## CI/CD Changes

The CI/CD pipeline has been updated to use pnpm:
- GitLab CI now uses `pnpm install --frozen-lockfile`
- Build scripts use pnpm commands
- All documentation reflects pnpm usage

## Getting Help

- **pnpm Documentation**: https://pnpm.io/
- **Project Issues**: Use GitLab issues for project-specific problems
- **Team Chat**: Ask in team channels for quick help

## Migration Checklist

- [ ] Install pnpm (`corepack enable`)
- [ ] Remove old dependencies (`rm -rf node_modules package-lock.json`)
- [ ] Install with pnpm (`pnpm install`)
- [ ] Update IDE configurations
- [ ] Test development workflow (`pnpm run tauri:dev`)
- [ ] Test build process (`pnpm run tauri:build`)
- [ ] Update any personal scripts or aliases

## FAQ

**Q: Can I still use npm?**
A: While npm might still work, we recommend using pnpm for consistency and to take advantage of the performance benefits.

**Q: What about the lock file?**
A: We now use `pnpm-lock.yaml` instead of `package-lock.json`. Don't commit both - only commit `pnpm-lock.yaml`.

**Q: Are there any breaking changes?**
A: No breaking changes to the application itself. Only the package manager commands have changed.

**Q: What if I encounter issues?**
A: Check the troubleshooting section above, or create an issue in the project repository with details about your problem.