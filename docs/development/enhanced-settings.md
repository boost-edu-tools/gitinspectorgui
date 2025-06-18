# Development Settings Configuration

## Overview

Configuration options for development and testing of GitInspectorGUI. This covers settings relevant for developers working on the codebase.

**Note**: For application usage and settings, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Development Configuration

### Basic Development Setup

```python
from gigui.api_types import Settings

# Development testing configuration
settings = Settings(
    input_fstrs=["test_repository"],
    file_formats=["json"],  # JSON for easy debugging
    multithread=False,      # Easier debugging
    verbosity=2            # More logging for development
)
```

## Development-Specific Settings

### Debug Configuration

```python
# Development debugging setup
settings = Settings(
    input_fstrs=["test_repo"],
    debug_git_commands=True,      # Log git commands for debugging
    log_git_output=True,          # Log git command output
    profile=2,                    # Detailed profiling
    verbosity=2                   # Maximum logging
)
```

### Performance Testing

```python
# Test performance optimizations
settings = Settings(
    input_fstrs=["large_test_repo"],
    multithread=True,
    max_thread_workers=4,         # Adjust based on dev machine
    memory_limit_mb=1024,         # Limit for testing
    max_commit_count=100          # Small scope for quick testing
)
```

### API Development

```python
# Settings for API development and testing
settings = Settings(
    input_fstrs=["small_test_repo"],
    file_formats=["json"],        # Easy to parse in tests
    multithread=False,            # Deterministic for testing
    verbosity=1,
    output_encoding="utf-8"
)
```

### Backend Testing

```python
# Quick backend testing configuration
settings = Settings(
    input_fstrs=["./test_data/sample_repo"],
    file_formats=["json"],
    max_commit_count=50,          # Fast execution
    multithread=False,            # Easier debugging
    verbosity=2                   # Full logging
)
```

## Development Utilities

### Settings Validation

```python
# Validate settings during development
def validate_dev_settings(settings):
    """Validate settings for development use"""
    if not settings.input_fstrs:
        raise ValueError("input_fstrs required for testing")

    # Ensure JSON output for easier testing
    if "json" not in settings.file_formats:
        settings.file_formats.append("json")

    return settings
```

### Test Configuration Factory

```python
def create_test_settings(repo_path: str, quick: bool = True):
    """Create settings optimized for testing"""
    return Settings(
        input_fstrs=[repo_path],
        file_formats=["json"],
        multithread=not quick,        # Single-threaded for quick tests
        max_commit_count=50 if quick else None,
        verbosity=2,
        debug_git_commands=True
    )
```

## Development Server Configuration

### Local Development Server

```python
# Server settings for development
settings = Settings(
    input_fstrs=["test_repo"],
    server_port=8080,
    server_host="127.0.0.1",      # Local only
    auto_open_browser=False,      # Don't auto-open during dev
    file_formats=["json"]         # API-friendly format
)
```

### Integration Testing

```python
# Settings for integration tests
settings = Settings(
    input_fstrs=["integration_test_repo"],
    file_formats=["json"],
    multithread=False,            # Deterministic results
    verbosity=1,                  # Moderate logging
    max_commit_count=20           # Fast execution
)
```

## Related Development Guides

-   **[Python-Focused Development](python-focused-development.md)** - Backend development workflow
-   **[Development Mode](development-mode.md)** - Development environment setup
-   **[API Reference](../api/reference.md)** - HTTP API documentation
