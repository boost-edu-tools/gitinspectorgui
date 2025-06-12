# Quick Start

Setup and run GitInspectorGUI in 3 steps.

## Prerequisites

-   **Python 3.13+** with uv
-   **Node.js 22+** with pnpm
-   **Rust 1.85+** with Cargo
-   **Git 2.45+**

## Setup

### 1. Start HTTP API Server

```bash
python -m gigui.start_server
# Server: http://127.0.0.1:8080
# Health: curl http://127.0.0.1:8080/health
```

### 2. Start Tauri Application

```bash
pnpm install
pnpm run tauri dev
```

### 3. Verify Integration

-   Tauri app connects to HTTP server automatically
-   Test with sample repository analysis

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
