# Package Management

Complete guide for managing dependencies in GitInspectorGUI development.

## Overview

GitInspectorGUI uses modern package managers for optimal development experience:

-   **uv** - Fast Python package management (10-100x faster than pip)
-   **pnpm** - Efficient Node.js package management (2x faster than npm)

## Python Dependencies (uv)

### Benefits

-   **10-100x faster** than pip
-   **Advanced dependency resolution** - prevents conflicts
-   **Automatic virtual environments** - no manual activation
-   **Unified toolchain** - replaces pip, pip-tools, virtualenv
-   **Lockfile support** - reproducible builds with `uv.lock`

### Installation

**macOS/Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Verify:**

```bash
uv --version  # Should show uv 0.4.x+
```

### Project Setup

```bash
cd gitinspectorgui
uv venv          # Create virtual environment
uv sync          # Install dependencies
```

### Commands

| Command                      | Purpose                  |
| ---------------------------- | ------------------------ |
| `uv sync`                    | Install all dependencies |
| `uv add package`             | Add dependency           |
| `uv add --group dev package` | Add dev dependency       |
| `uv remove package`          | Remove dependency        |
| `uv pip list`                | List packages            |
| `uv sync --upgrade`          | Update all packages      |

### Development Workflow

```bash
# Install dependencies
uv sync

# Add new dependency
uv add fastapi

# Add dev dependency
uv add --group dev pytest

# Run project commands
gigui --help
python -m gigui.start_server
pytest
mkdocs serve
```

### Troubleshooting

**Command Not Found:**

```bash
source ~/.bashrc  # Linux
source ~/.zshrc   # macOS
```

**Environment Issues:**

```bash
rm -rf .venv
uv venv
uv sync
```

**Port Conflicts:**

```bash
mkdocs serve --dev-addr=127.0.0.1:8001
# or
lsof -i :8000
kill -9 <PID>
```

## Frontend Dependencies (pnpm)

### Installation

```bash
# Enable pnpm (recommended)
corepack enable

# Or install globally
npm install -g pnpm
```

### Benefits

-   **2x faster** than npm installs
-   **Disk space efficient** - shared dependency storage
-   **Stricter security** - better dependency resolution
-   **Monorepo support** - workspace management

### Commands

| Command                | Purpose              |
| ---------------------- | -------------------- |
| `pnpm install`         | Install dependencies |
| `pnpm run tauri dev`   | Start development    |
| `pnpm run tauri build` | Build production     |
| `pnpm test`            | Run tests            |
| `pnpm update`          | Update dependencies  |
| `pnpm audit`           | Security audit       |

### Development Workflow

For development server commands, see **[Development Commands](development-commands.md)**.

### Production Build

```bash
pnpm run tauri build
```

### Troubleshooting

**Command Not Found:**

```bash
corepack enable
# or
npm install -g pnpm
```

**Permission Issues:**

```bash
sudo chown -R $(whoami) ~/.local/share/pnpm
```

**Cache Issues:**

```bash
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## IDE Integration

### VS Code Setup

**Python Environment:**

1. `Ctrl+Shift+P` → "Python: Select Interpreter"
2. Choose `.venv/bin/python`

**Task Configuration (.vscode/tasks.json):**

```json
{
    "label": "Start Tauri Dev",
    "type": "shell",
    "command": "pnpm",
    "args": ["run", "tauri", "dev"]
}
```

### PyCharm Setup

1. File → Settings → Project → Python Interpreter
2. Add → Existing Environment → `.venv/bin/python`

## CI/CD Integration

### Python (uv)

-   Uses `uv sync` for dependency installation
-   Lock file: `uv.lock` (commit to version control)
-   Virtual environment automatically managed

### Frontend (pnpm)

-   Uses `pnpm install --frozen-lockfile` in CI
-   Lock file: `pnpm-lock.yaml` (commit to version control)
-   All build scripts use pnpm commands

### Example CI Configuration

```yaml
# Install dependencies
- name: Install Python dependencies
  run: uv sync

- name: Install Node.js dependencies
  run: pnpm install --frozen-lockfile

# Run tests
- name: Test Python
  run: uv run pytest

- name: Test Frontend
  run: pnpm test

# Build
- name: Build application
  run: pnpm run tauri build
```

## Combined Development Workflow

### Complete Setup

```bash
# 1. Install package managers (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh  # uv
corepack enable                                   # pnpm

# 2. Install all dependencies
uv sync          # Python dependencies
pnpm install     # Node.js dependencies

# 3. Start development (see Development Workflow for all options)
python -m gigui.start_server --reload  # Terminal 1
pnpm run tauri dev                      # Terminal 2
```

### Dependency Updates

```bash
# Update Python dependencies
uv sync --upgrade

# Update Node.js dependencies
pnpm update
pnpm audit fix

# Update Rust dependencies (if needed)
cargo update
```

### Clean Reinstall

```bash
# Clean Python environment
rm -rf .venv
uv venv
uv sync

# Clean Node.js environment
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Best Practices

### Version Management

-   **Commit lock files** to version control for reproducible builds
-   **Use exact versions** for critical dependencies
-   **Regular updates** to stay current with security patches

### Performance

-   **Use uv for Python** - significantly faster than pip
-   **Use pnpm for Node.js** - faster and more efficient than npm
-   **Enable corepack** for automatic pnpm management

### Security

-   **Regular audits** with `pnpm audit` and dependency scanning
-   **Review updates** before applying to catch breaking changes
-   **Use lock files** to ensure consistent dependency versions

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Core development patterns
-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
