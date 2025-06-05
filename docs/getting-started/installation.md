# Installation Guide

Complete installation instructions for GitInspectorGUI development and production environments.

## System Requirements

### Minimum Requirements

-   **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
-   **Python**: 3.8 or higher
-   **Node.js**: 16.0 or higher
-   **Rust**: 1.70 or higher
-   **Git**: 2.20 or higher
-   **Memory**: 4GB RAM minimum, 8GB recommended
-   **Storage**: 2GB free space

### Recommended Development Environment

-   **IDE**: VS Code with Python and Rust extensions
-   **Terminal**: Modern terminal with Unicode support
-   **Git Client**: Command line git or GUI client

## Installation Steps

### 1. Install System Dependencies

=== "macOS"

    ```bash
    # Install Homebrew (if not already installed)
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Install dependencies
    brew install python node rust git

    # Verify installations
    python3 --version
    node --version
    rustc --version
    git --version
    ```

=== "Windows"

    1. **Python**: Download from [python.org](https://python.org) and install
    2. **Node.js**: Download from [nodejs.org](https://nodejs.org) and install
    3. **Rust**: Download from [rustup.rs](https://rustup.rs) and install
    4. **Git**: Download from [git-scm.com](https://git-scm.com) and install

    Verify in PowerShell:
    ```powershell
    python --version
    node --version
    rustc --version
    git --version
    ```

=== "Linux (Ubuntu/Debian)"

    ```bash
    # Update package list
    sudo apt update

    # Install dependencies
    sudo apt install python3 python3-pip nodejs npm git curl

    # Install Rust
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source ~/.cargo/env

    # Verify installations
    python3 --version
    node --version
    rustc --version
    git --version
    ```

### 2. Clone the Repository

```bash
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui
```

### 3. Install Python Dependencies

```bash
# Using uv (recommended)
uv sync

# Or using pip
pip install -e .
```

### 4. Install Node.js Dependencies

```bash
npm install
```

### 5. Install Tauri CLI

```bash
npm install -g @tauri-apps/cli
```

## Verification

### Test Python API

```bash
# Start the HTTP server
python -m gigui.start_server

# In another terminal, test the health endpoint
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
# Start development server
npm run tauri dev
```

The Tauri application window should open and connect to the HTTP server automatically.

## Development Environment Setup

### VS Code Extensions (Recommended)

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

## Production Installation

### Build for Production

```bash
# Build the Tauri application
npm run tauri build
```

### Distribution

The built application will be available in:

-   **Windows**: `src-tauri/target/release/bundle/msi/`
-   **macOS**: `src-tauri/target/release/bundle/dmg/`
-   **Linux**: `src-tauri/target/release/bundle/deb/` or `src-tauri/target/release/bundle/appimage/`

## Troubleshooting

### Common Issues

**Python module not found**

```bash
# Ensure you're in the project directory and dependencies are installed
pip install -e .
```

**Rust compilation errors**

```bash
# Update Rust to latest version
rustup update
```

**Node.js permission errors**

```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
```

**Port 8080 already in use**

```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
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
