# Python Management (uv)

Backend dependency management for GitInspectorGUI using uv.

## Benefits

-   **10-100x faster** than pip
-   **Advanced dependency resolution** - prevents conflicts
-   **Automatic virtual environments** - no manual activation
-   **Unified toolchain** - replaces pip, pip-tools, virtualenv
-   **Lockfile support** - reproducible builds with `uv.lock`

## Installation

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

## Project Setup

```bash
cd gitinspectorgui
uv venv          # Create virtual environment
uv sync          # Install dependencies
```

## Commands

| Command                      | Purpose                  |
| ---------------------------- | ------------------------ |
| `uv sync`                    | Install all dependencies |
| `uv add package`             | Add dependency           |
| `uv add --group dev package` | Add dev dependency       |
| `uv remove package`          | Remove dependency        |
| `uv pip list`                | List packages            |
| `uv sync --upgrade`          | Update all packages      |

## Development Workflow

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

## Troubleshooting

### Command Not Found

```bash
source ~/.bashrc  # Linux
source ~/.zshrc   # macOS
```

### Environment Issues

```bash
rm -rf .venv
uv venv
uv sync
```

### Port Conflicts

```bash
mkdocs serve --dev-addr=127.0.0.1:8001
# or
lsof -i :8000
kill -9 <PID>
```

## IDE Setup

### VS Code

1. `Ctrl+Shift+P` → "Python: Select Interpreter"
2. Choose `.venv/bin/python`

### PyCharm

1. File → Settings → Project → Python Interpreter
2. Add → Existing Environment → `.venv/bin/python`

## Related

-   **[Package Management (pnpm)](package-management-pnpm.md)** - Frontend dependencies
-   **[Development Mode](development-mode.md)** - Local development setup
