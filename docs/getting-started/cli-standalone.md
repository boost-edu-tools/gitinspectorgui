# GitInspectorCLI Standalone Application

The GitInspectorCLI standalone application is a command-line tool that provides all the analysis capabilities of GitInspectorGUI in a portable executable format. Users can download and run it without needing Python or any dependencies installed.

## Features

-   **Standalone Executable**: No Python installation required
-   **Cross-Platform**: Available for Windows, macOS, and Linux
-   **Full Analysis Capabilities**: Same powerful analysis engine as the GUI
-   **Multiple Output Formats**: Table and JSON output
-   **Comprehensive Options**: 100+ configuration options
-   **Portable**: Single executable file that can be distributed easily

## Download

Download the latest release for your platform:

-   **macOS**: `gitinspectorcli-macos-arm64` (Apple Silicon) or `gitinspectorcli-macos-x64` (Intel)
-   **Linux**: `gitinspectorcli-linux-x64` or `gitinspectorcli-linux-arm64`
-   **Windows**: `gitinspectorcli-windows-x64.exe`

## Quick Start

### Basic Usage

```bash
# Analyze a single repository
./gitinspectorcli /path/to/repository

# Analyze multiple repositories
./gitinspectorcli /path/to/repo1 /path/to/repo2

# Get help
./gitinspectorcli --help
```

### Common Options

```bash
# Limit number of files analyzed
./gitinspectorcli /path/to/repo --n-files 50

# Exclude certain authors
./gitinspectorcli /path/to/repo --exclude-authors "bot*" "automated*"

# Output as JSON
./gitinspectorcli /path/to/repo --output-format json

# Include only specific file types
./gitinspectorcli /path/to/repo --include-files "*.py" "*.js"

# Dry run (preview only)
./gitinspectorcli /path/to/repo --dry-run
```

## Command-Line Options

### Repository Selection

-   `repositories`: Repository paths to analyze (positional arguments)
-   `--depth DEPTH`: Maximum directory depth to search (default: 3)

### File Analysis

-   `--n-files N_FILES`: Maximum number of files to analyze per repository (default: 100)
-   `--include-files [PATTERNS...]`: File patterns to include in analysis
-   `--exclude-files [PATTERNS...]`: File patterns to exclude from analysis

### Author Filtering

-   `--exclude-authors [PATTERNS...]`: Author patterns to exclude from analysis
-   `--exclude-emails [PATTERNS...]`: Email patterns to exclude from analysis

### Analysis Options

-   `--copy-move {0,1,2,3}`: Copy/move detection (0=None, 1=Copy, 2=Move, 3=Both)
-   `--scaled-percentages`: Use scaled percentages in output
-   `--blame-exclusions`: Enable blame exclusions
-   `--dynamic-blame-history`: Enable dynamic blame history

### Output Options

-   `--output-format {json,table}`: Output format (default: table)
-   `--dry-run`: Perform a dry run (preview only)

### Other Options

-   `--version`: Show program version
-   `--help`: Show help message

## Examples

### Analyze a Python Project

```bash
./gitinspectorcli /path/to/python-project \
  --include-files "*.py" \
  --exclude-authors "dependabot*" \
  --n-files 100
```

### Generate JSON Report

```bash
./gitinspectorcli /path/to/repo \
  --output-format json \
  --n-files 50 > analysis-report.json
```

### Analyze Multiple Repositories

```bash
./gitinspectorcli \
  /path/to/frontend \
  /path/to/backend \
  /path/to/shared \
  --exclude-files "*.min.js" "*.lock" \
  --exclude-authors "bot*"
```

### Quick Repository Overview

```bash
./gitinspectorcli /path/to/repo \
  --n-files 20 \
  --exclude-files "*.md" "*.txt"
```

## Output Formats

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
    ],
    "success": true,
    "error": null
}
```

## Performance Tips

-   Use `--n-files` to limit analysis for large repositories
-   Use `--exclude-files` to skip irrelevant files (e.g., `*.min.js`, `*.lock`)
-   Use `--dry-run` to preview what will be analyzed
-   For CI/CD, use `--output-format json` for structured data

## Troubleshooting

### Permission Issues (macOS/Linux)

If you get a permission error, make the executable runnable:

```bash
chmod +x gitinspectorcli-*
```

### Security Warnings (macOS)

On macOS, you may need to allow the executable in System Preferences > Security & Privacy.

### Large Repository Performance

For very large repositories:

```bash
./gitinspectorcli /path/to/large-repo \
  --n-files 50 \
  --exclude-files "*.min.*" "node_modules/*" "dist/*"
```

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Download GitInspectorCLI
  run: |
      wget https://github.com/your-org/gitinspectorgui/releases/latest/download/gitinspectorcli-linux-x64
      chmod +x gitinspectorcli-linux-x64

- name: Analyze Repository
  run: |
      ./gitinspectorcli-linux-x64 . --output-format json > analysis.json
```

### GitLab CI

```yaml
analyze:
    script:
        - wget https://gitlab.com/your-org/gitinspectorgui/-/releases/permalink/latest/downloads/gitinspectorcli-linux-x64
        - chmod +x gitinspectorcli-linux-x64
        - ./gitinspectorcli-linux-x64 . --output-format json > analysis.json
    artifacts:
        reports:
            artifacts:
                paths:
                    - analysis.json
```

## Comparison with GUI Version

| Feature            | CLI          | GUI        |
| ------------------ | ------------ | ---------- |
| Analysis Engine    | ✅ Same      | ✅ Same    |
| Standalone         | ✅ Yes       | ✅ Yes     |
| Interactive UI     | ❌ No        | ✅ Yes     |
| Batch Processing   | ✅ Yes       | ⚠️ Limited |
| CI/CD Integration  | ✅ Excellent | ❌ No      |
| JSON Output        | ✅ Yes       | ⚠️ Limited |
| Real-time Progress | ❌ No        | ✅ Yes     |
| Visual Charts      | ❌ No        | ✅ Yes     |

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
