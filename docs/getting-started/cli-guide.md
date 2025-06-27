# CLI Guide

Complete guide for GitInspectorGUI command-line interface usage.

## Overview

GitInspectorGUI provides both standalone executables and Python module access for command-line analysis. The CLI serves dual purposes:

-   **CLI Mode**: Traditional command-line interface with argparse options
-   **Desktop Integration**: Embedded Python engine for GUI integration
-   **JSON Output**: Compatible with programmatic integration

## Installation Methods

### From Release Builds

Download the latest release for your platform:

-   **macOS**: `gitinspectorcli-macos-arm64` (Apple Silicon) or `gitinspectorcli-macos-x64` (Intel)
-   **Linux**: `gitinspectorcli-linux-x64` or `gitinspectorcli-linux-arm64`
-   **Windows**: `gitinspectorcli-windows-x64.exe`

```bash
# Download from releases
wget https://github.com/your-org/gitinspectorgui/releases/latest/gitinspector-api-sidecar
chmod +x gitinspector-api-sidecar
```

### From Python Wheel

```bash
# Install Python package
pip install gitinspectorgui-0.5.0-py3-none-any.whl

# Use CLI module
python -m gigui.cli --help
```

### From Source

```bash
# Build standalone executable
cd python
uv run pyinstaller api-sidecar.spec --clean --noconfirm
# Creates: dist/gitinspector-api-sidecar
```

## Basic Usage

### Simple Analysis

```bash
# Analyze current directory
./gitinspector-api-sidecar .

# Analyze specific repository
./gitinspector-api-sidecar /path/to/repo

# Using standalone CLI
./gitinspectorcli /path/to/repository

# Get help
./gitinspectorcli --help
```

### Output Formats

```bash
# Table format (default)
./gitinspector-api-sidecar /repo --output-format table

# JSON format
./gitinspector-api-sidecar /repo --output-format json

# Save JSON to file
./gitinspector-api-sidecar /path/to/repo --output-format json > analysis.json
```

## Standalone Application Features

-   **Standalone Executable**: No Python installation required
-   **Cross-Platform**: Available for Windows, macOS, and Linux
-   **Full Analysis Capabilities**: Same powerful analysis engine as the GUI
-   **Multiple Output Formats**: Table and JSON output
-   **Comprehensive Options**: 100+ configuration options
-   **Portable**: Single executable file that can be distributed easily

## Output Format Examples

### Table Format (Default)

The table format provides a human-readable overview:

```
=== Repository: my-project ===
Path: /path/to/my-project

--- Authors (3) ---
Name                 Email                     Commits  Files  %
----------------------------------------------------------------------
John Doe             john@example.com          45       12     65.2
Jane Smith           jane@example.com          20       8      29.0
Bot User             bot@example.com           4        2      5.8

--- Files (5) ---
Name                      Lines    Commits  Authors  %
------------------------------------------------------------
main.py                   234      15       3        35.2
utils.py                  156      8        2        23.4
config.py                 89       5        2        13.4
tests.py                  67       4        2        10.1
README.md                 45       3        2        6.8
```

### JSON Format

The JSON format provides structured data for programmatic use:

```json
{
    "success": true,
    "repositories": [
        {
            "name": "my-project",
            "path": "/path/to/my-project",
            "authors": [
                {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "commits": 45,
                    "insertions": 1234,
                    "deletions": 567,
                    "files": 12,
                    "percentage": 65.2,
                    "age": "2:15:03"
                }
            ],
            "files": [
                {
                    "name": "main.py",
                    "path": "src/main.py",
                    "lines": 234,
                    "commits": 15,
                    "authors": 3,
                    "percentage": 35.2
                }
            ],
            "blame_data": []
        }
    ]
}
```

## Advanced Usage

!!! note "Web Interface Integration"

    The backend includes capabilities for web-based interactive output with features like `auto_open_browser`, `server_port`, and `max_browser_tabs`. However, these web interface integration capabilities are not yet exposed via CLI flags. Future versions may include options like `--web` or `--interactive` to launch the rich interactive tables available in the GUI application.

## Building from Source

To build the CLI application yourself:

```bash
# Build for current platform
./python/build-cli-app.sh

# Build for all platforms
./scripts/build-cli-all-platforms.sh --all

# Clean build
./scripts/build-cli-all-platforms.sh --clean
```

The built executables will be available in `dist/cli-releases/`.

## Troubleshooting

### Permission Issues (macOS/Linux)

If you get a permission error, make the executable runnable:

```bash
chmod +x gitinspector-api-sidecar
# or
chmod +x gitinspectorcli-*
```

### Security Warnings (macOS)

On macOS, you may need to allow the executable in System Preferences > Security & Privacy.

### JSON Parsing Errors

```bash
# Validate JSON output
./gitinspector-api-sidecar /repo --output-format json | jq '.'
```

## Related Documentation

-   **[Quick Start](03-quick-start.md)** - Get development environment running
-   **[Installation](02-installation.md)** - Detailed setup instructions
-   **[First Analysis](04-first-analysis.md)** - Test your setup
