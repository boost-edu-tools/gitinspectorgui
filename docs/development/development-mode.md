# Development Mode

Guide for running GitInspectorGUI in development mode with hot reloading and debugging capabilities.

## Overview

Development mode provides:

-   Hot reloading for frontend changes
-   Python backend auto-restart on code changes
-   Debug logging and error reporting
-   Development-specific configurations
-   Fast iteration cycles

## Quick Start

```bash
# Start development mode (all services)
pnpm dev

# Or start services individually
pnpm dev:frontend    # Frontend only
pnpm dev:backend     # Backend only
```

## Development Server Commands

### Frontend Development

```bash
# Start Vite dev server with hot reload
pnpm dev:frontend
# Runs on http://localhost:1420

# Build for development
pnpm build:dev

# Type checking
pnpm type-check
```

### Backend Development

```bash
# Start Python API server with auto-reload
pnpm dev:backend
# Runs on http://localhost:8000

# Start with debug logging
pnpm dev:backend:debug

# Run tests
pnpm test:backend
```

### Full Stack Development

```bash
# Start both frontend and backend
pnpm dev

# Start with Tauri desktop app
pnpm tauri dev
```

## Configuration

### Development Environment Variables

Create a `.env.development` file:

```env
# API Configuration
API_HOST=localhost
API_PORT=8000
API_DEBUG=true

# Frontend Configuration
VITE_API_URL=http://localhost:8000
VITE_DEV_MODE=true

# Logging
LOG_LEVEL=debug
```

### Tauri Development Config

The `src-tauri/tauri.conf.dev.json` file contains development-specific settings:

```json
{
    "build": {
        "devPath": "http://localhost:1420",
        "beforeDevCommand": "pnpm dev:frontend"
    },
    "app": {
        "windows": [
            {
                "title": "GitInspectorGUI (Development)",
                "width": 1200,
                "height": 800
            }
        ]
    }
}
```

## Hot Reloading

### Frontend Hot Reload

-   **Vite HMR**: Instant updates for React components, CSS, and TypeScript
-   **State Preservation**: Component state maintained across updates
-   **Error Overlay**: In-browser error reporting

### Backend Auto-Restart

-   **File Watching**: Automatic restart on Python file changes
-   **Fast Startup**: Optimized for quick development cycles
-   **Debug Mode**: Enhanced error reporting and logging

## Debugging

### Frontend Debugging

```bash
# Start with source maps
pnpm dev:frontend --sourcemap

# Debug in browser DevTools
# Open http://localhost:1420 and use F12
```

### Backend Debugging

```bash
# Start with debugger support
python -m debugpy --listen 5678 --wait-for-client -m gigui.start_server

# Or use IDE debugging with uvicorn
uvicorn gigui.api:app --reload --host 0.0.0.0 --port 8000
```

### Tauri Debugging

```bash
# Start with Rust debugging
RUST_LOG=debug pnpm tauri dev

# Debug webview content
# Right-click in app -> Inspect Element
```

## Development Workflow

### Typical Development Session

1. **Start Development Mode**:

    ```bash
    pnpm dev
    ```

2. **Make Changes**:

    - Edit React components → See instant updates
    - Modify Python API → Server auto-restarts
    - Update Rust code → Manual restart required

3. **Test Changes**:

    ```bash
    pnpm test        # Run all tests
    pnpm lint        # Check code quality
    pnpm type-check  # Verify TypeScript
    ```

4. **Build and Test**:
    ```bash
    pnpm build       # Production build
    pnpm preview     # Test production build
    ```

### Code Quality Checks

```bash
# Lint and format
pnpm lint:fix
pnpm format

# Type checking
pnpm type-check

# Run tests
pnpm test
pnpm test:watch  # Watch mode
```

## Performance Optimization

### Development Build Performance

-   **Vite**: Fast cold starts and HMR
-   **TypeScript**: Incremental compilation
-   **ESLint**: Cached linting results

### Memory Usage

```bash
# Monitor memory usage
pnpm dev:monitor

# Reduce memory usage
export NODE_OPTIONS="--max-old-space-size=4096"
```

## Troubleshooting

### Common Issues

**Port Conflicts**:

```bash
# Check what's using ports
lsof -i :1420  # Frontend
lsof -i :8000  # Backend

# Kill processes
kill -9 $(lsof -t -i:1420)
```

**Cache Issues**:

```bash
# Clear all caches
pnpm clean
rm -rf node_modules/.vite
rm -rf .next
```

**Python Environment**:

```bash
# Recreate virtual environment
rm -rf .venv
uv venv
uv pip install -e .
```

### Debug Logging

Enable debug logging for troubleshooting:

```bash
# Frontend debug
DEBUG=vite:* pnpm dev:frontend

# Backend debug
LOG_LEVEL=debug pnpm dev:backend

# Tauri debug
RUST_LOG=debug pnpm tauri dev
```

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Core development patterns
-   **[Environment Setup](environment-setup.md)** - Initial setup
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
-   **[Package Management](package-management.md)** - Dependencies and tools
