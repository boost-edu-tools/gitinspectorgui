# Installation

Set up the GitInspectorGUI development environment after installing prerequisites.

**Prerequisites**: Complete **[Prerequisites](01-prerequisites.md)** first - you need Python 3.13+, Node.js 22+, Rust 1.85+, and package managers installed.

**Note**: This is for setting up the development environment. For application usage, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Project Setup

### 1. Clone Repository

```bash
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui
```

### 2. Install Dependencies

Now we'll install dependencies for both the Python backend and the React/TypeScript frontend:

```bash
# Install Python dependencies (backend)
uv sync
# This reads pyproject.toml and installs all Python packages needed for the FastAPI server

# Install JavaScript/TypeScript dependencies (frontend)
pnpm install
# This reads package.json and installs all React/TypeScript packages needed for the UI

# Install Tauri CLI globally (desktop app framework)
pnpm add -g @tauri-apps/cli
# This gives you the 'tauri' command for building desktop applications
```

**What each command does**:

-   `uv sync`: Installs Python packages like FastAPI, GitPython, etc.
-   `pnpm install`: Installs React, TypeScript, Vite, and other frontend tools
-   `pnpm add -g @tauri-apps/cli`: Installs the Tauri command-line tool globally

## Verification

Let's test that everything is installed correctly by running each part of the system:

### Test Python API (Backend)

First, let's verify the Python backend works independently:

```bash
# Start the FastAPI server
python -m gigui.start_server

# In a new terminal, test the health endpoint
curl http://127.0.0.1:8080/health
```

**Expected response:**

```json
{
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-01-01T12:00:00Z"
}
```

**What this tests**:

-   Python environment is working
-   FastAPI server can start
-   HTTP endpoints are responding
-   All Python dependencies are installed correctly

### Test Tauri Application (Complete System)

Now let's test the complete desktop application:

```bash
pnpm run tauri dev
```

**What should happen**:

-   Vite builds the React/TypeScript frontend
-   Tauri compiles the Rust wrapper
-   A desktop window opens showing the GitInspectorGUI interface
-   The frontend automatically connects to the Python API server

**What this tests**:

-   Node.js and pnpm are working
-   React/TypeScript compilation works
-   Rust and Tauri are working
-   Frontend-backend communication works

## Development Environment Setup

### VS Code Extensions (Recommended)

```json
{
    "recommendations": [
        "ms-python.python",
        "rust-lang.rust-analyzer",
        "tauri-apps.tauri-vscode",
        "bradlc.vscode-tailwindcss"
    ]
}
```

### Python Environment Configuration

If using VS Code:

1. `Ctrl+Shift+P` → "Python: Select Interpreter"
2. Choose `.venv/bin/python` (created by `uv sync`)

## Troubleshooting

### Common Issues

**Python module not found:**

```bash
uv sync  # Reinstall dependencies
```

**Rust compilation errors:**

```bash
rustup update  # Update Rust toolchain
```

**Port 8080 in use:**

```bash
# macOS/Linux
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Node.js permissions:**

```bash
# macOS/Linux
sudo chown -R $(whoami) ~/.local/share/pnpm
```

### Getting Help

1. Check **[Troubleshooting Guide](../development/troubleshooting.md)** for detailed solutions
2. Review **[Development Workflow](../development/development-workflow.md)** for development patterns
3. Search project repository issues
4. Create new issue with error details

## Next Steps

After successful installation:

1. **[Quick Start](03-quick-start.md)** - Get the development environment running in 3 steps
2. **[First Analysis](04-first-analysis.md)** - Test your setup with repository analysis
3. **[Development Workflow](../development/development-workflow.md)** - Learn development patterns

## Summary

GitInspectorGUI installation sets up Python backend dependencies,
React/TypeScript frontend tools, and Tauri desktop framework integration. The
verification steps ensure all components work together correctly.
