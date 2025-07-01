# Development Workflow

High-level development workflows and processes for GitInspectorGUI, focusing on team collaboration and development patterns.

!!! tip "Detailed Guides"

    For specific development tasks, see:

    -   **[Commands Reference](development-commands.md)** - All development commands
    -   **[Architecture Overview](../architecture/overview.md)** - System architecture details

## Overview

GitInspectorGUI uses a **single-process PyO3 architecture** that embeds Python directly within the Tauri desktop application for optimal performance and simplicity.

**Key Benefits**:

-   **Simplified Development**: Single command starts complete environment
-   **Fast Iteration**: Frontend hot reloading with embedded Python
-   **Direct Integration**: PyO3 helper functions provide simplified Python-Rust function calls
-   **Single Process**: No network overhead or server management

For detailed commands, see **[Development Commands](development-commands.md)**.

## Development Approaches

### 1. Complete Application Development (Recommended)

**Best for**: UI features, integration testing, complete feature development

**Workflow**:

1. Start development environment: `pnpm run tauri dev`
2. Make changes to any layer (Python, Rust, or frontend)
3. See immediate feedback for frontend changes
4. Restart application for Python/Rust changes

**Benefits**:

-   Tests complete integration
-   Verifies PyO3 bindings work correctly
-   Ensures UI properly displays Python analysis results

### 2. Python-Focused Development

**Best for**: Analysis algorithms, data processing, Python-focused work

**Workflow**:

1. Develop Python functions independently
2. Test Python logic with unit tests: `cd python && python -m pytest`
3. Verify PyO3 compatibility: `python -c "from gigui.analysis import execute_analysis; print('OK')"`
4. Test through desktop application: `pnpm run tauri dev`

**Benefits**:

-   Faster iteration on Python logic
-   Independent testing of analysis algorithms
-   Clear separation of concerns

### 3. Frontend-Only Development

**Best for**: UI/UX work, component development, styling

**Workflow**:

1. Use mock data or demo mode
2. Start frontend only: `pnpm run dev`
3. Focus on user interface development
4. Integrate with embedded Python when ready

**Benefits**:

-   Faster frontend iteration
-   UI development without Python dependencies
-   Component isolation testing

## Hot Reloading and Development Feedback

### Python Changes

-   **Manual restart required** - Python is embedded via PyO3, so app must be restarted
-   **Fast restart** - Single process restart is quick (typically 2-3 seconds)
-   **No connection loss** - No separate server to reconnect to
-   **PyO3 helper recompilation** - Rust automatically recompiles PyO3 helper functions

**Workflow for Python changes**:

```bash
# 1. Make Python changes
# 2. Stop desktop app (Ctrl+C)
# 3. Restart: pnpm run tauri dev
# 4. Test changes immediately
```

### Frontend Changes

-   **Hot Module Replacement** - Components update without page refresh
-   **State preservation** - React state maintained when possible
-   **Automatic refresh** - Full reload if HMR fails
-   **Instant feedback** - Changes appear within milliseconds

**Workflow for frontend changes**:

```bash
# 1. Make React/TypeScript changes
# 2. Save file
# 3. Changes appear automatically in desktop app
# 4. No restart needed
```

### Rust Changes

-   **Auto-recompile** - Cargo rebuilds on file changes
-   **Full restart** - Tauri app restarts completely
-   **PyO3 helper integration** - Python helper functions are recompiled automatically
-   **Type safety** - Compilation errors prevent runtime issues

**Workflow for Rust changes**:

```bash
# 1. Make Rust changes (src-tauri/src/)
# 2. Cargo automatically recompiles
# 3. Desktop app restarts with new code
# 4. Test PyO3 helper integration
```


**Workflow**:

```bash
# 1. Test components in isolation
pnpm test

# 2. Test with mock data
pnpm dev  # Use demo mode

# 3. Test with real Python integration
pnpm run tauri dev

# 4. End-to-end testing through GUI
```

## Configuration and Environment

### VS Code Setup

```json
// .vscode/launch.json
{
    "configurations": [
        {
            "name": "Debug Tauri with PyO3",
            "type": "lldb",
            "request": "launch",
            "program": "${workspaceFolder}/src-tauri/target/debug/gitinspectorgui",
            "args": [],
            "cwd": "${workspaceFolder}",
            "env": {
                "RUST_LOG": "debug",
                "RUST_BACKTRACE": "1"
            }
        },
        {
            "name": "Debug Python Tests",
            "type": "python",
            "request": "launch",
            "module": "pytest",
            "args": ["tests/", "-v"],
            "cwd": "${workspaceFolder}/python"
        }
    ]
}
```

### Environment Variables

```bash
# Enable Rust logging (see Rust Logging in Environment Setup for details)
export RUST_LOG=debug              # General debug logging
export RUST_LOG=gitinspectorgui=debug  # Application-specific logging
export RUST_LOG=pyo3=debug         # PyO3 integration debugging

# Standard Rust debugging
export RUST_BACKTRACE=1            # Show panic backtraces

# Start development with debug logging
pnpm run tauri dev
```

**Note**: PYTHONPATH is automatically configured by the build system and doesn't need manual setting.


## Troubleshooting

For detailed troubleshooting commands, see [Troubleshooting Commands](development-commands.md#troubleshooting-commands) and [Troubleshooting Guide](troubleshooting.md).

### Common Issues

**Desktop app won't start**:

```bash
# Clear caches and rebuild
pnpm clean
rm -rf src-tauri/target
pnpm install
pnpm run tauri dev
```

**Python changes not reflected**:

```bash
# Python is embedded, restart required
# Stop app (Ctrl+C) and restart
pnpm run tauri dev
```

**PyO3 helper compilation errors**:

```bash
# Check Python environment
python -c "import sysconfig; print(sysconfig.get_path('include'))"

# Rebuild PyO3 helper functions
cd src-tauri && cargo clean && cargo build
```

**Frontend hot reload not working**:

```bash
# Clear frontend cache
rm -rf node_modules/.vite
pnpm dev  # Test frontend only
```

### Debugging Process

1. **Isolate the problem**:

    - Python function issue?
    - PyO3 helper integration issue?
    - Frontend display issue?

2. **Test each layer independently**:

    ```bash
    cd python && python -m pytest  # Python layer
    cd src-tauri && cargo test      # PyO3 helper layer
    pnpm test                       # Frontend layer
    ```

3. **Test integration**:

    ```bash
    pnpm run tauri dev  # Complete system
    ```

4. **Use appropriate debugging tools**:
    - Python: print statements, pytest
    - Rust: RUST_LOG=debug, cargo test
    - Frontend: console.log, React DevTools

## Related Documentation

-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Development Commands](development-commands.md)** - All development commands
-   **[Package Management](package-management-overview.md)** - Dependencies and tools
-   **[PyO3 Helper Integration](../architecture/pyo3-integration.md)** - PyO3 helper function architecture details
-   **[Technology Primer](../technology-primer.md)** - Understanding the full stack
