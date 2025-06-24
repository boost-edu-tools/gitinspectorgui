# Installation

Set up the GitInspectorGUI development environment after installing prerequisites.

**Prerequisites**: Complete **[Prerequisites](01-prerequisites.md)** first - you need Python 3.13+, Node.js 22+, Rust 1.85+, and package managers installed.

**Note**: This is for setting up the development environment. For application usage, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Project Setup

### 1. Clone Repository

Clone the repository and navigate to the project directory:

On macOS/Linux:

```bash
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui
```

On Windows:

```powershell
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui
```

> **Note for Windows users**: If you encounter any Git-related issues, ensure Git is properly installed and configured as described in the [Prerequisites](01-prerequisites.md) page. You may need to use Git Bash instead of PowerShell if you prefer a Unix-like terminal experience.

### 2. Install Dependencies

Now we'll install dependencies for both the Python backend and the React/TypeScript frontend.

#### Python Backend Setup

First, create a Python virtual environment:

```bash
uv venv
```

This creates an isolated Python environment in the `.venv` directory.

Next, activate the virtual environment:

On macOS/Linux:

```bash
source .venv/bin/activate
```

On Windows:

```bash
.venv\Scripts\activate
```

> **Note for Windows users**: If you get an execution policy error in PowerShell, run:
>
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

Now install the Python dependencies:

```bash
uv sync
```

This reads `pyproject.toml` and installs all Python packages needed for the FastAPI server.

#### Frontend Setup

Install JavaScript/TypeScript dependencies:

```bash
pnpm install
```

This reads `package.json` and installs all React/TypeScript packages needed for the UI.

Install Tauri CLI globally:

```bash
pnpm add -g @tauri-apps/cli
```

This gives you the `tauri` command for building desktop applications.

> **Note**: For more detailed information about package management in this project, including advanced usage of `uv` and `pnpm`, see the [Package Management documentation](../development/package-management-overview.md).

## Verification

Let's test that everything is installed correctly by running each part of the system:

### Test Python API (Backend)

First, let's verify the Python backend works independently:

1. Start the FastAPI server:

```bash
python -m gigui.start_server
```

2. In a new terminal, test the health endpoint:

```bash
curl http://127.0.0.1:8000/health
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

This command starts the development version of the desktop application.

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
2. Choose `.venv/bin/python` (created by `uv venv`)

## Troubleshooting

### Common Issues

**Python module not found:**

Reinstall dependencies:

```bash
uv sync
```

**Rust compilation errors:**

Update your Rust toolchain:

```bash
rustup update
```

**Port 8000 in use:**

Free up the port:

On macOS/Linux:

```bash
lsof -ti:8000 | xargs kill -9
```

On Windows:

```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Node.js permissions:**

Fix permission issues on macOS/Linux:

```bash
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
