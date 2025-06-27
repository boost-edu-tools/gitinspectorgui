# Installation

Set up the GitInspectorGUI development environment after installing prerequisites.

**Prerequisites**: Complete **[Prerequisites](01-prerequisites.md)** first - you need Python 3.8+, Node.js 22+, Rust 1.63+, and package managers installed.

**Note**: This is for setting up the development environment. For application usage, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Project Setup

### 1. Clone Repository

Clone the repository and navigate to the project directory:

```bash
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui
```

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

```powershell
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

This reads `pyproject.toml` and installs all Python packages needed for the analysis engine that will be embedded via PyO3.

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

Let's test that everything is installed correctly by running the complete system:

### Test PyO3 Integration (Complete System)

Test the complete desktop application with embedded Python:

```bash
pnpm run tauri dev
```

This command starts the development version of the desktop application with embedded Python analysis engine.

**What should happen**:

-   Vite builds the React/TypeScript frontend
-   Tauri compiles the Rust wrapper with PyO3 integration
-   A desktop window opens showing the GitInspectorGUI interface
-   Python analysis engine is embedded and ready for use

**What this tests**:

-   Python environment is working
-   PyO3 Python integration is working
-   React frontend communicates with Rust backend
-   Python analysis engine is accessible via PyO3 bindings
-   All dependencies are installed correctly
-   Node.js and pnpm are working
-   React/TypeScript compilation works
-   Rust and Tauri are working

**Expected behavior**: The GitInspectorGUI desktop application opens with a functional interface ready for repository analysis.

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

**Tauri development issues:**

If the desktop application fails to start, try:

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm run tauri dev
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

GitInspectorGUI installation sets up Python analysis engine dependencies,
React/TypeScript frontend tools, and Tauri desktop framework with PyO3 integration. The
verification steps ensure all components work together correctly in a single process.
