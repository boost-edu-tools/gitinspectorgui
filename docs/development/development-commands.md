# Development Commands Reference

Comprehensive reference for all GitInspectorGUI development commands.

!!! tip "Workflow Context"

    For understanding development workflows and patterns, see **[Development Workflow](development-workflow.md)**.

## Quick Reference

### Most Common Commands

| Task                  | Command                                   | Notes                       |
| --------------------- | ----------------------------------------- | --------------------------- |
| **Start Development** | `pnpm run tauri dev`                      | Starts complete application |
| **Frontend Only**     | `pnpm dev`                                | UI development only         |
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
# - Tauri desktop application with embedded Python via PyO3
# - Direct PyO3 function calls (no separate server)
```

### Start Individual Services

```bash
# Frontend only (UI developers)
pnpm dev

# Desktop app with embedded Python (full integration)
pnpm run tauri dev
```

## Python Development Commands

### Python Testing Commands

```bash
# Run Python tests
cd python && python -m pytest

# Run specific test
cd python && python -m pytest tests/test_analysis.py::test_execute_analysis -v

# Run with coverage
cd python && python -m pytest --cov=gigui
```

### Python Development Workflow

```bash
# Test Python modules independently
cd python
python -c "from gigui.analysis import execute_analysis; print('OK')"

# Install/update Python dependencies
uv sync

# Note: Python changes require restarting the desktop app
# since Python is embedded via PyO3
```

## Frontend Commands

### Vite Development Server

```bash
# Start Vite dev server with hot reload
pnpm dev
# Runs on http://localhost:5173

# Start with source maps for debugging
pnpm dev --sourcemap

# Build for development
pnpm build

# Type checking
pnpm type-check
```

### Tauri Desktop Commands

```bash
# Start Tauri desktop app (recommended for full testing)
pnpm run tauri dev

# Debug build
pnpm run tauri build --debug

# Production build
pnpm run tauri build

# Clean Tauri cache
rm -rf src-tauri/target
```

### Frontend Testing Commands

```bash
# Run frontend tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint and format
pnpm lint:fix
pnpm format

# Type checking
pnpm type-check
```

## PyO3 Integration Commands

### PyO3 Development Workflow

```bash
# Start development with PyO3 debugging
RUST_LOG=pyo3=debug pnpm run tauri dev

# Test PyO3 bindings
cd src-tauri && cargo test

# Rebuild PyO3 integration
cd src-tauri && cargo clean && cargo build
```

### PyO3 Debugging Commands

```bash
# Enable detailed PyO3 logging (see Rust Logging in Environment Setup)
export RUST_LOG=pyo3=debug
export RUST_BACKTRACE=1
pnpm run tauri dev

# Enable application-specific logging
export RUST_LOG=gitinspectorgui=debug
pnpm run tauri dev

# Check Python environment for PyO3
python -c "import sysconfig; print(sysconfig.get_path('include'))"

# Verify Python modules can be imported
python -c "from gigui.analysis import execute_analysis; print('PyO3 ready')"
```

## Build and Production Commands

### Development Builds

```bash
# Build frontend for development
pnpm build

# Preview production build locally
pnpm build && pnpm preview

# Build with debug information
pnpm run tauri build --debug
```

### Production Builds

```bash
# Full production build
pnpm run tauri build

# Build Python CLI package separately
cd python && uv build

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

### Rust Code Quality

```bash
# Check Rust code
cd src-tauri && cargo check

# Format Rust code
cd src-tauri && cargo fmt

# Lint Rust code
cd src-tauri && cargo clippy
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
rm -rf src-tauri/target

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

### PyO3 Troubleshooting

```bash
# Check PyO3 compilation requirements
python -c "import sysconfig; print(sysconfig.get_config_vars())"

# Rebuild PyO3 with verbose output
cd src-tauri && cargo build --verbose

# Check Python library linking
cd src-tauri && cargo build 2>&1 | grep -i python

# Test PyO3 integration
cd src-tauri && cargo test --verbose
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
env | grep RUST_LOG
env | grep PYTHONPATH
```

### Service Health Checks

```bash
# Verify development services are running
curl http://localhost:5173           # Frontend dev server (returns HTML)

# Check that desktop app is running
ps aux | grep gitinspectorgui

# Python integration check (via PyO3)
python -c "from gigui.analysis import execute_analysis; print('PyO3 integration OK')"
```

## Application Testing

### Desktop Application Testing

```bash
# Test complete system via desktop application
pnpm run tauri dev

# All testing is done through the GUI interface since Python is embedded
# Use the application interface to test analysis functionality

# Test with sample repository
# 1. Open desktop app
# 2. Select a git repository
# 3. Run analysis through GUI
# 4. Verify results display correctly
```

### Integration Testing

```bash
# Test PyO3 integration
cd src-tauri && cargo test

# Test Python analysis engine
cd python && python -m pytest

# Test frontend components
pnpm test

# End-to-end testing via desktop app
pnpm run tauri dev
```

## Development Workflow Commands

### Typical Development Session

```bash
# 1. Start development environment
pnpm run tauri dev

# 2. In separate terminals, run tests as needed
pnpm test:watch                      # Frontend tests
cd python && python -m pytest       # Python tests

# 3. Code quality checks before committing
pnpm lint:fix && pnpm type-check && pnpm test

# 4. Build and test production version
pnpm run tauri build --debug
```

### Git Integration Commands

```bash
# Pre-commit checks
pnpm lint:fix
pnpm type-check
pnpm test
cd python && python -m pytest

# Build verification
pnpm build
pnpm run tauri build --debug
```

## Performance Monitoring Commands

### Development Performance

```bash
# Monitor memory usage
top -p $(pgrep gitinspectorgui)

# Profile PyO3 performance
RUST_LOG=debug pnpm run tauri dev

# Monitor Python memory within PyO3
python -c "import tracemalloc; tracemalloc.start()"
```

### Build Performance

```bash
# Time frontend build
time pnpm build

# Time Tauri build
time pnpm run tauri build

# Profile Rust compilation
cd src-tauri && cargo build --timings
```

## Command Aliases and Shortcuts

### Recommended Shell Aliases

```bash
# Add to your ~/.bashrc or ~/.zshrc
alias gig-dev="pnpm run tauri dev"
alias gig-clean="pnpm clean && rm -rf .venv node_modules"
alias gig-reset="gig-clean && uv venv && uv sync && pnpm install"
alias gig-build="pnpm run tauri build"
alias gig-test="pnpm test && cd python && python -m pytest"
```

### Package.json Scripts Reference

```bash
# Available pnpm scripts (check package.json for complete list)
pnpm run tauri dev    # Start complete development environment
pnpm dev              # Frontend only
pnpm build            # Production build
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm format           # Format code
pnpm clean            # Clean build artifacts
```

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Understanding development workflows and patterns
-   **[Environment Setup](environment-setup.md)** - Initial development setup
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
-   **[PyO3 Integration](../architecture/design-decisions.md)** - PyO3 architecture details
