# Python Package Management

This guide covers Python package management in GitInspectorGUI using `uv`, a fast and reliable Python package manager and environment manager.

## Related Guides

-   [Package Management Overview](package-management-overview.md) - General package management philosophy and combined workflows
-   [JavaScript Package Management](javascript-package-management.md) - JavaScript/TypeScript dependencies with pnpm

## Overview

GitInspectorGUI uses `uv` for Python package management. uv is a modern Python package manager that offers significant speed improvements over traditional tools like pip and virtualenv.

## Benefits

-   **10-100x faster** than pip
-   **Advanced dependency resolution**: Prevents conflicts between packages and their dependencies
-   **Unified toolchain**: Replaces multiple Python tools and files:

    -   pip (package installation)
    -   pip-tools (dependency resolution)
    -   virtualenv/venv (environment management)
    -   build/setuptools (package building)
    -   twine (package publishing)
    -   setup.py/setup.cfg (package configuration)
    -   requirements.txt files (dependency specification)

    All consolidated into a single tool with pyproject.toml as the central configuration file

-   **Lockfile support**: Reproducible builds with `uv.lock`

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
uv --version  # Should show uv 0.6.x+
```

## Commands

| Command                      | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `uv venv`                    | Create virtual environment                   |
| `uv sync`                    | Install all dependencies from pyproject.toml |
| `uv add package`             | Add dependency                               |
| `uv add --group dev package` | Add dev dependency                           |
| `uv remove package`          | Remove dependency                            |
| `uv pip list`                | List installed packages                      |
| `uv sync --upgrade`          | Update all packages                          |

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

**Command Not Found:**

```bash
source ~/.bashrc  # Linux
source ~/.zshrc   # macOS
```

**Environment Issues:**

```bash
# Clean reinstall of virtual environment
rm -rf .venv
uv venv
uv sync
```

**Port Conflicts:**

```bash
# Change port for services like mkdocs
mkdocs serve --dev-addr=127.0.0.1:8001

# Or find and kill process using a port
lsof -i :8000
kill -9 <PID>
```

**Package Conflicts:**

```bash
# View dependency tree to identify conflicts
uv pip list

# Reinstall with clean environment
rm -rf .venv
uv venv
uv sync
```

## IDE Integration

### VS Code Setup

When working with Python projects in VS Code, you need to select the correct Python interpreter:

1. `Ctrl+Shift+P` → "Python: Select Interpreter"
2. Choose `.venv/bin/python` (or your project's virtual environment)

VS Code handles Python environments differently from terminal-based workflows:

-   **Auto-detection**: VS Code often automatically detects virtual environments in common locations (like `.venv/` folders)
-   **Workspace memory**: Once selected, VS Code remembers the interpreter in workspace settings
-   **Terminal integration**: When you open an integrated terminal after selecting a venv interpreter, VS Code usually auto-activates that environment

**Best practice workflow:**

1. Open your project in VS Code
2. Select the Python interpreter (`Ctrl+Shift+P` → "Python: Select Interpreter")
3. Choose your project's virtual environment
4. VS Code will remember this choice and auto-activate the venv in new terminals

You can also create a `.vscode/settings.json` file in your project root for team consistency:

```json
{
    "python.pythonPath": ".venv/bin/python"
}
```

This ensures the correct interpreter is automatically selected when anyone opens the project.

## CI/CD Integration

For Python dependencies in CI/CD pipelines:

-   Uses `uv sync` for dependency installation
-   Lock file: `uv.lock` (commit to version control)
-   Virtual environment automatically managed

### Example CI Configuration

```yaml
# Install dependencies
- name: Install Python dependencies
  run: uv sync

# Run tests
- name: Test Python
  run: uv run pytest
```

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Core development patterns
-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Development Commands](development-commands.md)** - Common commands reference
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
