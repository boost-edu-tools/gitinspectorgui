# Development Workflow

High-level development workflows and processes for GitInspectorGUI, focusing on team collaboration and development patterns.

!!! tip "Detailed Guides"

    For specific development tasks, see:

    -   **[Commands Reference](development-commands.md)** - All development commands
    -   **[Development Architecture](development-architecture.md)** - System architecture

## Overview

GitInspectorGUI uses a **single-process PyO3 architecture** that embeds Python directly within the Tauri desktop application for optimal performance and simplicity.

**Key Benefits**:

-   **Simplified Development**: Single command starts complete environment
-   **Fast Iteration**: Frontend hot reloading with embedded Python
-   **Direct Integration**: PyO3 provides direct Python-Rust function calls
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
-   **PyO3 recompilation** - Rust automatically recompiles PyO3 bindings

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
-   **PyO3 integration** - Python bindings are recompiled automatically
-   **Type safety** - Compilation errors prevent runtime issues

**Workflow for Rust changes**:

```bash
# 1. Make Rust changes (src-tauri/src/)
# 2. Cargo automatically recompiles
# 3. Desktop app restarts with new code
# 4. Test PyO3 integration
```

## Testing and Debugging Workflows

### Python Unit Testing

**Workflow**:

```bash
# 1. Develop Python function
cd python
python -c "from gigui.analysis import new_function; print(new_function())"

# 2. Write unit tests
# tests/test_new_function.py

# 3. Run tests
python -m pytest tests/test_new_function.py -v

# 4. Test PyO3 compatibility
python -c "from gigui.analysis import new_function; print('PyO3 ready')"
```

### PyO3 Integration Testing

**Workflow**:

```bash
# 1. Test PyO3 bindings
cd src-tauri && cargo test

# 2. Test Python integration
cargo test --features python-tests

# 3. Test through desktop app
pnpm run tauri dev

# 4. Verify function calls work correctly
```

### Frontend Component Testing

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

### Integration Testing

**Complete system testing workflow**:

```bash
# 1. Start complete development environment
pnpm run tauri dev

# 2. Test with sample repository
# - Select repository through GUI
# - Run analysis
# - Verify results display correctly

# 3. Test error handling
# - Try invalid repository path
# - Verify error messages display properly

# 4. Test performance
# - Use larger repository
# - Monitor memory usage
# - Check analysis speed
```

## Debugging Workflows

### PyO3 Debugging

**When Python functions aren't working in the desktop app**:

```bash
# 1. Test Python function independently
cd python
python -c "from gigui.analysis import problematic_function; print(problematic_function())"

# 2. Check PyO3 bindings
cd src-tauri
cargo test --verbose

# 3. Enable PyO3 debug logging
RUST_LOG=pyo3=debug pnpm run tauri dev

# 4. Check for type conversion issues
# Look for PyO3 error messages in terminal output
```

### Frontend Debugging

**When UI isn't displaying data correctly**:

```bash
# 1. Start desktop app
pnpm run tauri dev

# 2. Open developer tools
# Right-click in app → "Inspect Element"

# 3. Check console for errors
# Look for JavaScript errors or failed function calls

# 4. Verify data flow
# Add console.log() statements to track data
```

### Performance Debugging

**When analysis is slow or uses too much memory**:

```bash
# 1. Enable performance monitoring
RUST_LOG=debug pnpm run tauri dev

# 2. Monitor system resources
top -p $(pgrep gitinspectorgui)

# 3. Profile Python code
# Add timing statements to Python functions

# 4. Check PyO3 overhead
# Compare direct Python execution vs PyO3 calls
```

## Development Patterns

### Adding New Analysis Features

**Recommended workflow**:

1. **Design Python function**:

    ```python
    # python/gigui/analysis/new_feature.py
    def analyze_new_feature(repo_path: str, settings: dict) -> dict:
        # Implementation
        return {"results": "data"}
    ```

2. **Write unit tests**:

    ```python
    # python/tests/test_new_feature.py
    def test_analyze_new_feature():
        result = analyze_new_feature("/test/repo", {})
        assert "results" in result
    ```

3. **Test independently**:

    ```bash
    cd python && python -m pytest tests/test_new_feature.py
    ```

4. **Add PyO3 binding** (if needed):

    ```rust
    // src-tauri/src/commands.rs
    #[tauri::command]
    pub async fn analyze_new_feature_command(settings: Settings) -> Result<AnalysisResult, String> {
        // PyO3 integration
    }
    ```

5. **Test through desktop app**:

    ```bash
    pnpm run tauri dev
    ```

6. **Add frontend integration**:
    ```typescript
    // src/lib/api.ts - if needed
    // src/components/ - UI updates
    ```

### Modifying Existing Features

**Recommended workflow**:

1. **Identify impact scope**:

    - Python function changes
    - PyO3 binding changes
    - Frontend display changes

2. **Test current functionality**:

    ```bash
    pnpm run tauri dev
    # Verify current behavior
    ```

3. **Make Python changes**:

    ```bash
    cd python
    # Edit functions
    python -m pytest  # Verify tests still pass
    ```

4. **Test PyO3 integration**:

    ```bash
    pnpm run tauri dev
    # Verify changes work in desktop app
    ```

5. **Update frontend if needed**:
    ```bash
    # Make UI changes
    # Test with pnpm run tauri dev
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
# Development environment
export RUST_LOG=debug
export RUST_BACKTRACE=1
export PYTHONPATH="${PWD}/python"

# PyO3 specific debugging
export RUST_LOG=pyo3=debug

# Start development with debug info
pnpm run tauri dev
```

## Team Collaboration

### Code Review Workflow

1. **Test Python changes independently**:

    ```bash
    cd python && python -m pytest
    ```

2. **Verify PyO3 integration**:

    ```bash
    cd src-tauri && cargo test
    ```

3. **Test complete application**:

    ```bash
    pnpm run tauri dev
    ```

4. **Check code quality**:
    ```bash
    pnpm lint:fix && pnpm type-check
    ```

### Branch Strategy

**Feature development**:

-   Create feature branch
-   Develop Python functionality first
-   Add PyO3 integration
-   Update frontend if needed
-   Test complete integration

**Bug fixes**:

-   Identify layer (Python, PyO3, Frontend)
-   Fix in appropriate layer
-   Test integration
-   Verify fix doesn't break other features

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

**PyO3 compilation errors**:

```bash
# Check Python environment
python -c "import sysconfig; print(sysconfig.get_path('include'))"

# Rebuild PyO3 bindings
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
    - PyO3 integration issue?
    - Frontend display issue?

2. **Test each layer independently**:

    ```bash
    cd python && python -m pytest  # Python layer
    cd src-tauri && cargo test      # PyO3 layer
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
-   **[PyO3 Integration](../architecture/design-decisions.md)** - PyO3 architecture details
-   **[Technology Primer](../technology-primer.md)** - Understanding the full stack
