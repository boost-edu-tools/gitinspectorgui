# Installation Guide

## System Requirements

### Minimum Requirements

-   **OS**: Windows 11+, macOS 15+, Ubuntu 24.04+ LTS
-   **Python**: 3.13+
-   **Node.js**: 22.0+
-   **Rust**: 1.85+
-   **Git**: 2.45+
-   **Memory**: 4GB RAM (8GB recommended)
-   **Storage**: 2GB free space

## Quick Installation

### Windows

```powershell
# Install Git and Node.js manager
winget install Git.Git Schniz.fnm

# Install Python package manager
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Install Rust (download from https://rustup.rs/)
# Restart terminal, then:
npm install -g pnpm
```

### macOS

```bash
# Install development tools
xcode-select --install

# Install package managers
curl -LsSf https://astral.sh/uv/install.sh | sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal, then:
npm install -g pnpm
```

### Linux

```bash
# Install Git
sudo apt install git     # Debian/Ubuntu
sudo dnf install git     # Fedora

# Install package managers
curl -LsSf https://astral.sh/uv/install.sh | sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal, then:
npm install -g pnpm
```

## Project Setup

### 1. Clone Repository

```bash
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui
```

### 2. Install Dependencies

```bash
# Python dependencies
uv sync

# Node.js dependencies
pnpm install

# Tauri CLI
pnpm add -g @tauri-apps/cli
```

## Verification

### Test Python API

```bash
# Start server
python -m gigui.start_server

# Test health endpoint (new terminal)
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

Application window should open and connect automatically.

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
