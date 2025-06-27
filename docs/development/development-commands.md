# Development Commands Reference

Comprehensive reference for all GitInspectorGUI development commands, organized by service and use case.

!!! tip "Architecture Context"

    For understanding the multi-server development setup, see **[Development Architecture](development-architecture.md)**.

## Quick Reference

### Most Common Commands

| Task                  | Command                                   | Notes                       |
| --------------------- | ----------------------------------------- | --------------------------- |
| **Start Development** | `pnpm run tauri dev`                      | Starts complete application |
| **Frontend Only**     | `pnpm dev:frontend`                       | UI development              |
| **Desktop App**       | `pnpm run tauri dev`                      | Full integration testing    |
| **Clean Build**       | `pnpm clean && rm -rf .venv node_modules` | Reset environment           |
| **Production Build**  | `pnpm tauri build`                        | Create release build        |

### Port Reference

| Port     | Service          | Purpose             |
| -------- | ---------------- | ------------------- |
| **5173** | Vite Dev Server  | Frontend hot reload |
| **1420** | Tauri Dev Server | Desktop app wrapper |

## Quick Start Commands

### Start Development (Recommended)

```bash
# Start complete development environment
pnpm run tauri dev

# This starts:
# - Vite dev server (port 5173)
# - Tauri dev server (port 1420)
# - Embedded Python analysis engine via PyO3
```

### Start Individual Services

```bash
# Frontend only (UI developers)
pnpm dev:frontend

# Desktop app with embedded Python (full integration)
pnpm run tauri dev
```

## Python Development Commands

### Python Testing Commands

```bash
# Run Python tests
python -m pytest python/test_*.py -v

# Run specific test
python -m pytest python/test_api.py::test_execute_analysis -v

# Run with coverage
python -m pytest --cov=gigui python/test_*.py
```

### Python Debugging Commands

```bash
# Start with Python debugger support (within Tauri)
# Note: Python runs embedded in Tauri via PyO3
# Debug by adding breakpoints in Python code and restarting Tauri

# Start with maximum logging
# Set environment variable before starting Tauri
export GIGUI_LOG_LEVEL=DEBUG
pnpm run tauri dev
```

## Frontend Commands

### Vite Development Server

```bash
# Start Vite dev server with hot reload
pnpm dev:frontend
# Runs on http://localhost:5173

# Start with source maps for debugging
pnpm dev:frontend --sourcemap

# Build for development
pnpm build:dev

# Type checking
pnpm type-check
```

### Tauri Desktop Commands

```bash
# Start Tauri desktop app (recommended for full testing)
pnpm tauri dev

# Debug build
pnpm tauri build --debug

# Production build
pnpm tauri build

# Clean Tauri cache
rm -rf src-tauri/target/debug
```

### Frontend Testing Commands

```bash
# Run frontend tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run end-to-end tests
pnpm test:e2e

# Lint and format
pnpm lint:fix
pnpm format

# Type checking
pnpm type-check
```

## Full Stack Development Commands

### Combined Workflows

```bash
# Start complete development environment (recommended)
pnpm run tauri dev

# This single command starts:
# - Vite dev server for frontend hot reload
# - Tauri desktop wrapper
# - Embedded Python analysis engine via PyO3
```

### Integration Testing Commands

```bash
# Test complete system
pnpm run tauri dev

# Test the desktop application interface
# All testing is done through the GUI since Python is embedded
```

## Build and Production Commands

### Development Builds

```bash
# Build frontend for development
pnpm build:dev

# Preview production build locally
pnpm build && pnpm preview

# Build with debug information
pnpm tauri build --debug
```

### Production Builds

```bash
# Full production build
pnpm build

# Tauri production build
pnpm tauri build

# Clean all build artifacts
pnpm clean
rm -rf dist/
rm -rf src-tauri/target/
```

## Code Quality Commands

### Linting and Formatting

```bash
# Lint and auto-fix issues
pnpm lint:fix

# Format code
pnpm format

# Check TypeScript types
pnpm type-check

# Run all quality checks
pnpm test && pnpm lint && pnpm type-check
```

### Python Code Quality

```bash
# Install development dependencies
uv sync

# Run Python linting (if configured)
ruff check python/

# Format Python code (if configured)
ruff format python/

```

## Troubleshooting Commands

### Port Management

```bash
# Check what's using development ports
lsof -i :5173  # Vite
lsof -i :1420  # Tauri

# Kill processes on specific ports
kill -9 $(lsof -t -i:5173)
kill -9 $(lsof -t -i:1420)

# Kill all development processes
pkill -f "vite"
pkill -f "tauri"
```

### Cache Management

```bash
# Clear all development caches
pnpm clean
rm -rf node_modules/.vite
rm -rf .next
rm -rf src-tauri/target/debug

# Clear Python cache
find . -type d -name "__pycache__" -delete
find . -name "*.pyc" -delete

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### Environment Reset

```bash
# Reset Python environment
rm -rf .venv
uv venv
uv sync

# Reset Node environment
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Complete environment reset
pnpm clean
rm -rf .venv node_modules
uv venv && uv sync
pnpm install
```

## Environment Information Commands

### System Check

```bash
# Check versions
python --version
node --version
rustc --version
pnpm --version

# Check package versions
uv pip list | grep gigui
pnpm list --depth=0

# Check environment variables
env | grep GIGUI
```

### Service Health Checks

```bash
# Verify development services are running
curl http://localhost:5173           # Frontend (returns HTML)
curl http://localhost:1420           # Tauri (returns HTML)

# Check service logs
# Python logs appear in Tauri terminal output
# Frontend logs in browser console (F12)
# Tauri logs in terminal and app console
```

## Application Testing

### Desktop Application Testing

```bash
# Test complete system via desktop application
pnpm run tauri dev

# All testing is done through the GUI interface since Python is embedded
# Use the application interface to test analysis functionality
```

## Development Workflow Commands

### Typical Development Session

```bash
# 1. Start development environment
pnpm run tauri dev

# 2. In separate terminals, run tests as needed
pnpm test:watch                      # Frontend tests
python -m pytest --watch python/    # Backend tests (if supported)

# 3. Code quality checks before committing
pnpm lint:fix && pnpm type-check && pnpm test

# 4. Build and test production version
pnpm build && pnpm tauri build --debug
```

### Git Integration Commands

```bash
# Pre-commit checks
pnpm lint:fix
pnpm type-check
pnpm test
python -m pytest python/test_*.py

# Build verification
pnpm build
pnpm tauri build --debug
```

## Command Aliases and Shortcuts

### Recommended Shell Aliases

```bash
# Add to your ~/.bashrc or ~/.zshrc
alias gig-dev="pnpm run tauri dev"
alias gig-clean="pnpm clean && rm -rf .venv node_modules"
alias gig-reset="gig-clean && uv venv && uv sync && pnpm install"
alias gig-build="pnpm tauri build"
```

### Package.json Scripts Reference

```bash
# Available pnpm scripts (check package.json for complete list)
pnpm run tauri dev    # Start complete development environment
pnpm dev:frontend     # Frontend only
pnpm build            # Production build
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm format           # Format code
pnpm clean            # Clean build artifacts
```

## Related Documentation

-   **[Development Architecture](development-architecture.md)** - Understanding the multi-server setup
-   **[Environment Setup](environment-setup.md)** - Initial development setup
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
-   **[API Reference](../api/reference.md)** - Backend API documentation
