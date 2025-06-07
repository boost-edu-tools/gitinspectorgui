# Python Package Management with uv

## Overview

GitInspectorGUI uses `uv` as the modern Python package manager for superior performance, dependency resolution, and development experience.

## Why uv?

### Performance Benefits

-   **10-100x faster** than pip for most operations
-   **Faster dependency resolution** with advanced solver
-   **Parallel downloads** and installations
-   **Efficient caching** reduces repeated downloads

### Better Dependency Management

-   **Unified tool** - replaces pip, pip-tools, pipx, virtualenv, and more
-   **Lockfile support** with `uv.lock` for reproducible builds
-   **Better conflict resolution** prevents dependency hell
-   **Cross-platform consistency** with deterministic installs

### Modern Development Experience

-   **Single binary** - no Python required for installation
-   **Project management** - handles virtual environments automatically
-   **Tool integration** - works seamlessly with pyproject.toml
-   **Version management** - can install and manage Python versions

## Installation and Setup

### Install uv

**macOS/Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Verify Installation

```bash
uv --version
# Should show: uv 0.4.x or later
```

### Project Setup

```bash
# Navigate to project directory
cd gitinspectorgui

# Create virtual environment (if not exists)
uv venv

# Install project dependencies
uv sync

# Activate environment (optional - uv handles this automatically)
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate     # Windows
```

## Common Commands

| Command                      | Purpose                    | Notes                        |
| ---------------------------- | -------------------------- | ---------------------------- |
| `uv add package`             | Add dependency             | Adds to pyproject.toml       |
| `uv sync`                    | Install all dependencies   | Uses pyproject.toml          |
| `uv add package --upgrade`   | Update specific package    | Updates to latest version    |
| `uv pip list`                | List installed packages    | Shows current environment    |
| `uv pip show package`        | Show package info          | Detailed package information |
| `uv remove package`          | Remove dependency          | Removes from pyproject.toml  |
| `uv venv`                    | Create virtual environment | Creates .venv directory      |
| `uv add --group dev package` | Add dev dependency         | Adds to dev dependencies     |

## Development Workflow

### Installing Dependencies

```bash
# Install all dependencies (runtime + dev)
uv sync

# Install only runtime dependencies
uv sync --no-group dev

# Install specific dependency group
uv sync --group dev
```

### Adding New Dependencies

```bash
# Add runtime dependency
uv add fastapi

# Add development dependency
uv add --group dev pytest

# Add with version constraint
uv add "requests>=2.25.0"
```

### Running Scripts

```bash
# First, ensure dependencies are installed and environment is activated
uv sync

# Then run commands directly (uv automatically manages the environment)
python script.py

# Run project CLI commands
gigui --help

# Run development tools
pytest
mkdocs serve
# To stop: pkill -f "mkdocs serve"
```

### Updating Dependencies

```bash
# Update all dependencies
uv sync --upgrade

# Update specific package
uv add package --upgrade

# Update to latest compatible versions
uv lock --upgrade
```

## Project-Specific Commands

### GitInspectorGUI Development

```bash
# Install project in development mode
uv sync

# After uv sync, commands are available directly:

# Run the CLI tool
gigui --help

# Run tests
pytest

# Build documentation
mkdocs build

# Start development server
mkdocs serve
# To stop: pkill -f "mkdocs serve"

# Run API server
python -m gigui.start_server
# To stop: pkill -f "gigui.start_server"
```

## Benefits Achieved

### Performance Improvements

-   **Installation speed**: 10-100x faster than pip
-   **Dependency resolution**: Advanced solver prevents conflicts
-   **Caching**: Global cache reduces redundant downloads
-   **Parallel operations**: Multiple packages installed simultaneously

### Better Development Experience

-   **Automatic environment management**: No need to manually activate/deactivate
-   **Integrated toolchain**: Single tool for all Python package operations
-   **Modern configuration**: Full pyproject.toml support
-   **Cross-platform consistency**: Same behavior on all operating systems

### Project Benefits

-   **Reproducible builds**: uv.lock ensures consistent environments
-   **Faster CI/CD**: Reduced dependency installation time
-   **Better collaboration**: Team members get identical environments
-   **Future-proof**: Modern tooling aligned with Python ecosystem direction

## Troubleshooting

### Common Issues

**uv command not found:**

```bash
# Restart terminal or source the environment
source ~/.bashrc  # Linux
source ~/.zshrc   # macOS with zsh
```

**Permission errors:**

```bash
# uv installs to user directory by default, no sudo needed
# If issues persist, check PATH:
echo $PATH | grep -o '[^:]*\.local/bin[^:]*'
```

**Virtual environment issues:**

```bash
# Remove and recreate environment
rm -rf .venv
uv venv
uv sync
```

**Dependency conflicts:**

```bash
# uv has better conflict resolution than pip
# If issues occur, try:
uv sync --refresh
```

**mkdocs serve port conflicts:**

```bash
# If port 8000 is in use, use a different port
mkdocs serve --dev-addr=127.0.0.1:8001

# Or find and kill the process using port 8000
lsof -i :8000
kill -9 <PID>
```

### Getting Help

```bash
# General help
uv --help

# Command-specific help
uv add --help
uv sync --help

# Check project status
uv pip check
```

## IDE Integration

### VS Code

1. **Python Interpreter**: Select the uv-created virtual environment

    - `Ctrl+Shift+P` → "Python: Select Interpreter"
    - Choose `.venv/bin/python` (or `.venv\Scripts\python.exe` on Windows)

2. **Terminal Integration**: VS Code will automatically activate the environment

### PyCharm

1. **Project Interpreter**:
    - File → Settings → Project → Python Interpreter
    - Add → Existing Environment
    - Select `.venv/bin/python`

## Setup Checklist

-   [ ] Install uv globally
-   [ ] Verify uv installation with `uv --version`
-   [ ] Navigate to project directory
-   [ ] Run `uv sync` to install dependencies
-   [ ] Test project functionality with `uv run gigui --help`
-   [ ] Configure IDE to use uv-created virtual environment
-   [ ] Verify all development workflows function correctly

## FAQ

**Q: Why does the project use uv?**
A: uv provides superior performance, better dependency management, and a modern development experience compared to traditional pip workflows.

**Q: How does uv handle virtual environments?**
A: uv automatically creates and manages virtual environments in the `.venv` directory, eliminating manual activation/deactivation.

**Q: How do I share my environment with team members?**
A: The `pyproject.toml` and `uv.lock` files ensure everyone gets identical environments with `uv sync`.

**Q: Can uv install different Python versions?**
A: Yes, uv can install and manage Python versions: `uv python install 3.12`

**Q: What if I encounter issues?**
A: Check the troubleshooting section above, or refer to the uv documentation for detailed guidance.

## Additional Resources

-   [uv Documentation](https://docs.astral.sh/uv/)
-   [uv GitHub Repository](https://github.com/astral-sh/uv)
-   [Python Packaging Guide](https://packaging.python.org/)
-   [pyproject.toml Specification](https://peps.python.org/pep-0621/)

---

The project uses modern Python package management with uv for optimal performance and developer experience. 🚀
