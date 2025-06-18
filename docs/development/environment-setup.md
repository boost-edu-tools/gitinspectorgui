# Development Environment Setup

Development environment configuration for GitInspectorGUI.

## Understanding the Development Stack

If you're unfamiliar with the technologies used, see the **[Technology Primer](../technology-primer.md)** first.

**What you're setting up**:

-   **Frontend**: Tauri (desktop framework) + React (UI library) + TypeScript (typed JavaScript) + Vite (build tool)
-   **Backend**: Python + FastAPI (modern web framework)
-   **Package Management**: uv (fast Python package manager), pnpm (fast JavaScript package manager)
-   **Build System**: Cargo (Rust compiler), Vite (frontend bundler)

## Prerequisites

-   **Python 3.13+** with uv (for the backend API server)
-   **Node.js 22+** with pnpm (for the frontend build tools)
-   **Rust 1.85+** with Cargo (required for Tauri desktop framework)
-   **Git 2.45+** (for repository analysis)

See [Installation Guide](../getting-started/installation.md) for detailed setup instructions.

## Setup

### 1. Install Dependencies

```bash
# Clone repository
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui

# Python dependencies
uv sync

# Node.js dependencies
pnpm install
```

### 2. VS Code Extensions

```json
{
    "recommendations": [
        "ms-python.python",
        "rust-lang.rust-analyzer",
        "bradlc.vscode-tailwindcss"
    ]
}
```

## Development

### API Server

```bash
# Start with auto-reload
python -m gigui.start_server --reload

# With debug logging
python -m gigui.start_server --reload --log-level DEBUG
```

**Features**: Auto-reload, debug logging, OpenAPI docs at `/docs`

### Frontend

```bash
# Start Tauri development
pnpm run tauri dev

# With custom config
pnpm run tauri dev -- --config src-tauri/tauri.conf.dev.json
```

**Features**: Hot reloading, TypeScript checking, DevTools, Zustand state

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

-   **Swagger UI**: `http://127.0.0.1:8080/docs`
-   **ReDoc**: `http://127.0.0.1:8080/redoc`

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
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9
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
