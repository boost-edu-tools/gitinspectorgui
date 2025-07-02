# Quick Start

Get up and running with GitInspectorGUI in just a few steps.

## Installation

### Option 1: Download Executable (Recommended)

Download the latest release for your platform:

- **[GitHub Releases](https://github.com/davbeek/gitinspectorgui-old/releases)** - GUI apps for Windows and macOS
- No installation required - just download and run

### Option 2: Install from PyPI

```bash
pip install gitinspectorgui
```

## Basic Usage

### Using the GUI

1. **Launch the application**
   - Double-click the downloaded executable, or
   - Run `python -m gigui.gui` if installed via PyPI

2. **Select your repository**
   - Click "Browse" next to "Input folder path"
   - Navigate to your Git repository folder
   - Click "Select Folder"

3. **Run analysis**
   - Click the "Run" button
   - Wait for analysis to complete (progress shown in console)

4. **View results**
   - Results automatically open in your default browser (HTML format)
   - Excel files are saved to the repository's parent directory

### Using the CLI

```bash
# Analyze current directory
gitinspectorgui .

# Analyze specific repository
gitinspectorgui /path/to/repository

# Generate Excel output
gitinspectorgui /path/to/repository --format excel
```

## What You'll Get

GitInspectorGUI generates comprehensive reports showing:

- **Author Statistics** - Lines added/removed per contributor
- **File Analysis** - Contribution breakdown by file
- **Blame Information** - Line-by-line authorship with color coding
- **Visual Reports** - Easy-to-read HTML and Excel formats

## Common Options

### Filter by Date Range

```bash
# Only commits after 2023-01-01
gitinspectorgui . --since 2023-01-01

# Only commits before 2023-12-31
gitinspectorgui . --until 2023-12-31
```

### Include Specific File Types

```bash
# Only Python and JavaScript files
gitinspectorgui . --file-types py,js
```

### Exclude Authors

```bash
# Exclude bot commits
gitinspectorgui . --exclude-authors "*bot*,*automated*"
```

## Next Steps

- **[GUI Guide](gui.md)** - Complete GUI interface documentation
- **[CLI Guide](cli.md)** - Full command-line reference
- **[Output Guide](output.md)** - Understanding your results
- **[Examples](examples.md)** - Real-world usage scenarios

## Need Help?

- **[FAQ](faq.md)** - Common questions and solutions
- **[Known Issues](known-issues.md)** - Current limitations
- **[GitHub Issues](https://github.com/davbeek/gitinspectorgui-old/issues)** - Report bugs or request features
