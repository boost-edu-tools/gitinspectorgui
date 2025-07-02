# CLI Development Guide

Development-focused guide for building and testing GitInspectorGUI's command-line interface.

!!! info "Complete CLI Reference"
For complete CLI usage, options, and examples, see the **[User CLI Guide](../user-docs/cli.md)**.

## Overview

This guide covers CLI development workflows, building from source, and testing CLI functionality during development.

## Development CLI Usage

### Testing CLI During Development

```bash
# Test CLI through Python module (development)
cd python
python -m gigui.cli --help

# Test with current development code
python -m gigui.cli /path/to/repository

# Test specific features
python -m gigui.cli /repo --output-format json
```

### Development vs Production CLI

- **Development**: Uses `python -m gigui.cli` with current source code
- **Production**: Uses standalone executables built from source
- **Integration**: CLI shares the same analysis engine as the GUI via PyO3

## Building CLI from Source

### Build Scripts

```bash
# Build for current platform only
./python/tools/build-cli-app.sh

# Build for all platforms (requires cross-compilation setup)
./scripts/build-cli-all-platforms.sh --all

# Clean build (removes previous builds)
./scripts/build-cli-all-platforms.sh --clean
```

### Build Output

Built executables are available in:

- `dist/cli-releases/` - Cross-platform builds
- `python/dist/` - Current platform builds

### Build Requirements

- **Python 3.8+** with development headers
- **PyInstaller** for executable creation
- **Cross-compilation tools** for multi-platform builds (optional)

## Testing CLI Changes

### Unit Testing

```bash
# Test CLI module
cd python
python -m pytest tests/test_cli.py -v

# Test analysis engine
python -m pytest tests/test_analysis.py -v
```

### Integration Testing

```bash
# Test CLI with real repository
python -m gigui.cli . --output-format json > test_output.json

# Validate JSON output
python -c "import json; json.load(open('test_output.json'))"

# Test GUI integration
pnpm run tauri dev  # CLI functionality embedded in GUI
```

### Performance Testing

```bash
# Profile CLI performance
python -m gigui.cli /large/repo --profile 10

# Memory usage testing
python -m memory_profiler -m gigui.cli /repo
```

## CLI Development Workflow

### 1. Make Changes

```bash
# Edit CLI code in python/gigui/cli/
# Edit analysis code in python/gigui/analysis/
```

### 2. Test Changes

```bash
# Quick test with development CLI
python -m gigui.cli /test/repo

# Test through GUI integration
pnpm run tauri dev
```

### 3. Build and Test Executable

```bash
# Build standalone executable
./python/tools/build-cli-app.sh

# Test built executable
./dist/gitinspector-api-sidecar /test/repo
```

## Troubleshooting Development Issues

### CLI Module Import Errors

```bash
# Ensure Python environment is activated
source .venv/bin/activate

# Reinstall in development mode
cd python
pip install -e .
```

### Build Failures

```bash
# Clean Python cache
find python -name "__pycache__" -exec rm -rf {} +
find python -name "*.pyc" -delete

# Clean build artifacts
rm -rf python/build python/dist
./python/tools/build-cli-app.sh
```

### PyO3 Integration Issues

```bash
# Test PyO3 helper functions
cd src-tauri
cargo test

# Test Python-Rust integration
pnpm run tauri dev
```

## Related Documentation

- **[User CLI Guide](../user-docs/cli.md)** - Complete CLI reference and usage
- **[Development Workflow](../development/development-workflow.md)** - General development patterns
- **[Build Process](../development/build-process.md)** - Complete build documentation
