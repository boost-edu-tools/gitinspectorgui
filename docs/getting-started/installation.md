# Development Environment Installation

## Understanding the Development Setup

The GitInspectorGUI development environment uses multiple technologies. If you're unfamiliar with any of these, see the **[Technology Primer](../technology-primer.md)** first.

**Note**: This is for setting up the development environment. For application usage, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

**Development environment components**:

-   **Python environment** - For backend development
-   **Node.js environment** - For frontend development tools
-   **Rust toolchain** - For the Tauri desktop framework
-   **Package managers** - Modern tools for faster dependency management

## System Requirements

### Minimum Requirements

-   **OS**: Windows 11+, macOS 15+, Ubuntu 24.04+ LTS
-   **Python**: 3.13+ (for the backend API server)
-   **Node.js**: 22.0+ (for the frontend build tools)
-   **Rust**: 1.85+ (for the Tauri desktop framework)
-   **Git**: 2.45+ (for repository analysis)
-   **Memory**: 4GB RAM (8GB recommended for large repositories)
-   **Storage**: 2GB free space (includes all dependencies)

## Installation by Platform

Choose your platform for step-by-step installation:

### Windows

```powershell
# Install Git and Node.js version manager
winget install Git.Git Schniz.fnm

# Install uv (fast Python package manager)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Install Rust toolchain (required for Tauri)
# Visit https://rustup.rs/ and download the installer
# Or use: winget install Rustlang.Rustup

# Restart terminal to refresh PATH, then install pnpm (JavaScript package manager)
npm install -g pnpm
```

**What each tool does**:

-   **Git**: Version control (you probably already have this)
-   **fnm**: Node.js version manager (easier than managing Node.js versions manually)
-   **uv**: Fast Python package manager (replaces pip with better performance)
-   **Rust**: Required for Tauri desktop framework
-   **pnpm**: JavaScript package manager (faster than npm)

### macOS

```bash
# Install Xcode command line tools (required for compiling)
xcode-select --install

# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Rust toolchain (required for Tauri)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal to refresh PATH, then install pnpm
npm install -g pnpm
```

**What each tool does**:

-   **Xcode tools**: Compilers and build tools needed for native development
-   **uv**: Fast Python package manager
-   **Rust**: Required for Tauri desktop framework
-   **pnpm**: JavaScript package manager

### Linux

```bash
# Install Git (if not already installed)
sudo apt install git     # Debian/Ubuntu
sudo dnf install git     # Fedora
sudo pacman -S git       # Arch

# Install build tools (required for compiling)
sudo apt install build-essential libssl-dev pkg-config  # Ubuntu/Debian
sudo dnf install gcc openssl-devel pkgconfig           # Fedora
sudo pacman -S base-devel openssl pkgconf              # Arch

# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Rust toolchain (required for Tauri)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal to refresh PATH, then install pnpm
npm install -g pnpm
```

**What each tool does**:

-   **Build tools**: Compilers needed for native development
-   **uv**: Fast Python package manager
-   **Rust**: Required for Tauri desktop framework
-   **pnpm**: JavaScript package manager

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

## Development Environment

### VS Code Extensions

-   **Python** - Python language support
-   **Rust Analyzer** - Rust language support
-   **Tauri** - Tauri development tools
-   **ES7+ React/Redux/React-Native snippets** - React development

### Server Configuration

The server uses command-line arguments for configuration:

```bash
# Start server with custom host and port
python -m gigui.start_server --host 127.0.0.1 --port 8080

# Start with debug logging
python -m gigui.start_server --log-level DEBUG
```

## Production Build

### Build Application

```bash
pnpm run tauri build
```

### Distribution Files

-   **Windows**: `src-tauri/target/release/bundle/msi/`
-   **macOS**: `src-tauri/target/release/bundle/dmg/`
-   **Linux**: `src-tauri/target/release/bundle/deb/`

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

1. Check [Troubleshooting Guide](../development/troubleshooting.md)
2. Review [Development Mode](../development/development-mode.md)
3. Search project repository issues
4. Create new issue with error details

## Package Manager Benefits

### uv (Python)

-   Fast Python package management
-   Self-updating capability
-   Better dependency resolution

### pnpm (Node.js)

-   Efficient disk usage with hard links
-   Faster than npm
-   Better dependency management

### fnm (Node.js versions)

-   Fast Node.js version switching
-   Cross-platform support
-   Lightweight alternative to nvm

### rustup (Rust)

-   Official Rust toolchain manager
-   Component and version management
-   Required for Tauri development

## Next Steps

After successful installation:

1. **[Quick Start](quick-start.md)** - Get application running
2. **[First Analysis](first-analysis.md)** - Run repository analysis
3. **[Development Mode](../development/development-mode.md)** - Development setup

## Summary

GitInspectorGUI requires Python, Node.js, and Rust toolchains with modern package managers for optimal development experience. The installation process sets up all necessary dependencies for both development and production builds.
