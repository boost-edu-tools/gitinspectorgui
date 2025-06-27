# Python API Reference

GitInspectorGUI Python API specification for developers implementing analysis functions.

## Overview

This document specifies the Python functions you need to implement for GitInspectorGUI. The PyO3 integration between Rust and Python is already handled automatically - you just need to implement these Python functions according to the specifications below.

**Integration Note**: These functions are called directly from Rust via PyO3 - no HTTP requests involved. See [PyO3 Architecture](../architecture/design-decisions.md) for technical details.

## Core Functions

| Function             | Purpose             | Required |
| -------------------- | ------------------- | -------- |
| `execute_analysis()` | Repository analysis | Yes      |
| `get_settings()`     | Get settings        | Yes      |
| `save_settings()`    | Save settings       | Yes      |
| `get_engine_info()`  | Engine capabilities | Optional |

## Execute Analysis

### `execute_analysis(settings: Settings) -> Dict[str, Any]`

Main analysis function that processes git repositories.

**Parameters:**

```python
@dataclass
class Settings:
    input_fstrs: List[str]              # Repository paths
    n_files: int = 100                  # Max files to analyze
    ex_files: List[str] = None          # Files to exclude
    extensions: List[str] = None        # File extensions to include
    file_formats: List[str] = None      # Output formats
    processes: int = 4                  # Number of processes
    legacy_engine: bool = False         # Use legacy analysis
```

**Returns:**

```python
{
    "repositories": [
        {
            "name": str,
            "path": str,
            "commit_count": int,
            "author_count": int,
            "authors": [...],
            "files": [...]
        }
    ],
    "summary": {
        "total_repositories": int,
        "total_commits": int,
        "analysis_duration": float
    }
}
```

**Example Implementation:**

```python
def execute_analysis(settings: Settings) -> Dict[str, Any]:
    """Execute repository analysis with given settings."""

    # Validate input
    if not settings.input_fstrs:
        raise ValidationError("No repositories specified")

    # Perform analysis
    results = []
    for repo_path in settings.input_fstrs:
        repo_data = analyze_repository(repo_path, settings)
        results.append(repo_data)

    return {
        "repositories": results,
        "summary": {
            "total_repositories": len(results),
            "total_commits": sum(r["commit_count"] for r in results),
            "analysis_duration": time.time() - start_time
        }
    }
```

## Settings Management

### `get_settings() -> Dict[str, Any]`

Get current application settings.

**Returns:**

```python
{
    "input_fstrs": [],
    "n_files": 100,
    "file_formats": ["json"],
    "processes": 1,
    "legacy_engine": False
}
```

### `save_settings(settings: Settings) -> bool`

Save application settings.

**Parameters:** Settings object (same as execute_analysis)
**Returns:** `True` if successful, `False` otherwise

## Engine Information

### `get_engine_info() -> Dict[str, Any]` (Optional)

Get information about the analysis engine capabilities.

**Returns:**

```python
{
    "engine_version": "2.1.0",
    "supported_formats": ["json", "xml", "html", "csv"],
    "legacy_engine_available": True,
    "features": {
        "blame_analysis": True,
        "rename_detection": True
    }
}
```

## Error Handling

Define these exception classes in your Python code:

```python
class AnalysisError(Exception):
    """Raised when analysis fails"""
    pass

class ValidationError(Exception):
    """Raised when input validation fails"""
    pass

class RepositoryError(Exception):
    """Raised when repository access fails"""
    pass
```

**Error Handling Example:**

```python
def execute_analysis(settings: Settings) -> Dict[str, Any]:
    try:
        # Validate settings
        if not settings.input_fstrs:
            raise ValidationError("No repositories specified")

        # Check repository access
        for repo_path in settings.input_fstrs:
            if not os.path.exists(repo_path):
                raise RepositoryError(f"Repository not found: {repo_path}")

        # Perform analysis
        return perform_git_analysis(settings)

    except Exception as e:
        logging.error(f"Analysis failed: {e}")
        raise AnalysisError(f"Analysis execution failed: {e}")
```

## Module Structure

**Why this matters:** The Rust-Python integration is configured to import specific Python modules and functions. If your code isn't organized exactly as shown below, the desktop application won't be able to find your functions and will fail with import errors.

**The Problem:** PyO3 (the Rust-Python bridge) needs to know exactly where to find your Python functions. The Rust code is hardcoded to import from `gigui.analysis` and call specific function names.

**What happens if you get it wrong:**

-   Import errors when the desktop app starts
-   "Module not found" or "Function not found" runtime errors
-   The analysis button won't work

**Required Structure:**

```python
# gigui/analysis/__init__.py
# This file MUST export these exact function names
from .main import execute_analysis, get_settings, save_settings, get_engine_info

# gigui/analysis/main.py
# This file MUST contain these exact function names
from typing import List, Dict, Any
from dataclasses import dataclass
import logging

@dataclass
class Settings:
    input_fstrs: List[str]
    n_files: int = 100
    ex_files: List[str] = None
    extensions: List[str] = None
    file_formats: List[str] = None
    processes: int = 4
    legacy_engine: bool = False

def execute_analysis(settings: Settings) -> Dict[str, Any]:
    # Your implementation here
    pass

def get_settings() -> Dict[str, Any]:
    # Your implementation here
    pass

def save_settings(settings: Settings) -> bool:
    # Your implementation here
    pass

def get_engine_info() -> Dict[str, Any]:
    # Your implementation here
    pass
```

**Critical Requirements:**

-   Module path must be exactly `gigui.analysis`
-   Function names must match exactly (case-sensitive)
-   Function signatures must match the specifications above
-   The `__init__.py` file must export all required functions

## Testing Your Functions

Test your Python functions independently:

```python
# test_analysis.py
from gigui.analysis import execute_analysis, Settings

def test_basic_analysis():
    settings = Settings(
        input_fstrs=["/path/to/test/repo"],
        n_files=10
    )

    result = execute_analysis(settings)

    assert "repositories" in result
    assert "summary" in result
    assert len(result["repositories"]) > 0

if __name__ == "__main__":
    test_basic_analysis()
    print("Analysis function works!")
```

## Debugging

Add logging to your functions for debugging:

```python
import logging

def execute_analysis(settings: Settings) -> Dict[str, Any]:
    logging.info(f"Starting analysis with {len(settings.input_fstrs)} repositories")

    try:
        # Your analysis logic
        result = perform_analysis(settings)
        logging.info("Analysis completed successfully")
        return result

    except Exception as e:
        logging.error(f"Analysis failed: {e}")
        raise
```

## Related Documentation

-   **[Technology Primer](../technology-primer.md)** - Understanding the overall architecture
-   **[Development Workflow](../development/development-workflow.md)** - Development patterns
-   **[Error Handling](error-handling.md)** - Comprehensive error handling patterns
-   **[Examples](examples.md)** - More detailed implementation examples
