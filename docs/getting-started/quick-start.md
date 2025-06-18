# Quick Start

Setup and run the GitInspectorGUI development environment in 3 steps.

**Note**: This is for setting up the development environment. For application usage, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Prerequisites

If you're unfamiliar with these tools, see the **[Technology Primer](../technology-primer.md)** first.

-   **Python 3.13+** with uv (Python package manager)
-   **Node.js 22+** with pnpm (JavaScript package manager)
-   **Rust 1.85+** with Cargo (required for Tauri desktop framework)
-   **Git 2.45+** (for repository analysis)

## Setup

### 1. Start HTTP API Server (Python Backend)

This starts the FastAPI server that handles git analysis:

```bash
python -m gigui.start_server
# Server runs at: http://127.0.0.1:8080
# Test it works: curl http://127.0.0.1:8080/health
```

**What this does**: Starts a Python HTTP server that can analyze git repositories and return JSON results.

### 2. Start Tauri Application (Desktop Frontend)

This installs frontend dependencies and starts the desktop application:

```bash
pnpm install    # Install React/TypeScript dependencies
pnpm run tauri dev    # Start desktop app with hot reloading
```

**What this does**:

-   `pnpm install` downloads all the React/TypeScript packages needed for the UI
-   `pnpm run tauri dev` starts the desktop application in development mode with automatic updates when you change code

### 3. Verify Integration

-   The Tauri desktop app automatically connects to the Python HTTP server
-   Test with sample repository analysis to ensure everything works
-   Both servers should be running simultaneously

## Production Build

```bash
uv sync
pnpm run tauri build
```

## Troubleshooting

**Server issues:**

```bash
python --version  # Check Python 3.13+
uv pip list | grep gigui  # Verify dependencies
```

**Frontend issues:**

```bash
pnpm store prune  # Clear cache
rm -rf node_modules && pnpm install  # Reinstall
```

**Port conflicts:**

-   Ensure port 8080 is available
-   Check firewall settings

## Next Steps

-   **[Installation](installation.md)** - Detailed setup
-   **[First Analysis](first-analysis.md)** - Repository analysis
-   **[Development Mode](../development/development-mode.md)** - Development setup
