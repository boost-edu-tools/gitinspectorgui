# CLI Usage

GitInspectorGUI provides a standalone command-line interface for git repository analysis, offering both traditional CLI arguments and JSON output compatibility.

## Overview

The standalone executable (`gitinspector-api-sidecar`) serves dual purposes:

-   **CLI Mode**: Traditional command-line interface with argparse options
-   **API Mode**: FastAPI server for GUI integration
-   **JSON Output**: Compatible with programmatic integration

## Installation

The CLI is available through multiple distribution methods:

### From Release Builds

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
```

### JSON Output

```bash
# Output results as JSON
./gitinspector-api-sidecar /path/to/repo --output-format json

# Save JSON to file
./gitinspector-api-sidecar /path/to/repo --output-format json > analysis.json
```

### Output Formats

```bash
# Table format (default)
./gitinspector-api-sidecar /repo --output-format table

# JSON format
./gitinspector-api-sidecar /repo --output-format json
```

!!! note "Web Interface Integration"

    The backend includes capabilities for web-based interactive output with features like `auto_open_browser`, `server_port`, and `max_browser_tabs`. However, these web interface integration capabilities are not yet exposed via CLI flags. Future versions may include options like `--web` or `--interactive` to launch the rich interactive tables available in the GUI application.

## JSON Format Output Example

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
                    "files": 23,
                    "percentage": 65.2
                }
            ],
            "files": [
                {
                    "name": "src/main.py",
                    "lines": 234,
                    "commits": 12,
                    "authors": 3,
                    "percentage": 15.2
                }
            ]
        }
    ]
}
```

## Troubleshooting

### Common Issues

**Permission Denied**

```bash
chmod +x gitinspector-api-sidecar
```

**JSON Parsing Errors**

```bash
# Validate JSON output
./gitinspector-api-sidecar /repo --output-format json | jq '.'
```
