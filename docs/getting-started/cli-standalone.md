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

## Basic Usage

```bash
# Analyze a single repository
./gitinspectorcli /path/to/repository

# Get help
./gitinspectorcli --help
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

## Troubleshooting

### Permission Issues (macOS/Linux)

If you get a permission error, make the executable runnable:

```bash
chmod +x gitinspectorcli-*
```

### Security Warnings (macOS)

On macOS, you may need to allow the executable in System Preferences > Security & Privacy.

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
