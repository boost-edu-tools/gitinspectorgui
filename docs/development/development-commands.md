# Development Commands Reference

Comprehensive reference for all GitInspectorGUI development commands, organized by service and use case.

!!! tip "Architecture Context"

    For understanding the multi-server development setup, see **[Development Architecture](development-architecture.md)**.

## Quick Reference

### Most Common Commands

| Task                  | Command                                                   | Notes                             |
| --------------------- | --------------------------------------------------------- | --------------------------------- |
| **Start Development** | `pnpm dev`                                                | Starts all services (recommended) |
| **Backend Only**      | `python -m gigui.start_server --reload --log-level DEBUG` | Python development                |
| **Frontend Only**     | `pnpm dev:frontend`                                       | UI development                    |
| **Desktop App**       | `pnpm tauri dev`                                          | Full integration testing          |
| **Health Check**      | `curl http://127.0.0.1:8000/health`                       | Verify backend running            |
| **API Docs**          | `open http://localhost:8000/docs`                         | Interactive API documentation     |
| **Kill Processes**    | `pkill -f "gigui.start_server"`                           | Stop development servers          |
| **Clean Build**       | `pnpm clean && rm -rf .venv node_modules`                 | Reset environment                 |
| **Production Build**  | `pnpm tauri build`                                        | Create release build              |

### Port Reference

| Port     | Service          | Purpose             |
| -------- | ---------------- | ------------------- |
| **5173** | Vite Dev Server  | Frontend hot reload |
| **1420** | Tauri Dev Server | Desktop app wrapper |
| **8000** | FastAPI Server   | Python backend API  |

## Quick Start Commands

### Start All Services (Recommended)

```bash
# Start complete development environment
pnpm dev

# This starts:
# - Vite dev server (port 5173)
# - Tauri dev server (port 1420)
# - FastAPI server (port 8000)
```

### Start Individual Services

```bash
# Backend only (Python developers)
python -m gigui.start_server --reload --log-level DEBUG

# Frontend only (UI developers)
pnpm dev:frontend

# Desktop app (full integration)
pnpm tauri dev
```

## Python Backend Commands

### Basic Server Commands

```bash
# Basic development server
python -m gigui.start_server

# Development with auto-reload (recommended)
python -m gigui.start_server --reload

# Development with debug logging
python -m gigui.start_server --reload --log-level DEBUG

# Custom host and port
python -m gigui.start_server --host 127.0.0.1 --port 8001

# Production mode
python -m gigui.start_server --host 0.0.0.0 --port 8000
```

### Backend Testing Commands

```bash
# Run Python tests
python -m pytest python/test_*.py -v

# Run specific test
python -m pytest python/test_api.py::test_execute_analysis -v

# Run with coverage
python -m pytest --cov=gigui python/test_*.py

# Test health endpoint
curl http://127.0.0.1:8000/health

# Test analysis endpoint
curl -X POST http://127.0.0.1:8000/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{"input_fstrs": ["/path/to/test/repo"], "n_files": 10}'
```

### Backend Debugging Commands

```bash
# Start with Python debugger support
python -m debugpy --listen 5678 --wait-for-client -m gigui.start_server

# Start with IDE debugging using uvicorn
uvicorn gigui.api:app --reload --host 0.0.0.0 --port 8000

# Start with maximum logging
python -m gigui.start_server --reload --log-level DEBUG

# Watch specific directories only
python -m gigui.start_server --reload --reload-dir python/gigui
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
# Option 1: All services at once (recommended)
pnpm dev

# Option 2: Manual startup sequence
# Terminal 1: Backend
python -m gigui.start_server --reload --log-level DEBUG

# Terminal 2: Frontend + Desktop
pnpm tauri dev
```

### Integration Testing Commands

```bash
# Test complete system
python -m gigui.start_server --reload &
pnpm tauri dev

# Test HTTP endpoints
curl http://127.0.0.1:8000/health
curl -X GET http://127.0.0.1:8000/api/settings

# Test with formatted JSON output
curl -s http://127.0.0.1:8000/api/settings | jq '.'
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
lsof -i :8000  # FastAPI

# Kill processes on specific ports
kill -9 $(lsof -t -i:5173)
kill -9 $(lsof -t -i:1420)
kill -9 $(lsof -t -i:8000)

# Kill all development processes
pkill -f "gigui.start_server"
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

## Performance Optimization Commands

### Development Performance

```bash
# Skip validation checks for faster startup
export GIGUI_SKIP_VALIDATION=true

# Reduce logging overhead
python -m gigui.start_server --reload --log-level INFO

# Optimize Node memory usage
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor development performance
pnpm dev:monitor
```

### Build Performance

```bash
# Parallel builds
pnpm build --parallel

# Build with performance analysis
pnpm build --analyze

# Optimize bundle size
pnpm build --minify
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
# Verify all services are running
curl http://localhost:8000/health     # Backend
curl http://localhost:5173           # Frontend (returns HTML)
curl http://localhost:1420           # Tauri (returns HTML)

# Check service logs
# Backend logs appear in terminal where server was started
# Frontend logs in browser console (F12)
# Tauri logs in terminal and app console
```

## API Testing Commands

### Direct API Testing

```bash
# Health check
curl http://127.0.0.1:8000/health

# Get settings
curl http://127.0.0.1:8000/api/settings

# Execute analysis
curl -X POST http://127.0.0.1:8000/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{
    "input_fstrs": ["/path/to/test/repo"],
    "n_files": 10,
    "file_formats": ["json"]
  }'

# Test with verbose output
curl -v -X POST http://127.0.0.1:8000/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{"input_fstrs": ["/test/repo"]}'
```

### API Documentation Access

```bash
# Open interactive API docs
open http://localhost:8000/docs      # Swagger UI
open http://localhost:8000/redoc     # Alternative docs

# Or access via curl
curl http://localhost:8000/openapi.json | jq '.'
```

## Development Workflow Commands

### Typical Development Session

```bash
# 1. Start development environment
pnpm dev

# 2. In separate terminals, run tests as needed
pnpm test:watch                      # Frontend tests
python -m pytest --watch python/    # Backend tests (if supported)

# 3. Code quality checks before committing
pnpm lint:fix && pnpm type-check && pnpm test

# 4. Build and test production version
pnpm build && pnpm preview
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
alias gig-dev="pnpm dev"
alias gig-backend="python -m gigui.start_server --reload --log-level DEBUG"
alias gig-test="curl http://127.0.0.1:8000/health"
alias gig-clean="pnpm clean && rm -rf .venv node_modules"
alias gig-reset="gig-clean && uv venv && uv sync && pnpm install"
```

### Package.json Scripts Reference

```bash
# Available pnpm scripts (check package.json for complete list)
pnpm dev              # Start all development services
pnpm dev:frontend     # Frontend only
pnpm dev:backend      # Backend only
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
