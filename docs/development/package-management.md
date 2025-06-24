# Package Management

## Overview

GitInspectorGUI uses two different package managers for its backend and frontend components:

-   **Python backend**: Uses `uv` for fast Python package management and virtual environments
-   **JavaScript/TypeScript frontend**: Uses `pnpm` for efficient Node.js package management

These package managers have different approaches to dependency management:

-   **uv (Python)**: Focuses on speed and reproducibility while improving Python's virtual environment experience
-   **pnpm (JavaScript)**: Emphasizes disk space efficiency and automatic dependency isolation

The following sections explain how to use each package manager effectively in this project.

## Package Management Philosophy: Python vs JavaScript

> **Note**: This section explains how Python and JavaScript package managers evolved in different directions. If you're looking for practical commands, skip to the [Python Dependencies](#python-dependencies-uv) or [Frontend Dependencies](#frontend-dependencies-pnpm) sections.

### Python: Manual Virtual Environment Management

Python's approach requires explicit environment management:

-   **Manual isolation**: Virtual environments must be created and activated manually
-   **Activation required**: Each project switch requires sourcing the virtual environment
-   **Explicit management**: Developers must remember to activate/deactivate environments

```bash
# Example of Python's manual environment management
cd data-processor
source .venv/bin/activate    # Manual step required
python analyze.py            # Now uses data-processor's dependencies

cd ../web-scraper
source .venv/bin/activate    # Manual step required again
python crawl.py              # Now uses web-scraper's dependencies
```

### JavaScript/Node.js: Automatic Project-Level Dependencies

JavaScript achieved seamless dependency isolation through its design philosophy:

-   **Automatic isolation**: Each project gets its own `node_modules` directory
-   **Zero configuration**: Dependencies are isolated per project by default
-   **Seamless switching**: Simply `cd` into any project and run commands normally
-   **No activation required**: Package resolution happens automatically

```bash
# Example of JavaScript's automatic dependency isolation
cd frontend-app
npm start             # Automatically uses frontend-app's dependencies

cd ../api-service
npm test              # Automatically uses api-service's dependencies
```

The JavaScript ecosystem prioritized convenience and rapid development, accepting the overhead of duplicated dependencies across projects in exchange for zero-friction isolation.

### Why the Difference?

??? info "Historical and technical background"

    #### Historical Evolution

    -   **JavaScript (2009)**: Built with npm from the start, designed for per-project dependency trees
    -   **Python (1991)**: Predates modern package management; virtual environments were retrofitted later

    #### Design Philosophy

    -   **JavaScript**: "Move fast" culture accepts dependency duplication for convenience
    -   **Python**: "Explicit is better than implicit" philosophy requires manual environment management

    #### Technical Constraints

    -   **JavaScript packages**: Mostly pure JavaScript, easily portable and duplicatable
    -   **Python packages**: Often include compiled extensions tied to specific Python versions and system architectures

    #### Practical Impact

    **JavaScript developers** can seamlessly work across multiple projects without thinking about dependency management.

    **Python developers** must manually manage environments for each project, requiring:

    -   Creating virtual environments (`uv venv`)
    -   Activating environments (`source .venv/bin/activate`)
    -   Remembering to switch environments when changing projects
    -   Deactivating when done (`deactivate`)

## Python Dependencies (uv)

### Benefits

-   **10-100x faster** than pip
-   **Advanced dependency resolution**: Prevents conflicts between packages and their dependencies
-   **Improved virtual environment workflow**: Simplifies environment management with `uv run` prefix
-   **Unified toolchain**: Replaces pip, pip-tools, virtualenv in a single tool
-   **Lockfile support**: Reproducible builds with `uv.lock`

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

### Commands

| Command                      | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `uv venv`                    | Create virtual environment                   |
| `uv sync`                    | Install all dependencies from pyproject.toml |
| `uv add package`             | Add dependency                               |
| `uv add --group dev package` | Add dev dependency                           |
| `uv remove package`          | Remove dependency                            |
| `uv pip list`                | List installed packages                      |
| `uv sync --upgrade`          | Update all packages                          |

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

## Frontend Dependencies (pnpm)

### Benefits

-   **2x faster** than npm installs
-   **Disk space efficient**: Uses a shared dependency storage to avoid duplication
-   **Stricter security**: Better dependency resolution to prevent "phantom dependencies"
-   **Monorepo support**: Workspace management for projects with multiple packages

> **Note**: A "monorepo" is a single repository containing multiple related projects with their own dependencies.

### Installation

```bash
# Enable pnpm (recommended)
corepack enable

# Or install globally
npm install -g pnpm
```

### Commands

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

### Development Workflow

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run tauri dev

# Run tests
pnpm test
```

For more detailed development commands, see **[Development Commands](development-commands.md)**.

### Production Build

```bash
pnpm run tauri build
```

### Troubleshooting

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

> **Note**: "Frozen lockfile" means dependencies are installed exactly as specified in the lock file, ensuring consistent builds across environments.

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

If you encounter any issues with dependencies, a clean reinstall often helps:

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

## Glossary

-   **Dependency resolution**: The process of determining which versions of packages to install that satisfy all requirements without conflicts.
-   **Lock file**: A file that records the exact versions of all dependencies, ensuring reproducible builds.
-   **Monorepo**: A single repository containing multiple related projects with their own dependencies.
-   **Virtual environment**: An isolated Python environment with its own installed packages.
-   **Phantom dependencies**: Dependencies that are used but not explicitly declared in package.json.

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Core development patterns
-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Development Commands](development-commands.md)** - Common commands reference
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
