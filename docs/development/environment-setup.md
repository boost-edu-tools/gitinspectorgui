# Development Environment Setup

Complete guide for setting up a GitInspectorGUI development environment.

## Overview

GitInspectorGUI uses a modern development stack with hot reloading and debugging capabilities:

-   **Frontend**: Tauri + React + TypeScript with Vite
-   **Backend**: Python HTTP API with FastAPI
-   **Development**: Hot reloading for both frontend and backend
-   **Debugging**: Full debugging support for both components

## Prerequisites

Ensure you have the required tools installed:

-   **Python 3.12+** with pip or uv
-   **Node.js 16+** with npm
-   **Rust 1.70+** with Cargo
-   **Git 2.20+**

See the [Installation Guide](../getting-started/installation.md) for detailed installation instructions.

## Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui

# Install Python dependencies (using uv - recommended)
uv sync

# Or using pip
uv sync

# Install Node.js dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```bash
# Development settings
GIGUI_DEBUG=true
GIGUI_LOG_LEVEL=DEBUG
GIGUI_API_HOST=127.0.0.1
GIGUI_API_PORT=8080

# Optional: Custom paths
GIGUI_DATA_DIR=./data
GIGUI_LOG_DIR=./logs
```

### 3. IDE Setup (VS Code Recommended)

Install recommended extensions:

```json
{
    "recommendations": [
        "ms-python.python",
        "rust-lang.rust-analyzer",
        "tauri-apps.tauri-vscode",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next"
    ]
}
```

Configure VS Code settings (`.vscode/settings.json`):

```json
{
    "python.defaultInterpreterPath": "./.venv/bin/python",
    "python.terminal.activateEnvironment": true,
    "rust-analyzer.cargo.features": "all",
    "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Development Workflow

### HTTP API Development

The HTTP API supports hot reloading for rapid development:

```bash
# Start the development server with auto-reload
python -m gigui.start_server --reload

# Or with debug logging
python -m gigui.start_server --reload --log-level DEBUG
```

**Features:**

-   ✅ **Auto-reload**: Server restarts automatically on code changes
-   ✅ **Debug logging**: Detailed request/response logging
-   ✅ **Error handling**: Comprehensive error messages
-   ✅ **API documentation**: Auto-generated OpenAPI docs at `/docs`

### Frontend Development

The Tauri frontend supports hot reloading and debugging:

```bash
# Start development server
npm run tauri dev

# Or with specific configuration
npm run tauri dev -- --config src-tauri/tauri.conf.dev.json
```

**Features:**

-   ✅ **Hot reloading**: React components update instantly
-   ✅ **TypeScript**: Full type checking and IntelliSense
-   ✅ **DevTools**: Browser developer tools available
-   ✅ **State management**: Zustand store with persistence

### Debugging Setup

#### Python API Debugging

1. **VS Code Launch Configuration** (`.vscode/launch.json`):

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug API Server",
            "type": "python",
            "request": "launch",
            "module": "gigui.start_server",
            "args": ["--reload", "--log-level", "DEBUG"],
            "console": "integratedTerminal",
            "cwd": "${workspaceFolder}",
            "env": {
                "GIGUI_DEBUG": "true"
            }
        }
    ]
}
```

2. **Set Breakpoints**: Click in the gutter next to line numbers
3. **Start Debugging**: Press F5 or use the Debug panel

#### Frontend Debugging

1. **Browser DevTools**: Right-click in Tauri window → "Inspect Element"
2. **VS Code Debugging**: Use the browser debugging extensions
3. **Console Logging**: Use `console.log()` for quick debugging

### Testing

#### Python API Tests

```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=gigui

# Run specific test file
python -m pytest python/test_api.py

# Run with verbose output
python -m pytest -v
```

#### Frontend Tests

```bash
# Run React tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Development Tools

### API Documentation

The HTTP API provides interactive documentation:

-   **Swagger UI**: `http://127.0.0.1:8080/docs`
-   **ReDoc**: `http://127.0.0.1:8080/redoc`
-   **OpenAPI JSON**: `http://127.0.0.1:8080/openapi.json`

### Database Tools

For development database inspection:

```bash
# View current settings
python -c "from gigui.api import get_settings; print(get_settings())"

# Test repository analysis
python -m gigui.cli --help
```

### Build Tools

#### Development Builds

```bash
# Frontend only (for UI development)
npm run dev

# Backend only (for API development)
python -m gigui.start_server --reload

# Full development environment
npm run tauri dev
```

#### Production Builds

```bash
# Build Tauri application
npm run tauri build

# Build Python package
python -m build

# Build documentation
mkdocs build
```

## Performance Optimization

### Development Performance

-   **Incremental Compilation**: Rust analyzer provides fast incremental builds
-   **Hot Module Replacement**: React components update without full page reload
-   **API Caching**: Development server caches responses for faster iteration

### Memory Usage

Monitor memory usage during development:

```bash
# Python memory profiling
python -m memory_profiler python/gigui/api.py

# Node.js memory monitoring
npm run dev -- --inspect
```

## Troubleshooting

### Common Development Issues

**Port conflicts**

```bash
# Find process using port 8080
lsof -ti:8080

# Kill process
kill -9 $(lsof -ti:8080)
```

**Python import errors**

```bash
# Ensure development installation
uv sync

# Check Python path
python -c "import sys; print(sys.path)"
```

**Node.js dependency issues**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Rust compilation errors**

```bash
# Update Rust
rustup update

# Clean build cache
cargo clean
```

### Getting Help

1. Check the [Troubleshooting Guide](troubleshooting.md)
2. Review error logs in the terminal
3. Search existing issues in the repository
4. Use the debugging tools described above

## Next Steps

After setting up your development environment:

1. **[Development Mode](development-mode.md)** - Learn the development workflow
2. **[Enhanced Settings](enhanced-settings.md)** - Configure advanced options
3. **[API Reference](../api/reference.md)** - Understand the API endpoints
4. **[Architecture Overview](../architecture/overview.md)** - Learn the system design
