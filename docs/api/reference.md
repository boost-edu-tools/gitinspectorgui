# Python API Reference

GitInspectorGUI Python API specification for developers implementing analysis functions.

## Overview

This document specifies the Python functions you need to implement for GitInspectorGUI.
The integration between JavaScript and Python is handled automatically - you just need
to implement these Python functions according to the specifications below.

> **Integration Details**: For technical information about how these functions are
> called from the frontend via PyO3 helper functions, see
> [PyO3 Integration Architecture](../architecture/pyo3-integration.md).

## Core Functions

| Function             | Purpose             | Required |
| -------------------- | ------------------- | -------- |
| `execute_analysis()` | Repository analysis | Yes      |
| `get_settings()`     | Get settings        | Yes      |
| `save_settings()`    | Save settings       | Yes      |
| `health_check()`     | Backend health      | Yes      |
| `get_engine_info()`  | Engine capabilities | Yes      |
| `get_blame_data()`   | Blame analysis      | Yes      |

## Execute Analysis

### `execute_analysis(settings_json: str) -> str`

Main analysis function that processes git repositories.

**Parameters:**

```python
# Input: JSON string containing settings
{
    "input_fstrs": ["path1", "path2"],     # Repository paths
    "n_files": 100,                       # Max files to analyze
    "exclude_patterns": ["*.log"],        # Files to exclude
    "extensions": [".py", ".js"],         # File extensions to include
    "since": "2023-01-01",               # Date range start
    "until": "2023-12-31",               # Date range end
    "processes": 4,                       # Number of processes
    "legacy_engine": false                # Use legacy analysis
}
```

**Returns:**

```python
# Output: JSON string containing results
{
    "repositories": [
        {
            "name": "repo-name",
            "path": "/path/to/repo",
            "commit_count": 150,
            "author_count": 5,
            "authors": [...],
            "files": [...]
        }
    ],
    "summary": {
        "total_repositories": 2,
        "total_commits": 300,
        "analysis_duration": 2.5
    },
    "performance_stats": {
        "memory_usage": "45MB",
        "processing_time": "2.5s"
    }
}
```

**Example Implementation:**

```python
import json
import logging

def execute_analysis(settings_json: str) -> str:
    """Execute repository analysis with given settings."""
    try:
        # Parse JSON input
        settings = json.loads(settings_json)

        # Validate input
        if not settings.get('input_fstrs'):
            raise ValueError("No repositories specified")

        # Perform analysis
        results = []
        for repo_path in settings['input_fstrs']:
            repo_data = analyze_repository(repo_path, settings)
            results.append(repo_data)

        # Return JSON string
        return json.dumps({
            "repositories": results,
            "summary": {
                "total_repositories": len(results),
                "total_commits": sum(r["commit_count"] for r in results),
                "analysis_duration": time.time() - start_time
            }
        })
    except Exception as e:
        logging.error(f"Analysis failed: {e}")
        raise RuntimeError(f"Analysis execution failed: {e}")
```

## Health Check

### `health_check() -> Dict[str, Any]`

Check if the Python backend is healthy and operational.

**Returns:**

```python
{
    "status": "healthy",  # or "error"
    "message": "Python backend is running",
    "backend": "direct-pyo3",
    "api_status": "ready"
}
```

**Example Implementation:**

```python
def health_check():
    """Check if the Python backend is healthy."""
    try:
        # Verify API is accessible
        api_status = "ready"  # Check your API status here

        return {
            "status": "healthy",
            "message": "Python backend is running",
            "backend": "direct-pyo3",
            "api_status": api_status
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Backend error: {str(e)}",
            "backend": "direct-pyo3"
        }
```

## Engine Information

### `get_engine_info() -> Dict[str, Any]`

Get information about the analysis engine capabilities.

**Returns:**

```python
{
    "name": "GitInspectorGUI Analysis Engine",
    "version": "1.0.0",
    "backend": "direct-pyo3",
    "python_version": "3.11.0",
    "capabilities": [
        "repository_analysis",
        "blame_data",
        "author_statistics",
        "file_analysis",
        "settings_management"
    ]
}
```

## Settings Management

### `get_settings() -> str`

Get current application settings as JSON string.

**Returns:**

```python
# JSON string containing current settings
{
    "input_fstrs": [],
    "n_files": 100,
    "exclude_patterns": [],
    "extensions": [],
    "processes": 1,
    "legacy_engine": false
}
```

### `save_settings(settings_json: str) -> str`

Save application settings from JSON string.

**Parameters:** JSON string containing settings **Returns:** JSON string with status

```python
def save_settings(settings_json: str) -> str:
    """Save application settings."""
    try:
        settings = json.loads(settings_json)
        # Save settings logic here
        return json.dumps({"status": "success", "message": "Settings saved"})
    except Exception as e:
        raise RuntimeError(f"Settings save failed: {e}")
```

## Blame Data Analysis

### `get_blame_data(settings_json: str) -> str`

Get detailed blame data for repositories.

**Parameters:** JSON string containing settings **Returns:** JSON string containing
blame analysis

```python
def get_blame_data(settings_json: str) -> str:
    """Get blame data for repositories."""
    try:
        settings = json.loads(settings_json)
        # Perform blame analysis
        result = perform_blame_analysis(settings)
        return json.dumps(result)
    except Exception as e:
        raise RuntimeError(f"Blame data retrieval failed: {e}")
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

class ConfigurationError(Exception):
    """Raised when configuration is invalid"""
    pass
```

**Error Handling Example:**

```python
def execute_analysis(settings_json: str) -> str:
    try:
        # Parse and validate settings
        settings = json.loads(settings_json)

        if not settings.get('input_fstrs'):
            raise ValidationError("No repositories specified")

        # Check repository access
        for repo_path in settings['input_fstrs']:
            if not os.path.exists(repo_path):
                raise RepositoryError(f"Repository not found: {repo_path}")

        # Perform analysis
        result = perform_git_analysis(settings)
        return json.dumps(result)

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON settings: {e}")
    except Exception as e:
        logging.error(f"Analysis failed: {e}")
        raise RuntimeError(f"Analysis execution failed: {e}")
```

## PyO3 Function Registration

**Why this matters:** Our PyO3 helper functions need to know exactly which Python
functions are available. Functions must be registered properly for the Tauri commands to
find them.

**Required Structure:**

```python
# src-tauri/src-python/main.py
"""GitInspectorGUI Analysis Engine - Plugin Integration."""

import sys
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Handle embedded Python environment
try:
    project_root = Path(__file__).parent.parent.parent
except NameError:
    # Fallback for embedded Python environments
    project_root = Path.cwd()

# Add Python modules to path
python_path = project_root / "python"
if python_path.exists():
    sys.path.insert(0, str(python_path))

# Import analysis engine
from gigui.api.main import GitInspectorAPI

# Initialize API
api = GitInspectorAPI()

def health_check():
    """Check if the Python backend is healthy."""
    # Implementation here
    pass

def get_engine_info():
    """Get information about the analysis engine."""
    # Implementation here
    pass

def execute_analysis(settings_json):
    """Execute repository analysis."""
    # Implementation here
    pass

def get_settings():
    """Get current analysis settings."""
    # Implementation here
    pass

def save_settings(settings_json):
    """Save analysis settings."""
    # Implementation here
    pass

def get_blame_data(settings_json):
    """Get blame data for repositories."""
    # Implementation here
    pass

# CRITICAL: Register functions with the plugin
_tauri_plugin_functions = [
    health_check,
    get_engine_info,
    execute_analysis,
    get_settings,
    save_settings,
    get_blame_data,
]
```

**Critical Requirements:**

- Entry point must be `src-tauri/src-python/main.py`
- Function names must match exactly (case-sensitive)
- All functions must accept/return JSON strings (except health_check and
  get_engine_info)
- Functions must be listed in `_tauri_plugin_functions` list
- Functions must handle JSON parsing/serialization internally

## Frontend Integration

The frontend calls these functions using our PyO3 integration:

```typescript
import { invoke } from "@tauri-apps/api/core";

// Health check
const health = await invoke<any>("health_check");

// Execute analysis
const result = await invoke<AnalysisResult>("execute_analysis", { settings });

// Get engine info
const engineInfo = await invoke<any>("get_engine_info");
```

## Testing Your Functions

Test your Python functions independently:

```python
# test_plugin_functions.py
import json
from main import execute_analysis, health_check, get_engine_info

def test_health_check():
    """Test health check function."""
    result = health_check()
    assert result["status"] == "healthy"
    assert result["backend"] == "direct-pyo3"

def test_execute_analysis():
    """Test analysis function."""
    settings = {
        "input_fstrs": ["/path/to/test/repo"],
        "n_files": 10
    }

    result_json = execute_analysis(json.dumps(settings))
    result = json.loads(result_json)

    assert "repositories" in result
    assert "summary" in result

def test_engine_info():
    """Test engine info function."""
    info = get_engine_info()
    assert info["backend"] == "direct-pyo3"
    assert "capabilities" in info

if __name__ == "__main__":
    test_health_check()
    test_execute_analysis()
    test_engine_info()
    print("All PyO3 functions work!")
```

## Debugging

Add comprehensive logging to your functions:

```python
import logging

def execute_analysis(settings_json: str) -> str:
    """Execute analysis with comprehensive logging."""
    try:
        settings = json.loads(settings_json)
        logger.info(f"Starting analysis with {len(settings.get('input_fstrs', []))} repositories")

        # Your analysis logic
        result = perform_analysis(settings)
        logger.info("Analysis completed successfully")

        return json.dumps(result)

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise
```

## Performance Considerations

### JSON Serialization

```python
def optimized_analysis(settings_json: str) -> str:
    """Optimized analysis with efficient JSON handling."""
    import gc

    try:
        settings = json.loads(settings_json)

        # Process in batches for large datasets
        results = process_repositories_efficiently(settings)

        # Explicit cleanup for large datasets
        gc.collect()

        return json.dumps(results)
    except Exception as e:
        gc.collect()  # Cleanup on error
        raise
```

### Memory Management

```python
def memory_efficient_analysis(settings_json: str) -> str:
    """Memory-efficient analysis implementation."""
    settings = json.loads(settings_json)

    # Stream results for large repositories
    def generate_results():
        for repo_path in settings['input_fstrs']:
            yield analyze_single_repository(repo_path, settings)

    results = list(generate_results())
    return json.dumps({"repositories": results})
```

## Related Documentation

- **[Technology Primer](../technology-primer.md)** - Understanding the plugin
  architecture
- **[Development Workflow](../development/development-workflow.md)** - Development
  patterns
- **[Error Handling](error-handling.md)** - Comprehensive error handling patterns
- **[Examples](examples.md)** - Detailed implementation examples with plugin integration
