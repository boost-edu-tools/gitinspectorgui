# Testing Your Development Setup

Test your GitInspectorGUI development environment with a first analysis run.

**Note**: This is for testing your development setup. For application usage and features, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Prerequisites

-   Development environment installed ([Installation Guide](installation.md))
-   HTTP server and Tauri app running ([Quick Start](quick-start.md))
-   A git repository to test with (any local git repository will work)

## Step-by-Step First Analysis

### 1. Start the Application

You need both the Python backend and the desktop frontend running:

```bash
# Terminal 1: Start the Python API server (backend)
python -m gigui.start_server

# Terminal 2: Start the desktop application (frontend)
pnpm run tauri dev
```

**What happens**:

-   The Python server starts analyzing git repositories when requested
-   The desktop app provides the user interface
-   They communicate via HTTP (the desktop app sends requests to the Python server)

### 2. Configure Your Analysis

In the desktop application window:

1. **Repository Path** - Click "Browse" and select any git repository folder

    - Try with a small repository first (under 1000 commits)
    - The repository must be a valid git repository (has a `.git` folder)

2. **Analysis Options** - Choose what to analyze:

    - **Blame Analysis**: Shows who wrote each line of code
    - **Change Analysis**: Shows how files changed over time
    - Both are recommended for a complete picture

3. **Date Range** - Set the time period to analyze:
    - Default: All history (analyzes entire repository history)
    - Custom: Set start/end dates to focus on specific periods

### 3. Execute Analysis

1. Click **"Execute Analysis"** button
2. **Monitor progress** - You'll see a progress indicator
3. **Wait for results** - Takes 30 seconds to several minutes depending on repository size

**What's happening behind the scenes**:

-   The desktop app sends your settings to the Python server via HTTP
-   The Python server runs git commands to analyze the repository
-   Results are sent back as JSON and displayed in the interface

## Understanding Your Results

After analysis completes, you'll see several types of information:

### Blame Analysis Results

**What it shows**: Who wrote what code in the repository

**Key metrics you'll see**:

-   **Lines of Code per Author** - How many lines each person contributed
-   **File Ownership** - Which person is the primary contributor to each file
-   **Recent Activity** - Who has been actively contributing recently
-   **Percentage Contributions** - Each author's share of the total codebase

**Example**: "Alice wrote 45% of the code (1,234 lines), mostly in Python files"

### Change Analysis Results

**What it shows**: How the code evolved over time

**Key metrics you'll see**:

-   **Commit Frequency** - How often changes were made over time
-   **File Hotspots** - Which files are modified most frequently (may need attention)
-   **Author Activity Patterns** - When each person was most active
-   **Change Trends** - Whether development is accelerating or slowing down

**Example**: "src/main.py has 23 commits and is the most frequently changed file"

## Interactive Features

### Table Operations

-   **Sort/Filter** - Click column headers
-   **Search** - Find specific files or authors
-   **Date Filtering** - Limit by time ranges

### Blame Navigation

-   **File Selection** - Browse files in sidebar
-   **Line Details** - Hover for blame information
-   **Commit Links** - Click hashes for details

## Common Use Cases

### Code Review

```bash
# Analyze feature branch
git checkout feature-branch
# Run analysis to identify review areas
```

### Team Insights

-   Analyze contribution patterns
-   Identify knowledge concentration
-   Review author activity trends

### Legacy Understanding

-   Find original authors of complex code
-   Understand file evolution
-   Map historical changes

## Performance Tips

### Large Repositories

-   **Limit date ranges** - Focus on relevant periods
-   **Filter directories** - Analyze specific components
-   **Incremental analysis** - Regular smaller analyses

### Optimization Settings

```python
# For large repos
settings = Settings(
    input_fstrs=["repo_path"],
    max_commit_count=1000,
    multithread=True,
    memory_limit_mb=2048
)
```

## Troubleshooting

### Analysis Issues

**Fails to start:**

-   Verify repository path exists
-   Check git repository validity: `git status`
-   Ensure read permissions

**Slow performance:**

-   Reduce date range
-   Close resource-intensive applications
-   Enable multithreading

**Empty results:**

-   Check commits exist in date range
-   Verify correct branch selected
-   Confirm repository initialization

### Connection Issues

**Server problems:**

-   Verify server running on port 8080
-   Check browser console for errors
-   Restart server and application

## Example Output

```
Repository: my-project
Period: 2024-01-01 to 2025-01-01
Commits: 156 | Authors: 3 | Files: 89

Top Contributors:
1. alice@dev.com - 1,234 lines (45%)
2. bob@dev.com - 987 lines (36%)
3. carol@dev.com - 543 lines (19%)

Active Files:
1. src/main.tsx - 23 commits
2. api/server.py - 19 commits
3. README.md - 15 commits
```

## Next Steps

-   **[Enhanced Settings](../development/enhanced-settings.md)** - Advanced configuration
-   **[Development Mode](../development/development-mode.md)** - Development setup
-   **[API Reference](../api/reference.md)** - Programmatic access
-   **[Troubleshooting](../development/troubleshooting.md)** - Common issues

## Summary

GitInspectorGUI provides comprehensive git repository analysis through blame and change tracking. The interactive interface enables deep exploration of code ownership, contribution patterns, and repository evolution.
