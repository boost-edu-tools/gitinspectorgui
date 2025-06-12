# Package Management (pnpm)

Frontend dependency management for GitInspectorGUI using pnpm.

## Installation

```bash
# Enable pnpm (recommended)
corepack enable

# Or install globally
npm install -g pnpm
```

## Commands

| Command                | Purpose              |
| ---------------------- | -------------------- |
| `pnpm install`         | Install dependencies |
| `pnpm run tauri:dev`   | Start development    |
| `pnpm run tauri:build` | Build production     |
| `pnpm test`            | Run tests            |
| `pnpm update`          | Update dependencies  |
| `pnpm audit`           | Security audit       |

## Benefits

-   **2x faster** than npm installs
-   **Disk space efficient** - shared dependency storage
-   **Stricter security** - better dependency resolution
-   **Monorepo support** - workspace management

## Development Workflow

```bash
# Start API server
python -m gigui.start_server --reload

# Start Tauri app (new terminal)
pnpm run tauri:dev
```

## Production Build

```bash
pnpm run tauri:build
```

## Troubleshooting

### Command Not Found

```bash
corepack enable
# or
npm install -g pnpm
```

### Permission Issues

```bash
sudo chown -R $(whoami) ~/.local/share/pnpm
```

### Cache Issues

```bash
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## VS Code Integration

**.vscode/tasks.json:**

```json
{
    "label": "Start Tauri Dev",
    "type": "shell",
    "command": "pnpm",
    "args": ["run", "tauri", "dev"]
}
```

## CI/CD

-   Uses `pnpm install --frozen-lockfile`
-   Lock file: `pnpm-lock.yaml` (commit to version control)
-   All build scripts use pnpm commands

## Related

-   **[Python Management (uv)](python-management-uv.md)** - Backend dependencies
-   **[Development Mode](development-mode.md)** - Local development setup
