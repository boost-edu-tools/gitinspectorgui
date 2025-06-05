# Your First Analysis

Learn how to perform your first git repository analysis with GitInspectorGUI.

## Prerequisites

Before starting, ensure you have:

-   ✅ GitInspectorGUI installed ([Installation Guide](installation.md))
-   ✅ Both HTTP server and Tauri app running ([Quick Start](quick-start.md))
-   ✅ A git repository to analyze (can be this project itself)

## Step-by-Step Tutorial

### 1. Prepare a Repository

You can use any git repository. For this tutorial, we'll use the GitInspectorGUI project itself:

```bash
# If you haven't cloned it yet
git clone https://gitlab.com/your-username/gitinspectorgui.git
cd gitinspectorgui

# Or use any existing git repository
cd /path/to/your/git/repository
```

### 2. Start the Application

Ensure both components are running:

```bash
# Terminal 1: Start HTTP server
python -m gigui.start_server

# Terminal 2: Start Tauri app
npm run tauri dev
```

### 3. Configure Analysis Settings

In the GitInspectorGUI application:

1. **Repository Path**: Click "Browse" and select your git repository folder
2. **Analysis Options**:
    - ✅ Enable "Blame Analysis" for detailed file attribution
    - ✅ Enable "Change Analysis" for commit history insights
    - ⚙️ Adjust date ranges if needed (default: all history)

### 4. Run Your First Analysis

1. Click the **"Execute Analysis"** button
2. Watch the progress indicator
3. Wait for results to appear (may take 30 seconds to several minutes depending on repository size)

### 5. Explore the Results

Once analysis completes, you'll see several result tables:

#### Blame Analysis Tables

-   **File Blame Summary**: Shows who contributed to each file
-   **Author Statistics**: Contribution statistics by author
-   **Line Attribution**: Detailed line-by-line attribution

#### Change Analysis Tables

-   **Commit History**: Chronological commit information
-   **File Changes**: Which files changed in each commit
-   **Author Activity**: Commit activity by author over time

### 6. Interactive Features

Try these interactive features:

#### Table Filtering

-   **Column Filters**: Click column headers to sort and filter
-   **Search**: Use the search box to find specific files or authors
-   **Date Ranges**: Filter by commit date ranges

#### Blame File Navigation

-   **File List**: Click on different files in the sidebar
-   **Line Details**: Hover over lines to see detailed blame information
-   **Commit Links**: Click commit hashes to see full commit details

#### Settings Adjustment

-   **Real-time Updates**: Change settings and click "Execute" again
-   **Comment Filtering**: Toggle comment line inclusion
-   **Output Formats**: Switch between different table views

## Understanding the Results

### Blame Analysis

Shows **who wrote what** in your codebase:

-   **Lines of Code**: How many lines each author contributed
-   **File Ownership**: Which authors are primary contributors to each file
-   **Recent Activity**: Who has been active recently

### Change Analysis

Shows **what changed when**:

-   **Commit Frequency**: How often changes are made
-   **File Hotspots**: Which files change most frequently
-   **Author Patterns**: When different authors are most active

## Common Use Cases

### Code Review Preparation

1. Run analysis on feature branch
2. Review blame data for new/modified files
3. Identify areas needing extra review attention

### Team Insights

1. Analyze main branch over time
2. Review author contribution patterns
3. Identify knowledge concentration areas

### Legacy Code Understanding

1. Analyze older repositories
2. Find original authors of complex code sections
3. Understand evolution of key files

## Tips for Better Analysis

### Repository Preparation

-   **Clean History**: Ensure repository has meaningful commit messages
-   **Author Consistency**: Use consistent author names/emails
-   **Branch Selection**: Analyze the appropriate branch for your needs

### Performance Optimization

-   **Date Ranges**: Limit analysis to relevant time periods for large repositories
-   **File Filtering**: Focus on specific directories if needed
-   **Incremental Analysis**: Run periodic analyses rather than full history each time

### Result Interpretation

-   **Context Matters**: Consider team size and project timeline
-   **Quality vs Quantity**: Lines of code don't always indicate contribution value
-   **Temporal Patterns**: Look for trends over time, not just snapshots

## Troubleshooting

### Analysis Fails to Start

-   ✅ Verify repository path is correct
-   ✅ Ensure you have read permissions
-   ✅ Check that it's a valid git repository (`git status` works)

### Slow Performance

-   🔧 Reduce date range for initial analysis
-   🔧 Exclude large binary files if possible
-   🔧 Close other resource-intensive applications

### Empty Results

-   📋 Check if repository has commits in the selected date range
-   📋 Verify branch has the expected history
-   📋 Ensure git repository is properly initialized

### Connection Issues

-   🌐 Verify HTTP server is running on port 8080
-   🌐 Check browser console for error messages
-   🌐 Restart both server and application

## Next Steps

After your first successful analysis:

1. **[Development Mode](../development/development-mode.md)** - Set up for development
2. **[Enhanced Settings](../development/enhanced-settings.md)** - Explore advanced configuration
3. **[API Reference](../api/reference.md)** - Learn about programmatic access
4. **[Troubleshooting](../development/troubleshooting.md)** - Solve common issues

## Example Output

Here's what you might see for a typical analysis:

```
Repository: gitinspectorgui
Analysis Period: 2024-01-01 to 2025-01-01
Total Commits: 156
Total Authors: 3
Files Analyzed: 89

Top Contributors:
1. developer@example.com - 1,234 lines (45%)
2. contributor@example.com - 987 lines (36%)
3. maintainer@example.com - 543 lines (19%)

Most Active Files:
1. src/components/ResultsTables.tsx - 23 commits
2. python/gigui/api.py - 19 commits
3. docs/README.md - 15 commits
```

Congratulations! You've completed your first GitInspectorGUI analysis. 🎉
