# Enhanced Settings Guide

## Overview

The Settings class has been significantly enhanced with advanced configuration options, performance tuning parameters, and sophisticated filtering capabilities migrated from the legacy codebase. This guide covers all the new features and how to use them effectively.

## Table of Contents

1. [Advanced Filtering Options](#advanced-filtering-options)
2. [Performance Tuning Parameters](#performance-tuning-parameters)
3. [Blame Analysis Configuration](#blame-analysis-configuration)
4. [Output Format and Display Options](#output-format-and-display-options)
5. [Repository Analysis Depth and Scope Controls](#repository-analysis-depth-and-scope-controls)
6. [Memory Management Settings](#memory-management-settings)
7. [Web Server Options](#web-server-options)
8. [Debug and Logging Options](#debug-and-logging-options)
9. [Legacy Compatibility](#legacy-compatibility)
10. [Helper Methods](#helper-methods)

## Advanced Filtering Options

### Pattern-Based Exclusions

The enhanced Settings class now supports sophisticated pattern-based filtering using glob patterns and regular expressions:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    # Glob patterns for author exclusion
    ex_author_patterns=["bot-*", "*automated*", "ci-*"],
    # Glob patterns for email exclusion  
    ex_email_patterns=["*@noreply.github.com", "*@dependabot.com"],
    # Glob patterns for commit message exclusion
    ex_message_patterns=["Merge pull request*", "Auto-generated*", "Version bump*"],
    # Advanced file exclusion patterns
    ex_file_patterns=["*.generated.*", "build/*", "dist/*", "node_modules/*"]
)
```

### Ignore-revs File Support

Support for `.git-blame-ignore-revs` style files to exclude specific commits from blame analysis:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    ignore_revs_file=".git-blame-ignore-revs",
    enable_ignore_revs=True
)
```

## Performance Tuning Parameters

### Threading and Chunking Options

Fine-tune performance for different repository sizes:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    # Threading configuration
    max_thread_workers=8,           # Maximum number of worker threads
    multithread=True,               # Enable multithreading
    multicore=True,                 # Enable multicore processing
    
    # Chunking for large datasets
    git_log_chunk_size=200,         # Process git log in chunks
    blame_chunk_size=50,            # Process blame data in chunks
    max_core_workers=16             # Maximum core workers for CPU-intensive tasks
)
```

### Predefined Configurations

Use predefined configurations for different repository sizes:

```python
# For large repositories
settings.configure_for_large_repository()

# For small repositories  
settings.configure_for_small_repository()
```

## Blame Analysis Configuration

### Enhanced Blame Options

Configure blame analysis behavior:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    blame_follow_moves=True,        # Follow file moves in blame
    blame_ignore_whitespace=False,  # Ignore whitespace changes in blame
    blame_minimal_context=False,    # Use minimal context in blame
    blame_show_email=True,          # Show email addresses in blame output
    blame_exclusions="hide"         # Options: "hide", "show", "remove"
)
```

## Output Format and Display Options

### General Output Settings

```python
settings = Settings(
    input_fstrs=["my_repo"],
    output_encoding="utf-8",                # Output file encoding
    date_format="iso",                      # Options: "iso", "short", "relative"
    author_display_format="name",           # Options: "name", "email", "both"
    line_number_format="decimal"            # Options: "decimal", "hex"
)
```

### Excel-Specific Options

```python
settings = Settings(
    input_fstrs=["my_repo"],
    excel_max_rows=1048576,         # Excel row limit
    excel_abbreviate_names=True,    # Abbreviate long names in Excel
    excel_freeze_panes=True         # Freeze header panes in Excel
)
```

### HTML-Specific Options

```python
settings = Settings(
    input_fstrs=["my_repo"],
    html_theme="default",                   # Options: "default", "dark", "light"
    html_enable_search=True,                # Enable search functionality
    html_max_entries_per_page=100           # Pagination for large datasets
)
```

## Repository Analysis Depth and Scope Controls

### Analysis Limits

Control the scope and depth of repository analysis:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    max_commit_count=1000,          # Limit commits analyzed (0 = unlimited)
    max_file_size_kb=1024,          # Skip files larger than this (in KB)
    follow_renames=True,            # Follow file renames in git history
    ignore_merge_commits=False      # Skip merge commits in analysis
)
```

## Memory Management Settings

### Memory Optimization

Configure memory usage for large repositories:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    memory_limit_mb=2048,           # Memory limit for large repositories
    enable_gc_optimization=True     # Enable garbage collection optimization
)
```

## Web Server Options

### Dynamic Blame History Server

Configure the built-in web server for dynamic blame history:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    server_port=8080,               # Web server port
    server_host="localhost",        # Web server host
    max_browser_tabs=20,            # Maximum browser tabs to open
    auto_open_browser=True          # Automatically open browser
)
```

## Debug and Logging Options

### Development and Debugging

Enable various debugging and logging options:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    debug_show_main_event_loop=False,   # Debug main event loop
    debug_multiprocessing=False,        # Debug multiprocessing
    debug_git_commands=False,           # Debug git command execution
    log_git_output=False,               # Log git command output
    profile=1,                          # Profiling level (0=off, 1=basic, 2=detailed)
    verbosity=2                         # Logging verbosity level
)
```

## Legacy Compatibility

### Legacy Mode

Enable compatibility with the legacy codebase:

```python
settings = Settings(
    input_fstrs=["my_repo"],
    legacy_mode=True,                       # Enable legacy compatibility mode
    preserve_legacy_output_format=True      # Preserve exact legacy output format
)
```

### Legacy Format Conversion

Convert settings to legacy format for compatibility:

```python
legacy_dict = settings.to_legacy_format()
```

## Helper Methods

### Utility Methods

The Settings class provides several utility methods:

```python
# Get effective file extensions (with defaults if empty)
extensions = settings.get_effective_extensions()

# Get all exclusion patterns organized by type
patterns = settings.get_all_exclusion_patterns()
# Returns: {"authors": [...], "emails": [...], "messages": [...], "files": [...], "revisions": [...]}

# Check if performance optimization is enabled
is_optimized = settings.is_performance_optimized()

# Get memory-related settings
memory_config = settings.get_memory_settings()

# Normalize file paths for cross-platform compatibility
settings.normalize_paths()
```

## Configuration Examples

### Example 1: Large Open Source Project

```python
settings = Settings(
    input_fstrs=["large_project"],
    
    # Performance optimization
    multithread=True,
    multicore=True,
    max_thread_workers=8,
    git_log_chunk_size=200,
    memory_limit_mb=4096,
    
    # Filter out automated commits
    ex_author_patterns=["dependabot*", "renovate*", "*[bot]"],
    ex_email_patterns=["*@noreply.github.com", "*@users.noreply.github.com"],
    ex_message_patterns=["Merge pull request*", "Auto-generated*"],
    
    # Analysis scope
    max_commit_count=5000,
    ignore_merge_commits=True,
    
    # Output format
    file_formats=["html", "excel"],
    html_theme="dark",
    excel_freeze_panes=True
)
```

### Example 2: Small Private Repository

```python
settings = Settings(
    input_fstrs=["small_project"],
    
    # Simple configuration
    multithread=False,
    verbosity=1,
    
    # Include all commits
    max_commit_count=0,
    
    # Basic filtering
    ex_authors=["ci-user"],
    
    # Simple output
    file_formats=["html"],
    html_enable_search=False
)
```

### Example 3: Enterprise Analysis

```python
settings = Settings(
    input_fstrs=["enterprise_repo"],
    
    # High performance
    multithread=True,
    multicore=True,
    max_thread_workers=16,
    memory_limit_mb=8192,
    enable_gc_optimization=True,
    
    # Comprehensive filtering
    ex_author_patterns=["*service-account*", "build-*"],
    ex_email_patterns=["*@build.company.com"],
    ex_file_patterns=["generated/*", "*.min.js", "*.bundle.*"],
    
    # Detailed blame analysis
    blame_follow_moves=True,
    blame_show_email=True,
    ignore_revs_file=".git-blame-ignore-revs",
    enable_ignore_revs=True,
    
    # Professional output
    file_formats=["excel"],
    excel_max_rows=500000,
    author_display_format="both",
    date_format="iso"
)
```

## Migration from Legacy Settings

When migrating from the legacy codebase, the enhanced Settings class maintains full compatibility while adding new capabilities:

1. **All legacy settings are preserved** - Existing configurations continue to work
2. **New pattern-based filtering** - Extends basic exclusion lists with powerful patterns
3. **Enhanced performance options** - Fine-tune for different repository sizes
4. **Advanced output control** - More control over output formats and content
5. **Better validation** - Comprehensive validation of all settings

The `to_legacy_format()` method ensures compatibility with any remaining legacy components.

## Best Practices

1. **Start with defaults** - The default settings work well for most repositories
2. **Use predefined configurations** - `configure_for_large_repository()` and `configure_for_small_repository()` provide good starting points
3. **Test filtering patterns** - Use the test script to verify your exclusion patterns work as expected
4. **Monitor performance** - Use `is_performance_optimized()` to check if your settings are optimal
5. **Validate settings** - The enhanced validation catches configuration errors early
6. **Use helper methods** - Methods like `get_effective_extensions()` provide useful information about your configuration

## Conclusion

The enhanced Settings class provides comprehensive control over git repository analysis while maintaining full compatibility with the legacy codebase. The new features enable fine-tuned analysis for repositories of any size and complexity.