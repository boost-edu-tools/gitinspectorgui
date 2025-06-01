# GitInspectorGUI API Sidecar

This directory contains the Python API backend that serves as a sidecar process for the Tauri frontend application.

## Overview

The API sidecar is a standalone Python executable that provides git repository analysis functionality through a JSON-based command-line interface. It's designed to be minimal, fast, and suitable for use as a Tauri sidecar process.

## Architecture

- **Entry Point**: [`gigui/api.py`](gigui/api.py) - Main API module with command-line interface
- **Dependencies**: Minimal set focused on git analysis (no GUI, Excel, or web server components)
- **Build Tool**: PyInstaller configured for single-file executable
- **Environment**: Python 3.12 with uv for dependency management

## Files

### Configuration Files
- [`api-sidecar.spec`](api-sidecar.spec) - PyInstaller specification for building the sidecar
- [`requirements-api-sidecar.txt`](requirements-api-sidecar.txt) - Minimal dependencies for API-only operation
- [`requirements.txt`](requirements.txt) - Full dependencies (includes web server, Excel, etc.)

### Scripts
- [`setup-api-sidecar.sh`](setup-api-sidecar.sh) - Sets up Python environment using uv
- [`build-api-sidecar.sh`](build-api-sidecar.sh) - Builds the PyInstaller executable

### Source Code
- [`gigui/api.py`](gigui/api.py) - Main API implementation
- [`gigui/__init__.py`](gigui/__init__.py) - Package initialization

## Quick Start

### 1. Setup Environment

```bash
# Run the setup script to create virtual environment and install dependencies
./setup-api-sidecar.sh
```

### 2. Build Executable

```bash
# Build the single-file executable
./build-api-sidecar.sh
```

### 3. Test the Sidecar

```bash
# Test basic functionality
./dist/gitinspector-api-sidecar get_settings

# Test with repository analysis
./dist/gitinspector-api-sidecar execute_analysis '{"input_fstrs": ["/path/to/repo"]}'
```

## API Commands

The sidecar supports three main commands:

### Get Settings
```bash
./dist/gitinspector-api-sidecar get_settings
```
Returns current settings as JSON.

### Save Settings
```bash
./dist/gitinspector-api-sidecar save_settings '{"input_fstrs": ["/path/to/repo"], "depth": 10}'
```
Saves settings to `~/.gitinspectorgui/settings.json`.

### Execute Analysis
```bash
./dist/gitinspector-api-sidecar execute_analysis '{"input_fstrs": ["/path/to/repo"]}'
```
Performs git repository analysis and returns results as JSON.

## Dependencies

### Minimal API Dependencies
- `gitpython>=3.1.43` - Git repository analysis
- `colorlog>=6.9` - Logging functionality
- `jsonschema>=4.23` - Data validation
- `platformdirs>=4.3.6` - Cross-platform directory paths
- `beautifulsoup4>=4.12.3` - HTML parsing
- `jinja2>=3.1.4` - Template engine

### Excluded Dependencies
The following dependencies from the full application are excluded for minimal size:
- `xlsxwriter` - Excel file generation
- `werkzeug` - Web server utilities
- `fastapi` - Web API framework
- `requests` - HTTP client
- GUI frameworks (tkinter, PyQt, etc.)

## PyInstaller Configuration

The [`api-sidecar.spec`](api-sidecar.spec) file configures PyInstaller for:

- **Single-file executable** (`onefile` mode)
- **Console application** (`console=True`)
- **Minimal dependencies** (excludes GUI and web components)
- **Entry point**: `gigui/api.py`
- **Path configuration**: `pathex=["python"]`

## Integration with Tauri

The built executable can be used as a Tauri sidecar process:

1. **Executable Location**: `dist/gitinspector-api-sidecar`
2. **Communication**: JSON via stdin/stdout
3. **Commands**: Three main API commands (get_settings, save_settings, execute_analysis)
4. **Error Handling**: JSON error responses with success/error flags

## Development

### Manual Setup

If you prefer manual setup instead of using the scripts:

```bash
# Create virtual environment
uv venv .venv --python 3.12
source .venv/bin/activate

# Install minimal dependencies
uv pip install -r requirements-api-sidecar.txt

# Build executable
pyinstaller api-sidecar.spec --clean --noconfirm
```

### Testing

```bash
# Activate environment
source .venv/bin/activate

# Test API module directly
python -c "from gigui.api import GitInspectorAPI; print('API module loaded successfully')"

# Test built executable
./dist/gitinspector-api-sidecar get_settings
```

## Troubleshooting

### Common Issues

1. **uv not found**: Install uv first: `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. **Python version**: Ensure Python 3.12 is available
3. **Import errors**: Check that all minimal dependencies are installed
4. **Build failures**: Clean previous builds with `rm -rf build/ dist/`

### Debug Mode

To enable debug mode in PyInstaller, edit [`api-sidecar.spec`](api-sidecar.spec):

```python
exe = EXE(
    # ...
    debug=True,  # Change from False to True
    # ...
)
```

## Size Optimization

The current configuration prioritizes minimal size by:
- Excluding unnecessary dependencies
- Using single-file executable format
- Excluding GUI and web server components
- Including only essential hidden imports

Typical executable size: ~15-25 MB (depending on platform)