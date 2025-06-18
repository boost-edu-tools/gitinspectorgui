# Testing Your Development Setup

Test your GitInspectorGUI development environment with a first analysis run.

**Note**: This is for testing your development setup. For application usage and features, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Prerequisites

-   Development environment installed ([Installation Guide](installation.md))
-   HTTP server and Tauri app running ([Quick Start](quick-start.md))
-   A git repository to test with (any local git repository will work)

## Development Environment Test

### 1. Start the Development Environment

You need both the Python backend and the desktop frontend running:

```bash
# Terminal 1: Start the Python API server (backend)
python -m gigui.start_server

# Terminal 2: Start the desktop application (frontend)
pnpm run tauri dev
```

**What happens**:

-   The Python server starts and listens for analysis requests
-   The desktop app provides the user interface
-   They communicate via HTTP (the desktop app sends requests to the Python server)

### 2. Verify the Setup Works

1. **Test the API directly** (optional):

    ```bash
    curl http://127.0.0.1:8080/health
    ```

2. **Test through the GUI**:
    - Select any small git repository for testing
    - Run a quick analysis to verify everything works
    - Check that results are displayed properly

This confirms your development environment is properly configured.

## Next Steps

-   **[Python-Focused Development](../development/python-focused-development.md)** - Backend development workflow
-   **[Development Mode](../development/development-mode.md)** - Development workflow details
