# Package Management

Complete guide to dependency management in GitInspectorGUI using modern package
managers.

## Quick Setup

```bash
# Complete development setup
uv sync && pnpm install && pnpm run tauri dev
```

## Benefits

GitInspectorGUI uses separate package managers optimized for each ecosystem:

- **Python backend:** `uv` - 10-100x faster than pip with integrated virtual
  environments
- **JavaScript/TypeScript frontend:** `pnpm` - 2x faster than npm with shared dependency
  storage

## Installation

### uv (Python)

**macOS/Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### pnpm (JavaScript)

```bash
corepack enable
```

**Note**: Modern Node.js includes Corepack, which creates the `pnpm` command when
enabled.

## Commands

### Python Development (uv)

| Command                      | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `uv venv`                    | Create virtual environment                   |
| `uv sync`                    | Install all dependencies from pyproject.toml |
| `uv add package`             | Add dependency                               |
| `uv add --group dev package` | Add dev dependency                           |
| `uv remove package`          | Remove dependency                            |
| `uv pip list`                | List installed packages                      |
| `uv sync --upgrade`          | Update all packages                          |

### JavaScript Development (pnpm)

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

### Python Environment Setup

Before installing dependencies or working with the project, you need to create and
activate a virtual environment:

```bash
# Create a virtual environment in the .venv directory
uv venv
```

```bash
# Activate the virtual environment (macOS/Linux)
source .venv/bin/activate
```

```powershell
# Activate the virtual environment (Windows)
.venv\Scripts\activate
```

Your terminal prompt should now show `(.venv)` indicating the environment is active

### Package Management

Once your virtual environment is set up and activated, you can proceed with dependency
management:

```bash
# Install dependencies
uv sync

# Add new dependency
uv add gitpython

# Add dev dependency
uv add --group dev pytest

# Run project commands
gigui --help
# PyO3 embedded - no separate server needed
pnpm run tauri dev
pytest
mkdocs serve
```

### Complete Development Environment

```bash
# Start complete development environment
pnpm run tauri dev

# This starts:
# - Tauri desktop application with embedded Python
# - Vite dev server for frontend hot reload
# - PyO3 integration for Python function calls
```

For more detailed development commands, see
**[Development Commands](development-commands.md)**.

## Key Differences

### Environment Management

**Python with uv**:

- Requires virtual environment activation for development
- `uv sync` handles both dependencies and project installation
- `uv run` can execute commands without manual activation

**JavaScript with pnpm**:

- Automatic project-level dependency isolation
- No environment activation required
- Dependencies resolved automatically at runtime

### Running Commands

**Python Examples**:

```bash
# With environment activated
source .venv/bin/activate
python script.py
pytest

# Or use uv run (no activation needed)
uv run python script.py
uv run pytest
```

**JavaScript Examples**:

```bash
# Direct execution (automatic dependency resolution)
node script.js
pnpm test

# Run project scripts
pnpm run dev
pnpm run build
```

## Configuration Files

### Python Configuration

**`pyproject.toml`** - Main Python project configuration:

```toml
[project]
name = "gitinspectorgui"
dependencies = [
    "gitpython>=3.1.44",
    "psutil>=7.0.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=7.4.0",
    "black>=23.0.0",
]
```

**`uv.lock`** - Lock file with exact dependency versions (auto-generated)

### JavaScript Configuration

**`package.json`** - Main Node.js project configuration:

```json
{
  "name": "gitinspectorgui",
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "react": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

**`pnpm-lock.yaml`** - Lock file with exact dependency versions (auto-generated)

## Performance Comparison

| Feature        | uv (Python)    | pip (Python) | pnpm (JavaScript) | npm (JavaScript) |
| -------------- | -------------- | ------------ | ----------------- | ---------------- |
| **Speed**      | 10-100x faster | Baseline     | 2x faster         | Baseline         |
| **Disk Usage** | Standard       | Standard     | Shared storage    | Duplicated       |
| **Lock Files** | Auto-generated | Manual       | Automatic         | Automatic        |

## Troubleshooting

### Python Issues

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

**Package Conflicts:**

```bash
# View dependency tree to identify conflicts
uv pip list

# Reinstall with clean environment
rm -rf .venv
uv venv
uv sync
```

### JavaScript Issues

**Command not found:**

```bash
# Enable pnpm
corepack enable

# Or install globally
npm install -g pnpm
```

**Permission issues (macOS/Linux):**

```bash
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

### Python Dependencies

```yaml
- name: Install Python dependencies
  run: uv sync

- name: Test Python
  run: uv run pytest
```

### JavaScript Dependencies

```yaml
- name: Install Node.js dependencies
  run: pnpm install --frozen-lockfile

- name: Test Frontend
  run: pnpm test
```

## Best Practices

### Package Manager Consistency

**Important**: Never mix package managers in the same project:

- Use `uv` exclusively for Python dependencies
- Use `pnpm` exclusively for JavaScript dependencies
- Mixing creates conflicting lock files and breaks dependency resolution

### Lock File Management

**Always commit lock files to version control:**

- `uv.lock` (Python)
- `pnpm-lock.yaml` (JavaScript)

**Never commit these directories:**

- `.venv/` (Python virtual environment)
- `node_modules/` (JavaScript dependencies)

### IDE Integration

**VS Code Python Setup:**

When working with Python projects in VS Code, you need to select the correct Python
interpreter:

1. `Ctrl+Shift+P` → "Python: Select Interpreter"
2. Choose `.venv/bin/python` (or your project's virtual environment)

VS Code handles Python environments differently from terminal-based workflows:

- **Auto-detection**: VS Code often automatically detects virtual environments in common
  locations (like `.venv/` folders)
- **Workspace memory**: Once selected, VS Code remembers the interpreter in workspace
  settings
- **Terminal integration**: When you open an integrated terminal after selecting a venv
  interpreter, VS Code usually auto-activates that environment

**Best practice workflow:**

1. Open your project in VS Code
2. Select the Python interpreter (`Ctrl+Shift+P` → "Python: Select Interpreter")
3. Choose your project's virtual environment
4. VS Code will remember this choice and auto-activate the venv in new terminals

You can also create a `.vscode/settings.json` file in your project root for team
consistency:

```json
{
  "python.pythonPath": ".venv/bin/python"
}
```

This ensures the correct interpreter is automatically selected when anyone opens the
project.

## Related Documentation

- **[Package Management Fundamentals](package-management-fundamentals.md)** - Design
  philosophy, ecosystem differences, and historical background
- **[Development Workflow](development-workflow.md)** - Core development patterns
- **[Environment Setup](environment-setup.md)** - Development configuration
- **[Development Commands](development-commands.md)** - Common commands reference
