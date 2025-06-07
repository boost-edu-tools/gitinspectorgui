# Node.js Package Management with pnpm

This guide covers the Node.js package management setup for GitInspectorGUI's frontend using pnpm.

## Overview

GitInspectorGUI uses pnpm for Node.js package management (JavaScript/TypeScript dependencies for the Tauri frontend), providing better performance, disk space efficiency, and dependency management compared to npm.

**Note**: This covers frontend dependencies only. For Python backend dependencies, see [Python Management (uv)](python-management-uv.md).

## Installation and Setup

### Install pnpm

```bash
# Enable pnpm (recommended)
corepack enable

# Or install globally
npm install -g pnpm
```

### Project Setup

```bash
# Install project dependencies
pnpm install
```

### Common Commands

| Command                | Purpose                    |
| ---------------------- | -------------------------- |
| `pnpm install`         | Install all dependencies   |
| `pnpm run tauri:dev`   | Start development server   |
| `pnpm run tauri:build` | Build for production       |
| `pnpm run dev`         | Start frontend development |
| `pnpm test`            | Run tests                  |
| `pnpm update`          | Update dependencies        |
| `pnpm audit`           | Security audit             |

## Key Benefits

-   **Faster installs**: Up to 2x faster than npm
-   **Disk space savings**: Shared dependency storage
-   **Better security**: Stricter dependency resolution
-   **Monorepo support**: Better workspace management

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

-   GitLab CI now uses `pnpm install --frozen-lockfile`
-   Build scripts use pnpm commands
-   All documentation reflects pnpm usage

## Getting Help

-   **pnpm Documentation**: https://pnpm.io/
-   **Project Issues**: Use GitLab issues for project-specific problems
-   **Team Chat**: Ask in team channels for quick help

## Setup Checklist

-   [ ] Install pnpm (`corepack enable`)
-   [ ] Install project dependencies (`pnpm install`)
-   [ ] Configure IDE for pnpm usage
-   [ ] Test development workflow (`pnpm run tauri:dev`)
-   [ ] Test build process (`pnpm run tauri:build`)
-   [ ] Verify all scripts work correctly

## FAQ

**Q: Why does the project use pnpm?**
A: pnpm provides better performance, disk space efficiency, and more reliable dependency management compared to npm.

**Q: What about the lock file?**
A: The project uses `pnpm-lock.yaml` for dependency locking. This file should be committed to version control.

**Q: Can I use npm instead?**
A: While npm might work, pnpm is the recommended and supported package manager for this project.

**Q: What if I encounter issues?**
A: Check the troubleshooting section above, or create an issue in the project repository with details about your problem.
