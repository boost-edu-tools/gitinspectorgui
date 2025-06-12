# Enhanced Settings

## Overview

Advanced configuration options for git repository analysis with performance tuning, filtering, and output customization.

## Core Configuration

### Basic Setup

```python
from gigui.api_types import Settings

settings = Settings(
    input_fstrs=["repository_path"],
    file_formats=["html", "excel"],
    multithread=True,
    verbosity=1
)
```

## Advanced Filtering

### Pattern-Based Exclusions

```python
settings = Settings(
    input_fstrs=["my_repo"],
    # Author filtering
    ex_author_patterns=["bot-*", "*automated*", "ci-*"],
    ex_email_patterns=["*@noreply.github.com", "*@dependabot.com"],

    # Commit filtering
    ex_message_patterns=["Merge pull request*", "Auto-generated*"],

    # File filtering
    ex_file_patterns=["*.generated.*", "build/*", "node_modules/*"]
)
```

### Ignore Revisions

```python
settings = Settings(
    input_fstrs=["my_repo"],
    ignore_revs_file=".git-blame-ignore-revs",
    enable_ignore_revs=True
)
```

## Performance Tuning

### Threading Configuration

```python
settings = Settings(
    input_fstrs=["my_repo"],
    multithread=True,
    multicore=True,
    max_thread_workers=8,
    git_log_chunk_size=200,
    blame_chunk_size=50
)
```

### Memory Management

```python
settings = Settings(
    input_fstrs=["my_repo"],
    memory_limit_mb=2048,
    enable_gc_optimization=True,
    max_commit_count=1000,  # Limit analysis scope
    max_file_size_kb=1024   # Skip large files
)
```

## Blame Analysis

### Blame Configuration

```python
settings = Settings(
    input_fstrs=["my_repo"],
    blame_follow_moves=True,
    blame_ignore_whitespace=False,
    blame_show_email=True,
    blame_exclusions="hide"  # Options: "hide", "show", "remove"
)
```

## Output Formats

### General Output

```python
settings = Settings(
    input_fstrs=["my_repo"],
    output_encoding="utf-8",
    date_format="iso",                    # "iso", "short", "relative"
    author_display_format="name",         # "name", "email", "both"
    file_formats=["html", "excel"]
)
```

### Format-Specific Options

```python
# Excel options
settings = Settings(
    input_fstrs=["my_repo"],
    excel_max_rows=1048576,
    excel_abbreviate_names=True,
    excel_freeze_panes=True
)

# HTML options
settings = Settings(
    input_fstrs=["my_repo"],
    html_theme="default",               # "default", "dark", "light"
    html_enable_search=True,
    html_max_entries_per_page=100
)
```

## Predefined Configurations

### Repository Size Optimization

```python
# Large repository
settings.configure_for_large_repository()

# Small repository
settings.configure_for_small_repository()
```

## Helper Methods

### Utility Functions

```python
# Get effective settings
extensions = settings.get_effective_extensions()
patterns = settings.get_all_exclusion_patterns()
is_optimized = settings.is_performance_optimized()

# Legacy compatibility
legacy_dict = settings.to_legacy_format()

# Path normalization
settings.normalize_paths()
```

## Configuration Examples

### Large Open Source Project

```python
settings = Settings(
    input_fstrs=["large_project"],

    # Performance
    multithread=True,
    max_thread_workers=8,
    memory_limit_mb=4096,

    # Filtering
    ex_author_patterns=["dependabot*", "*[bot]"],
    ex_email_patterns=["*@noreply.github.com"],
    ex_message_patterns=["Merge pull request*"],

    # Output
    file_formats=["html", "excel"],
    html_theme="dark",
    max_commit_count=5000
)
```

### Small Private Repository

```python
settings = Settings(
    input_fstrs=["small_project"],
    multithread=False,
    verbosity=1,
    ex_authors=["ci-user"],
    file_formats=["html"]
)
```

### Enterprise Analysis

```python
settings = Settings(
    input_fstrs=["enterprise_repo"],

    # High performance
    multithread=True,
    max_thread_workers=16,
    memory_limit_mb=8192,

    # Comprehensive filtering
    ex_author_patterns=["*service-account*", "build-*"],
    ex_file_patterns=["generated/*", "*.min.js"],

    # Advanced blame
    blame_follow_moves=True,
    ignore_revs_file=".git-blame-ignore-revs",

    # Professional output
    file_formats=["excel"],
    author_display_format="both",
    date_format="iso"
)
```

## Debug and Development

### Debugging Options

```python
settings = Settings(
    input_fstrs=["my_repo"],
    debug_git_commands=True,
    log_git_output=True,
    profile=1,                    # 0=off, 1=basic, 2=detailed
    verbosity=2
)
```

### Web Server

```python
settings = Settings(
    input_fstrs=["my_repo"],
    server_port=8080,
    server_host="localhost",
    auto_open_browser=True
)
```
