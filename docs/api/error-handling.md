# PyO3 Error Handling

Error handling patterns for GitInspectorGUI PyO3 Python integration.

## Overview

With PyO3 integration, errors are handled through native Python exceptions that are automatically converted to Rust error types. No HTTP status codes or network errors are involved - this is direct function call error handling within a single process.

**Error Flow**: Python exceptions are automatically converted to Rust error types by PyO3. For architecture details, see [PyO3 Integration](../architecture/design-decisions.md).

## Error Types

### Python Exception Classes

| Exception Class      | Purpose                    | When Raised                    |
| -------------------- | -------------------------- | ------------------------------ |
| `AnalysisError`      | Analysis execution failure | Git operations fail            |
| `ValidationError`    | Input validation failure   | Invalid settings or parameters |
| `RepositoryError`    | Repository access failure  | Git repository not found       |
| `ConfigurationError` | Configuration issues       | Invalid configuration data     |

### PyO3 Error Conversion

PyO3 automatically converts Python exceptions to Rust `PyErr` types:

```rust
// Rust side - PyO3 handles conversion automatically
fn call_python_analysis() -> PyResult<AnalysisResult> {
    Python::with_gil(|py| {
        let analysis_module = py.import("gigui.analysis")?;
        let result = analysis_module.getattr("execute_analysis")?.call1((settings,))?;
        result.extract::<AnalysisResult>()
    })
}
```

## Python Exception Implementation

### Custom Exception Classes

```python
# gigui/analysis/exceptions.py

class AnalysisError(Exception):
    """Raised when analysis execution fails."""

    def __init__(self, message: str, repository_path: str = None):
        self.message = message
        self.repository_path = repository_path
        super().__init__(self.message)

class ValidationError(Exception):
    """Raised when input validation fails."""

    def __init__(self, message: str, field: str = None, value=None):
        self.message = message
        self.field = field
        self.value = value
        super().__init__(self.message)

class RepositoryError(Exception):
    """Raised when repository access fails."""

    def __init__(self, message: str, repository_path: str = None):
        self.message = message
        self.repository_path = repository_path
        super().__init__(self.message)

class ConfigurationError(Exception):
    """Raised when configuration is invalid."""

    def __init__(self, message: str, config_key: str = None):
        self.message = message
        self.config_key = config_key
        super().__init__(self.message)
```

## Error Handling Patterns

### Input Validation

```python
def execute_analysis(settings: Settings) -> Dict[str, Any]:
    """Execute analysis with comprehensive input validation."""

    # Validate required fields
    if not settings.input_fstrs:
        raise ValidationError(
            "No repositories specified",
            field="input_fstrs",
            value=settings.input_fstrs
        )

    if settings.n_files <= 0:
        raise ValidationError(
            "Number of files must be positive",
            field="n_files",
            value=settings.n_files
        )

    # Validate file extensions
    if settings.extensions:
        for ext in settings.extensions:
            if not ext.startswith('.'):
                raise ValidationError(
                    f"File extension must start with '.': {ext}",
                    field="extensions",
                    value=ext
                )

    # Continue with analysis...
    return perform_analysis(settings)
```

### Repository Access Validation

```python
import os
import subprocess

def validate_repository(repo_path: str) -> None:
    """Validate repository access and git status."""

    # Check if path exists
    if not os.path.exists(repo_path):
        raise RepositoryError(
            f"Repository path does not exist: {repo_path}",
            repository_path=repo_path
        )

    # Check if it's a directory
    if not os.path.isdir(repo_path):
        raise RepositoryError(
            f"Repository path is not a directory: {repo_path}",
            repository_path=repo_path
        )

    # Check if it's a git repository
    git_dir = os.path.join(repo_path, '.git')
    if not os.path.exists(git_dir):
        raise RepositoryError(
            f"Not a git repository (no .git directory): {repo_path}",
            repository_path=repo_path
        )

    # Check if git is accessible
    try:
        result = subprocess.run(
            ['git', 'status'],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode != 0:
            raise RepositoryError(
                f"Git repository is corrupted or inaccessible: {repo_path}",
                repository_path=repo_path
            )
    except subprocess.TimeoutExpired:
        raise RepositoryError(
            f"Git operation timed out for repository: {repo_path}",
            repository_path=repo_path
        )
    except FileNotFoundError:
        raise ConfigurationError(
            "Git command not found. Please ensure Git is installed and in PATH."
        )
```

### Analysis Error Handling

```python
def analyze_single_repository(repo_path: str, settings: Settings) -> Dict[str, Any]:
    """Analyze repository with comprehensive error handling."""

    try:
        # Validate repository first
        validate_repository(repo_path)

        # Perform git operations
        commits = get_commit_history(repo_path)
        authors = analyze_authors(repo_path, commits)
        files = analyze_files(repo_path, settings)

        return {
            "name": os.path.basename(repo_path),
            "path": repo_path,
            "commits": commits,
            "authors": authors,
            "files": files
        }

    except RepositoryError:
        # Re-raise repository errors as-is
        raise
    except subprocess.CalledProcessError as e:
        raise AnalysisError(
            f"Git command failed: {e.cmd} (exit code {e.returncode})",
            repository_path=repo_path
        )
    except PermissionError:
        raise RepositoryError(
            f"Permission denied accessing repository: {repo_path}",
            repository_path=repo_path
        )
    except Exception as e:
        raise AnalysisError(
            f"Unexpected error during analysis: {str(e)}",
            repository_path=repo_path
        )
```

## Error Recovery Strategies

### Retry Logic

```python
import time
from typing import Callable, Any

def retry_on_failure(
    func: Callable,
    max_retries: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0
) -> Any:
    """Retry function execution on failure with exponential backoff."""

    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return func()
        except (AnalysisError, RepositoryError) as e:
            last_exception = e

            if attempt == max_retries:
                # Final attempt failed
                break

            # Wait before retry with exponential backoff
            wait_time = delay * (backoff_factor ** attempt)
            logging.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time:.1f}s...")
            time.sleep(wait_time)

    # All retries exhausted
    raise AnalysisError(f"Operation failed after {max_retries + 1} attempts: {last_exception}")

def robust_git_operation(repo_path: str, git_command: list) -> str:
    """Execute git command with retry logic."""

    def execute_command():
        result = subprocess.run(
            git_command,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode != 0:
            raise AnalysisError(f"Git command failed: {' '.join(git_command)}")
        return result.stdout

    return retry_on_failure(execute_command, max_retries=2)
```

### Partial Failure Handling

```python
def execute_analysis_with_partial_failures(settings: Settings) -> Dict[str, Any]:
    """Execute analysis allowing partial failures."""

    successful_results = []
    failed_repositories = []

    for repo_path in settings.input_fstrs:
        try:
            repo_data = analyze_single_repository(repo_path, settings)
            successful_results.append(repo_data)

        except RepositoryError as e:
            logging.error(f"Repository error for {repo_path}: {e}")
            failed_repositories.append({
                "path": repo_path,
                "error": str(e),
                "error_type": "repository_error"
            })

        except AnalysisError as e:
            logging.error(f"Analysis error for {repo_path}: {e}")
            failed_repositories.append({
                "path": repo_path,
                "error": str(e),
                "error_type": "analysis_error"
            })

    # Return results even if some repositories failed
    return {
        "repositories": successful_results,
        "failed_repositories": failed_repositories,
        "summary": {
            "total_requested": len(settings.input_fstrs),
            "successful": len(successful_results),
            "failed": len(failed_repositories),
            "success_rate": len(successful_results) / len(settings.input_fstrs) * 100
        }
    }
```

## Logging and Debugging

### Structured Error Logging

```python
import logging
import traceback
from datetime import datetime

def setup_error_logging():
    """Configure structured error logging."""

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('analysis_errors.log')
        ]
    )

def log_error_details(error: Exception, context: dict = None):
    """Log detailed error information."""

    error_info = {
        "timestamp": datetime.now().isoformat(),
        "error_type": type(error).__name__,
        "error_message": str(error),
        "traceback": traceback.format_exc(),
        "context": context or {}
    }

    # Add custom error attributes if available
    if hasattr(error, 'repository_path'):
        error_info["repository_path"] = error.repository_path
    if hasattr(error, 'field'):
        error_info["validation_field"] = error.field
    if hasattr(error, 'value'):
        error_info["validation_value"] = error.value

    logging.error(f"Analysis error: {error_info}")

def execute_analysis_with_logging(settings: Settings) -> Dict[str, Any]:
    """Execute analysis with comprehensive error logging."""

    setup_error_logging()

    try:
        return execute_analysis(settings)

    except ValidationError as e:
        log_error_details(e, {"settings": settings.__dict__})
        raise

    except RepositoryError as e:
        log_error_details(e, {"settings": settings.__dict__})
        raise

    except AnalysisError as e:
        log_error_details(e, {"settings": settings.__dict__})
        raise

    except Exception as e:
        log_error_details(e, {"settings": settings.__dict__})
        raise AnalysisError(f"Unexpected error: {str(e)}")
```

## Error Testing

### Unit Tests for Error Conditions

```python
import pytest
import tempfile
import os

def test_validation_errors():
    """Test validation error handling."""

    # Test empty repositories
    with pytest.raises(ValidationError) as exc_info:
        execute_analysis(Settings(input_fstrs=[]))
    assert "No repositories specified" in str(exc_info.value)

    # Test invalid n_files
    with pytest.raises(ValidationError) as exc_info:
        execute_analysis(Settings(input_fstrs=["/test"], n_files=0))
    assert "must be positive" in str(exc_info.value)

def test_repository_errors():
    """Test repository error handling."""

    # Test non-existent repository
    with pytest.raises(RepositoryError) as exc_info:
        validate_repository("/non/existent/path")
    assert "does not exist" in str(exc_info.value)

    # Test non-git directory
    with tempfile.TemporaryDirectory() as temp_dir:
        with pytest.raises(RepositoryError) as exc_info:
            validate_repository(temp_dir)
        assert "Not a git repository" in str(exc_info.value)

def test_analysis_errors():
    """Test analysis error handling."""

    # Test with corrupted repository
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create fake .git directory
        os.makedirs(os.path.join(temp_dir, ".git"))

        with pytest.raises(RepositoryError) as exc_info:
            validate_repository(temp_dir)
        assert "corrupted or inaccessible" in str(exc_info.value)
```

## Best Practices

### Error Handling Guidelines

1. **Use specific exception types** for different error categories
2. **Include context information** in error messages (repository path, field name, etc.)
3. **Log errors with structured data** for debugging
4. **Implement retry logic** for transient failures
5. **Handle partial failures gracefully** when processing multiple repositories
6. **Validate inputs early** to catch errors before expensive operations
7. **Provide clear error messages** that help users understand what went wrong

### Error Message Guidelines

```python
# Good: Specific and actionable
raise RepositoryError(
    f"Repository not found: {repo_path}. Please check the path and try again.",
    repository_path=repo_path
)

# Bad: Vague and unhelpful
raise Exception("Something went wrong")

# Good: Include context and suggestions
raise ValidationError(
    f"Invalid file extension '{ext}'. Extensions must start with '.' (e.g., '.py', '.js')",
    field="extensions",
    value=ext
)

# Bad: No context or guidance
raise ValidationError("Invalid extension")
```

This PyO3 error handling approach provides robust error management with native Python exceptions that are automatically converted to Rust error types, eliminating the complexity of HTTP status codes and network error handling.
