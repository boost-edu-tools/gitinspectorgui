# Prerequisites

System requirements and tool installation for GitInspectorGUI development.

## Understanding the Technology Stack

GitInspectorGUI uses multiple technologies working together. If you're unfamiliar with any of these, see the **[Technology Primer](../technology-primer.md)** first.

**What you'll be installing**:

- **Python 3.8+** - Analysis engine (embedded via PyO3)
- **Node.js 22+** - Frontend build tools (React + TypeScript + Vite)
- **Rust 1.63+** - Desktop framework (Tauri + PyO3)
- **Git 2.45+** - Repository analysis (you probably already have this)
- **Modern package managers** - uv (Python), pnpm (Node.js) for faster development

## System Requirements

### Minimum Requirements

- **OS**: Windows 11+, macOS 15+, Ubuntu 24.04+ LTS
- **Python**: 3.8+ (for the embedded analysis engine)
- **Node.js**: 22.0+ (for the frontend build tools)
- **Rust**: 1.63+ (for the Tauri desktop framework with PyO3)
- **Git**: 2.45+ (for repository analysis)

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

### macOS

```bash
# Install Git as part of the Xcode command line tools
xcode-select --install

# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Rust toolchain (required for Tauri)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal to refresh PATH, then install pnpm
npm install -g pnpm
```

**Alternative: Homebrew Installation**

Instead of the manual installation steps above, users with Homebrew can choose to install all required tools with a single command:

```bash
brew install git uv rust pnpm
```

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

## What Each Tool Does

- **Git**: Version control (you probably already have this)
- **Python + uv**: Analysis engine embedded via PyO3 with fast package management
- **Node.js + pnpm**: Frontend build tools with efficient package management
- **Rust**: Required for Tauri desktop framework and PyO3 integration
- **Build tools**: Compilers needed for native development and PyO3 compilation

## Next Steps

Once all prerequisites are installed:

1. **[Installation](02-installation.md)** - Set up the GitInspectorGUI project
2. **[Quick Start](03-quick-start.md)** - Get the development environment running

## Troubleshooting

### Common Issues

**Command not found after installation:**

```bash
# Restart your terminal or reload shell configuration
source ~/.bashrc  # Linux
source ~/.zshrc   # macOS
```

**Permission issues (macOS/Linux):**

```bash
# Fix pnpm permissions
sudo chown -R $(whoami) ~/.local/share/pnpm
```

**Windows execution policy:**

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

For more detailed troubleshooting, see the **[Troubleshooting
Guide](../development/troubleshooting.md)**.
