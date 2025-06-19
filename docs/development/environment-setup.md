# Development Environment Setup

Development environment configuration for GitInspectorGUI.

**Prerequisites**: Complete the **[Getting Started Guide](../getting-started/01-prerequisites.md)** first for system requirements and project installation.

## Understanding the Development Stack

If you're unfamiliar with the technologies used, see the **[Technology Primer](../technology-primer.md)** first.

**Development environment components**:

-   **Frontend**: Tauri (desktop framework) + React (UI library) + TypeScript (typed JavaScript) + Vite (build tool)
-   **Backend**: Python + FastAPI (modern web framework)
-   **Package Management**: uv (fast Python package manager), pnpm (fast JavaScript package manager)
-   **Build System**: Cargo (Rust compiler), Vite (frontend bundler)

## Development Configuration

### VS Code Extensions

```json
{
    "recommendations": [
        "ms-python.python",
        "rust-lang.rust-analyzer",
        "tauri-apps.tauri-vscode",
        "bradlc.vscode-tailwindcss"
    ]
}
```

### Python Environment Configuration

If using VS Code:

1. `Ctrl+Shift+P` → "Python: Select Interpreter"
2. Choose `.venv/bin/python` (created by `uv sync`)

## Development Server Configuration

For development server commands and workflows, see **[Development Workflow](development-workflow.md)**.

### API Server Configuration

```bash
# Custom host and port
python -m gigui.start_server --host 127.0.0.1 --port 8000

# Debug logging
python -m gigui.start_server --log-level DEBUG

# Development mode with auto-reload
python -m gigui.start_server --reload --log-level DEBUG
```

### Frontend Configuration

```bash
# Development with hot reload
pnpm run tauri dev

# With custom Tauri config
pnpm run tauri dev -- --config src-tauri/tauri.conf.dev.json

# Frontend only (without desktop wrapper)
pnpm run dev
```

## Debugging

### Python API

```json
{
    "name": "Debug API Server",
    "type": "python",
    "request": "launch",
    "module": "gigui.start_server",
    "args": ["--reload", "--log-level", "DEBUG"]
}
```

### Frontend

-   **DevTools**: Right-click → "Inspect Element"
-   **Console**: Use `console.log()` for debugging
-   **Breakpoints**: Set in VS Code or browser

## Testing

### Python

```bash
# All tests
python -m pytest

# With coverage
python -m pytest --cov=gigui

# Specific file
python -m pytest python/test_api.py
```

### Frontend

```bash
# React tests
pnpm test

# With coverage
pnpm run test:coverage
```

## Tools

### API Documentation

-   **Swagger UI**: `http://127.0.0.1:8000/docs`
-   **ReDoc**: `http://127.0.0.1:8000/redoc`

### Build Commands

```bash
# Development
pnpm run tauri dev

# Production
pnpm run tauri build
python -m build
mkdocs build
```

## Troubleshooting

### Port Conflicts

```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Python Issues

```bash
# Reinstall dependencies
uv sync

# Check Python path
python -c "import sys; print(sys.path)"
```

### Node.js Issues

```bash
# Clear and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Rust Issues

```bash
# Update and clean
rustup update
cargo clean
```

## Related

-   **[Development Workflow](development-workflow.md)** - Development workflow
-   **[Package Management](package-management.md)** - Dependencies and tools
-   **[Troubleshooting](troubleshooting.md)** - Common issues
-   **[API Reference](../api/reference.md)** - API documentation
