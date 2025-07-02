# JavaScript Package Management

This guide covers JavaScript/TypeScript package management in GitInspectorGUI using `pnpm`, a fast and disk-efficient package manager for Node.js projects.

## Related Guides

-   [Package Management Overview](package-management-overview.md) - General package management philosophy and combined workflows
-   [Python Package Management](python-package-management.md) - Python dependencies with uv

## Overview

GitInspectorGUI uses `pnpm` for JavaScript/TypeScript package management. pnpm is a modern alternative to npm and yarn that offers significant performance and disk space improvements.

## Benefits

-   **2x faster** than npm installs
-   **Disk space efficient**: Uses a shared dependency storage to avoid duplication
-   **Stricter security**: Better dependency resolution to prevent "phantom dependencies"
-   **Monorepo support**: Workspace management for projects with multiple packages

## Installation of pnpm

```bash
corepack enable
```

**Explanation**:

Modern Node.js includes Corepack (a package manager manager) but it's disabled by default. `corepack enable` activates it and creates the `pnpm` binary.

**What happens**:

1. Creates a `pnpm` command on your system PATH
2. This `pnpm` command is a wrapper that automatically downloads the correct pnpm version when needed
3. No separate pnpm installation required


## Commands

| Command                | Purpose                            |
| ---------------------- | ---------------------------------- |
| `pnpm install`         | Install all dependencies           |
| `pnpm add package`     | Add a dependency                   |
| `pnpm add -D package`  | Add a dev dependency               |
| `pnpm remove package`  | Remove a dependency                |
| `pnpm run tauri dev`   | Start development server           |
| `pnpm run tauri build` | Build production application       |
| `pnpm test`            | Run tests                          |
| `pnpm update`          | Update dependencies                |
| `pnpm audit`           | Run security audit on dependencies |

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run tauri dev

# Run tests
pnpm test
```

For more detailed development commands, see **[Development Commands](development-commands.md)**.

## Production Build

```bash
pnpm run tauri build
```

## Troubleshooting

**Command Not Found:**

```bash
# Enable pnpm through corepack
corepack enable

# Or install globally
npm install -g pnpm
```

**Permission Issues:**

```bash
# Fix permission issues with pnpm store
sudo chown -R $(whoami) ~/.local/share/pnpm
```

**Cache Issues:**

```bash
# Clean pnpm cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Dependency Resolution Issues:**

```bash
# Reinstall with clean lockfile
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## CI/CD Integration

For JavaScript/TypeScript dependencies in CI/CD pipelines:

-   Uses `pnpm install --frozen-lockfile` in CI
-   Lock file: `pnpm-lock.yaml` (commit to version control)
-   All build scripts use pnpm commands

> **Note**: "Frozen lockfile" means dependencies are installed exactly as specified in the lock file, ensuring consistent builds across environments.

### Example CI Configuration

```yaml
# Install dependencies
- name: Install Node.js dependencies
  run: pnpm install --frozen-lockfile

# Run tests
- name: Test Frontend
  run: pnpm test

# Build
- name: Build application
  run: pnpm run tauri build
```

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Core development patterns
-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Development Commands](development-commands.md)** - Common commands reference
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
