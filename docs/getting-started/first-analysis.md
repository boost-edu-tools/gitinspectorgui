# First Analysis

## Prerequisites

-   GitInspectorGUI installed ([Installation Guide](installation.md))
-   HTTP server and Tauri app running ([Quick Start](quick-start.md))
-   Git repository to analyze

## Quick Start

### 1. Start Application

```bash
# Terminal 1: Start API server
python -m gigui.start_server

# Terminal 2: Start frontend
pnpm run tauri dev
```

### 2. Configure Analysis

1. **Repository Path** - Browse and select git repository
2. **Analysis Options** - Enable blame and change analysis
3. **Date Range** - Set analysis period (default: all history)

### 3. Execute Analysis

1. Click **"Execute Analysis"**
2. Monitor progress indicator
3. Wait for results (30 seconds to several minutes)

## Understanding Results

### Blame Analysis

Shows **who wrote what** in the codebase:

-   **Lines of Code** - Author contribution counts
-   **File Ownership** - Primary contributors per file
-   **Recent Activity** - Current active contributors

### Change Analysis

Shows **what changed when**:

-   **Commit Frequency** - Change patterns over time
-   **File Hotspots** - Most frequently modified files
-   **Author Patterns** - Individual contribution timelines

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
