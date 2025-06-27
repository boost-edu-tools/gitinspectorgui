# PyO3 Integration Examples

Practical examples for GitInspectorGUI PyO3 Python function implementation.

## Overview

This document shows how to implement the required Python functions that will be called directly from Rust via PyO3. No HTTP requests or network communication is involved - these are direct function calls within a single process.

**Implementation Focus**: These examples show direct Python function implementations - no HTTP endpoints or network code needed. For PyO3 integration details, see [Design Decisions](../architecture/design-decisions.md).

## Basic Analysis Function

### Python Implementation

```python
# gigui/analysis/main.py
from typing import Dict, Any, List
from dataclasses import dataclass
import logging
import time

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
    """Execute repository analysis with given settings."""
    logging.info(f"Starting analysis of {len(settings.input_fstrs)} repositories")

    start_time = time.time()
    results = []

    for repo_path in settings.input_fstrs:
        try:
            repo_data = analyze_single_repository(repo_path, settings)
            results.append(repo_data)
        except Exception as e:
            logging.error(f"Failed to analyze {repo_path}: {e}")
            raise AnalysisError(f"Repository analysis failed: {e}")

    return {
        "repositories": results,
        "summary": {
            "total_repositories": len(results),
            "total_commits": sum(r.get("commit_count", 0) for r in results),
            "analysis_duration": time.time() - start_time
        }
    }

def analyze_single_repository(repo_path: str, settings: Settings) -> Dict[str, Any]:
    """Analyze a single repository."""
    # Your git analysis logic here
    return {
        "name": repo_path.split("/")[-1],
        "path": repo_path,
        "commit_count": 150,
        "author_count": 5,
        "authors": [
            {"name": "Alice", "commits": 75, "lines": 2500},
            {"name": "Bob", "commits": 45, "lines": 1800},
        ],
        "files": [
            {"name": "main.py", "lines": 200, "author": "Alice"},
            {"name": "utils.py", "lines": 150, "author": "Bob"},
        ]
    }
```

## Settings Management

### Get Settings

```python
def get_settings() -> Dict[str, Any]:
    """Get current application settings."""
    # Load from file or return defaults
    return {
        "input_fstrs": [],
        "n_files": 100,
        "file_formats": ["json"],
        "processes": 1,
        "legacy_engine": False,
        "ex_files": [],
        "extensions": [".py", ".js", ".ts"]
    }
```

### Save Settings

```python
def save_settings(settings: Settings) -> bool:
    """Save application settings."""
    try:
        # Save settings to file or database
        settings_dict = {
            "input_fstrs": settings.input_fstrs,
            "n_files": settings.n_files,
            "file_formats": settings.file_formats,
            "processes": settings.processes,
            "legacy_engine": settings.legacy_engine
        }

        # Your save logic here
        logging.info("Settings saved successfully")
        return True

    except Exception as e:
        logging.error(f"Failed to save settings: {e}")
        return False
```

## Engine Information

```python
def get_engine_info() -> Dict[str, Any]:
    """Get information about the analysis engine capabilities."""
    return {
        "engine_version": "2.1.0",
        "supported_formats": ["json", "xml", "html", "csv"],
        "legacy_engine_available": True,
        "features": {
            "blame_analysis": True,
            "rename_detection": True,
            "multi_threading": True,
            "large_repository_support": True
        },
        "git_version": "2.40.0",
        "python_version": "3.13.0"
    }
```

## Error Handling Examples

### Custom Exception Classes

```python
class AnalysisError(Exception):
    """Raised when analysis fails."""
    pass

class ValidationError(Exception):
    """Raised when input validation fails."""
    pass

class RepositoryError(Exception):
    """Raised when repository access fails."""
    pass
```

### Robust Error Handling

```python
def execute_analysis(settings: Settings) -> Dict[str, Any]:
    """Execute analysis with comprehensive error handling."""
    try:
        # Validate inputs
        if not settings.input_fstrs:
            raise ValidationError("No repositories specified")

        # Check repository access
        for repo_path in settings.input_fstrs:
            if not os.path.exists(repo_path):
                raise RepositoryError(f"Repository not found: {repo_path}")

            if not os.path.isdir(os.path.join(repo_path, ".git")):
                raise RepositoryError(f"Not a git repository: {repo_path}")

        # Perform analysis
        return perform_git_analysis(settings)

    except ValidationError as e:
        logging.error(f"Validation error: {e}")
        raise
    except RepositoryError as e:
        logging.error(f"Repository error: {e}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error during analysis: {e}")
        raise AnalysisError(f"Analysis execution failed: {e}")
```

## Testing Your Functions

### Unit Testing

```python
# test_analysis.py
import pytest
from gigui.analysis import execute_analysis, get_settings, save_settings, Settings

def test_execute_analysis_basic():
    """Test basic analysis functionality."""
    settings = Settings(
        input_fstrs=["/path/to/test/repo"],
        n_files=10
    )

    result = execute_analysis(settings)

    assert "repositories" in result
    assert "summary" in result
    assert len(result["repositories"]) == 1
    assert result["summary"]["total_repositories"] == 1

def test_settings_management():
    """Test settings get/save functionality."""
    # Test get settings
    settings_dict = get_settings()
    assert isinstance(settings_dict, dict)
    assert "n_files" in settings_dict

    # Test save settings
    settings = Settings(input_fstrs=["/test"], n_files=50)
    success = save_settings(settings)
    assert success is True

def test_error_handling():
    """Test error handling for invalid inputs."""
    settings = Settings(input_fstrs=[])  # Empty repositories

    with pytest.raises(ValidationError):
        execute_analysis(settings)

if __name__ == "__main__":
    pytest.main([__file__])
```

### Integration Testing

```python
# test_integration.py
def test_complete_workflow():
    """Test complete analysis workflow."""
    # Create test repository
    test_repo = create_test_repository()

    try:
        # Configure settings
        settings = Settings(
            input_fstrs=[test_repo],
            n_files=100,
            file_formats=["json"]
        )

        # Execute analysis
        result = execute_analysis(settings)

        # Verify results
        assert result["repositories"]
        assert result["summary"]["total_repositories"] > 0

        # Test settings persistence
        save_success = save_settings(settings)
        assert save_success

        loaded_settings = get_settings()
        assert loaded_settings["n_files"] == 100

    finally:
        # Cleanup test repository
        cleanup_test_repository(test_repo)
```

## Advanced Examples

### Large Repository Handling

```python
def execute_analysis_large_repo(settings: Settings) -> Dict[str, Any]:
    """Handle large repositories with progress tracking."""
    total_repos = len(settings.input_fstrs)
    results = []

    for i, repo_path in enumerate(settings.input_fstrs):
        logging.info(f"Processing repository {i+1}/{total_repos}: {repo_path}")

        # Process in chunks for large repositories
        if is_large_repository(repo_path):
            repo_data = analyze_large_repository(repo_path, settings)
        else:
            repo_data = analyze_single_repository(repo_path, settings)

        results.append(repo_data)

        # Progress callback (if needed)
        progress = (i + 1) / total_repos * 100
        logging.info(f"Progress: {progress:.1f}%")

    return format_analysis_results(results)
```

### Parallel Processing

```python
from concurrent.futures import ThreadPoolExecutor
import multiprocessing

def execute_analysis_parallel(settings: Settings) -> Dict[str, Any]:
    """Execute analysis with parallel processing."""
    max_workers = min(settings.processes, multiprocessing.cpu_count())

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all repository analysis tasks
        futures = {
            executor.submit(analyze_single_repository, repo_path, settings): repo_path
            for repo_path in settings.input_fstrs
        }

        results = []
        for future in futures:
            try:
                repo_data = future.result(timeout=300)  # 5 minute timeout
                results.append(repo_data)
            except Exception as e:
                repo_path = futures[future]
                logging.error(f"Failed to analyze {repo_path}: {e}")
                raise AnalysisError(f"Parallel analysis failed for {repo_path}: {e}")

    return format_analysis_results(results)
```

## Debugging and Logging

### Comprehensive Logging

```python
import logging
import sys

def setup_logging():
    """Configure logging for analysis functions."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('analysis.log')
        ]
    )

def execute_analysis_with_logging(settings: Settings) -> Dict[str, Any]:
    """Execute analysis with detailed logging."""
    setup_logging()
    logger = logging.getLogger(__name__)

    logger.info(f"Starting analysis with settings: {settings}")
    logger.info(f"Repositories to analyze: {len(settings.input_fstrs)}")

    start_time = time.time()

    try:
        results = []
        for repo_path in settings.input_fstrs:
            logger.info(f"Analyzing repository: {repo_path}")
            repo_start = time.time()

            repo_data = analyze_single_repository(repo_path, settings)

            repo_duration = time.time() - repo_start
            logger.info(f"Repository {repo_path} analyzed in {repo_duration:.2f}s")

            results.append(repo_data)

        total_duration = time.time() - start_time
        logger.info(f"Analysis completed in {total_duration:.2f}s")

        return format_analysis_results(results)

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise
```

## Module Organization

### Complete Module Structure

```python
# gigui/analysis/__init__.py
"""GitInspectorGUI Analysis Engine - PyO3 Integration."""

from .main import execute_analysis, get_settings, save_settings, get_engine_info
from .exceptions import AnalysisError, ValidationError, RepositoryError

__all__ = [
    'execute_analysis',
    'get_settings',
    'save_settings',
    'get_engine_info',
    'AnalysisError',
    'ValidationError',
    'RepositoryError'
]

# gigui/analysis/main.py
"""Main analysis functions called by PyO3."""

from .core import GitAnalyzer
from .settings import SettingsManager
from .exceptions import AnalysisError, ValidationError, RepositoryError

# All the functions shown above...

# gigui/analysis/core.py
"""Core git analysis functionality."""

class GitAnalyzer:
    """Git repository analysis engine."""

    def __init__(self, settings):
        self.settings = settings

    def analyze_repository(self, repo_path):
        """Analyze a single repository."""
        # Implementation details...
        pass

# gigui/analysis/settings.py
"""Settings management."""

class SettingsManager:
    """Manage application settings."""

    @staticmethod
    def load_settings():
        """Load settings from storage."""
        pass

    @staticmethod
    def save_settings(settings):
        """Save settings to storage."""
        pass
```

This PyO3 integration approach provides direct function calls without any network overhead, making the application faster and simpler to deploy.
