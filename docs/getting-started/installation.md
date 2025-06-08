# Installation Guide

Complete installation instructions for GitInspectorGUI development and production environments.

## System Requirements

### Minimum Requirements

-   **Operating System**: Windows 11+, macOS 15+, or Linux (Ubuntu 24.04+ LTS)
-   **Python**: 3.13 or higher
-   **Node.js**: 22.0 or higher
-   **Rust**: 1.85 or higher
-   **Git**: 2.45 or higher
-   **Memory**: 4GB RAM minimum, 8GB recommended
-   **Storage**: 2GB free space

### Recommended Development Environment

-   **IDE**: VS Code with Python and Rust extensions
-   **Terminal**: Modern terminal with Unicode support
-   **Git Client**: Command line git or GUI client

## Quick Installation by Platform

### Windows

1. **Install Git and Node.js version manager:**

    ```powershell
    winget install Git.Git Schniz.fnm
    ```

    - `Git.Git` - Git version control system
    - `Schniz.fnm` - Fast Node Manager (for managing Node.js versions)

2. **Install Python package manager:**

    ```powershell
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

    - `uv` - Fast Python package manager and project manager

3. **Install Rust toolchain:**

    - Download and run `rustup-init.exe` from [https://rustup.rs/](https://rustup.rs/)
    - `rustup` - Rust toolchain installer and version manager

4. **Restart terminal, then install Node.js package manager:**
    ```powershell
    npm install -g pnpm
    ```
    - `pnpm` - Fast, disk space efficient Node.js package manager

### macOS

1. **Install Git via Xcode command line tools:**

    ```bash
    xcode-select --install
    ```

    - Provides Git and essential development tools

2. **Install package managers:**

    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    curl -fsSL https://fnm.vercel.app/install | bash
    ```

    - `uv` - Fast Python package manager and project manager
    - `rustup` - Rust toolchain installer and version manager
    - `fnm` - Fast Node Manager (for managing Node.js versions)

3. **Restart terminal, then install Node.js package manager:**
    ```bash
    npm install -g pnpm
    ```
    - `pnpm` - Fast, disk space efficient Node.js package manager

### Linux

1. **Install Git:**

    ```bash
    sudo apt install git     # Debian/Ubuntu
    sudo dnf install git     # Fedora
    ```

    - Git version control system

2. **Install package managers:**

    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    curl -fsSL https://fnm.vercel.app/install | bash
    ```

    - `uv` - Fast Python package manager and project manager
    - `rustup` - Rust toolchain installer and version manager
    - `fnm` - Fast Node Manager (for managing Node.js versions)

3. **Restart terminal, then install Node.js package manager:**
    ```bash
    npm install -g pnpm
    ```
    - `pnpm` - Fast, disk space efficient Node.js package manager

## Project Setup

### Clone Repository

```bash
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui
```

### Install Dependencies

1. **Python dependencies:**

    ```bash
    uv sync
    ```

2. **Node.js dependencies:**

    ```bash
    pnpm install
    ```

3. **Tauri CLI:**
    ```bash
    pnpm add -g @tauri-apps/cli
    ```

## Verification

### Test Python API

1. **Start the HTTP server:**

    ```bash
    python -m gigui.start_server
    ```

2. **Test the health endpoint (in another terminal):**

    ```bash
    curl http://127.0.0.1:8080/health
    ```

    Expected response:

    ```json
    {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": "2025-01-01T12:00:00Z"
    }
    ```

### Test Tauri Application

```bash
pnpm run tauri dev
```

The Tauri application window should open and connect to the HTTP server automatically.

## Development Environment

### VS Code Extensions

Install these extensions for the best development experience:

-   **Python** - Python language support
-   **Rust Analyzer** - Rust language support
-   **Tauri** - Tauri development tools
-   **ES7+ React/Redux/React-Native snippets** - React development
-   **TypeScript Importer** - Auto import for TypeScript

### Environment Variables

Create a `.env` file in the project root:

```bash
# Development settings
GIGUI_DEBUG=true
GIGUI_LOG_LEVEL=DEBUG
GIGUI_API_HOST=127.0.0.1
GIGUI_API_PORT=8080
```

## Production Build

### Build Application

```bash
pnpm run tauri build
```

### Distribution Files

The built application will be available in:

-   **Windows**: `src-tauri/target/release/bundle/msi/`
-   **macOS**: `src-tauri/target/release/bundle/dmg/`
-   **Linux**: `src-tauri/target/release/bundle/deb/` or `src-tauri/target/release/bundle/appimage/`

## Troubleshooting

### Common Issues

**Python module not found:**

```bash
# Ensure you're in the project directory and dependencies are installed
uv sync
```

**Rust compilation errors:**

```bash
# Update Rust to latest version
rustup update
```

**Node.js permission errors:**

```bash
# Fix pnpm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.local/share/pnpm
```

**Port 8080 already in use:**

```bash
# Find and kill process using port 8080 (macOS/Linux)
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](../development/troubleshooting.md)
2. Review the [Development Mode](../development/development-mode.md) documentation
3. Search existing issues in the project repository
4. Create a new issue with detailed error information

## Next Steps

After successful installation:

1. **[Quick Start](quick-start.md)** - Get the application running
2. **[First Analysis](first-analysis.md)** - Run your first repository analysis
3. **[Development Mode](../development/development-mode.md)** - Set up for active development

## Detailed Installation Notes

### Package Manager Details

**uv (Python package manager):**

-   Provides fast Python package management
-   Enables `uv self update` capability when installed via official installer
-   Alternative: Use `pip install -e .` if uv is not available

**pnpm (Node.js package manager):**

-   More efficient than npm with better dependency management
-   Uses hard links to save disk space
-   Alternative: Use `npm` if pnpm is not available

**fnm (Node.js version manager):**

-   Enables easy switching between Node.js versions
-   Faster than nvm with better cross-platform support
-   Alternative: Install Node.js directly from [nodejs.org](https://nodejs.org)

**rustup (Rust toolchain manager):**

-   Official Rust toolchain manager
-   Provides excellent version control and component management
-   Required for Tauri development

### Platform-Specific Notes

**Windows:**

-   Use PowerShell or Command Prompt for installation commands
-   winget is available by default on Windows 10 1709+ and Windows 11
-   Some commands may require administrator privileges

**macOS:**

-   Xcode command line tools provide Git and other essential development tools
-   Choose between Homebrew and Xcode tools based on your existing setup
-   Terminal restart may be required after installing shell tools

**Linux:**

-   Use your distribution's package manager for system integration
-   Some distributions may require additional development packages
-   Ensure your user has proper permissions for global package installation
