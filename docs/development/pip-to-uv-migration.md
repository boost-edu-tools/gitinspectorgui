# pip to uv Migration Guide

## Overview

This guide helps team members migrate from `pip` to `uv` for Python package management in the GitInspectorGUI project. The project uses `uv` as the modern Python package manager for better performance, dependency resolution, and development experience.

## Why uv?

### Performance Benefits
- **10-100x faster** than pip for most operations
- **Faster dependency resolution** with advanced solver
- **Parallel downloads** and installations
- **Efficient caching** reduces repeated downloads

### Better Dependency Management
- **Unified tool** - replaces pip, pip-tools, pipx, virtualenv, and more
- **Lockfile support** with `uv.lock` for reproducible builds
- **Better conflict resolution** prevents dependency hell
- **Cross-platform consistency** with deterministic installs

### Modern Development Experience
- **Single binary** - no Python required for installation
- **Project management** - handles virtual environments automatically
- **Tool integration** - works seamlessly with pyproject.toml
- **Version management** - can install and manage Python versions

## Quick Migration Steps

### 1. Install uv

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Alternative (using pip):**
```bash
pip install uv
```

### 2. Verify Installation

```bash
uv --version
# Should show: uv 0.4.x or later
```

### 3. Project Setup

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

## Command Comparison

| pip command | uv equivalent | Notes |
|-------------|---------------|-------|
| `pip install package` | `uv add package` | Adds to pyproject.toml |
| `pip install -r requirements.txt` | `uv sync` | Uses pyproject.toml |
| `pip install -e .` | `uv sync` | Installs project in dev mode |
| `pip install --upgrade package` | `uv add package --upgrade` | Updates specific package |
| `pip list` | `uv pip list` | Lists installed packages |
| `pip show package` | `uv pip show package` | Shows package info |
| `pip freeze` | `uv pip freeze` | Exports installed packages |
| `pip uninstall package` | `uv remove package` | Removes from pyproject.toml |
| `python -m venv .venv` | `uv venv` | Creates virtual environment |
| `pip install --dev` | `uv add --group dev` | Adds to dev dependencies |

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
# Run Python scripts with project environment
uv run python script.py

# Run project CLI commands
uv run gigui --help

# Run development tools
uv run pytest
uv run mkdocs serve
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

# Run the CLI tool
uv run gigui --help

# Run tests
uv run pytest

# Build documentation
uv run mkdocs build

# Start development server
uv run mkdocs serve

# Run API server
uv run python -m gigui.start_server
```

### Build and Distribution

```bash
# Build wheel
uv build

# Install from local build
uv pip install dist/gitinspectorgui-*.whl
```

## Benefits Achieved

### Performance Improvements
- **Installation speed**: 10-100x faster than pip
- **Dependency resolution**: Advanced solver prevents conflicts
- **Caching**: Global cache reduces redundant downloads
- **Parallel operations**: Multiple packages installed simultaneously

### Better Development Experience
- **Automatic environment management**: No need to manually activate/deactivate
- **Integrated toolchain**: Single tool for all Python package operations
- **Modern configuration**: Full pyproject.toml support
- **Cross-platform consistency**: Same behavior on all operating systems

### Project Benefits
- **Reproducible builds**: uv.lock ensures consistent environments
- **Faster CI/CD**: Reduced dependency installation time
- **Better collaboration**: Team members get identical environments
- **Future-proof**: Modern tooling aligned with Python ecosystem direction

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

## Migration Checklist

- [ ] Install uv globally
- [ ] Verify uv installation with `uv --version`
- [ ] Navigate to project directory
- [ ] Run `uv sync` to install dependencies
- [ ] Test project functionality with `uv run gigui --help`
- [ ] Update IDE to use uv-created virtual environment
- [ ] Update development workflow to use `uv` commands
- [ ] Remove old pip-based workflows and scripts

## FAQ

**Q: Can I still use pip alongside uv?**
A: Yes, but it's recommended to use uv consistently for better dependency management.

**Q: What happens to my existing virtual environment?**
A: uv will create a new `.venv` directory. You can remove old environments after confirming uv works.

**Q: Does uv work with existing pyproject.toml?**
A: Yes, uv fully supports pyproject.toml and is the recommended way to manage dependencies.

**Q: How do I share my environment with team members?**
A: The `pyproject.toml` and `uv.lock` files ensure everyone gets the same environment with `uv sync`.

**Q: Can uv install different Python versions?**
A: Yes, uv can install and manage Python versions: `uv python install 3.12`

## Additional Resources

- [uv Documentation](https://docs.astral.sh/uv/)
- [uv GitHub Repository](https://github.com/astral-sh/uv)
- [Python Packaging Guide](https://packaging.python.org/)
- [pyproject.toml Specification](https://peps.python.org/pep-0621/)

---

**Migration completed!** You're now using modern Python package management with uv. 🚀

For questions or issues, refer to the troubleshooting section above or consult the team.