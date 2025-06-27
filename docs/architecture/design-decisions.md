# Architecture Design Decisions

## IPC Evolution: stdout → HTTP → PyO3 Direct Integration

### Previous Issues with stdout Communication

-   **Fragile JSON parsing** - Any print/log statements broke communication
-   **Mixed output streams** - Data and logs interfered with each other
-   **Limited error handling** - Only stderr available for errors
-   **Debugging conflicts** - Logging disabled JSON parsing

### Previous Issues with HTTP Architecture

-   **Network overhead** - HTTP serialization/deserialization costs
-   **Process management** - Separate server process complexity
-   **Error boundary** - HTTP status codes vs native exceptions
-   **Development complexity** - Multiple processes to coordinate

### Current PyO3 Direct Integration

```mermaid
graph TB
    A[Tauri Frontend] -->|invoke()| B[Tauri Rust Backend]
    B -->|Direct calls| C[PyO3 Bindings]
    C -->|Python functions| D[Python Analysis Engine]
    D -->|Native objects| C
    C -->|Rust types| B
    B -->|JSON| A

    E[Python Logs] --> F[Integrated Logging]
    D --> E
```

## PyO3 Direct Integration Architecture

### Key Benefits

#### Performance

-   **Zero IPC overhead** - Direct function calls between Rust and Python
-   **Native memory access** - No serialization between Rust and Python
-   **Embedded interpreter** - Python runs within the same process
-   **Type-safe conversion** - Automatic Python ↔ Rust type conversion

#### Development

-   **Single process** - Simplified debugging and development
-   **Integrated logging** - Python logging works seamlessly with Rust
-   **Native error handling** - PyResult<T> and PyErr for proper error propagation
-   **Hot reload** - Frontend changes don't require backend restart

#### Deployment

-   **Single executable** - No separate server process to manage
-   **Simplified distribution** - Embedded Python interpreter
-   **Cross-platform consistency** - Same architecture on all platforms
-   **Reduced attack surface** - No network communication required

## Implementation

### PyO3 Integration (Rust)

```rust
use pyo3::prelude::*;
use pyo3::types::PyDict;

#[pyfunction]
fn execute_analysis(settings: Settings) -> PyResult<AnalysisResult> {
    Python::with_gil(|py| {
        // Import Python analysis module
        let analysis_module = py.import("gigui.analysis")?;

        // Convert Rust settings to Python object
        let py_settings = settings.to_python(py)?;

        // Call Python function directly
        let result = analysis_module
            .getattr("execute_analysis")?
            .call1((py_settings,))?;

        // Convert Python result back to Rust
        result.extract::<AnalysisResult>()
    })
}

#[tauri::command]
pub async fn execute_analysis_command(settings: Settings) -> Result<AnalysisResult, String> {
    execute_analysis(settings)
        .map_err(|e| format!("Analysis failed: {}", e))
}
```

### Python Analysis Engine

```python
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class Settings(BaseModel):
    input_fstrs: List[str]
    n_files: int
    exclude_patterns: Optional[List[str]] = None

class AnalysisResult(BaseModel):
    files: List[dict]
    authors: List[dict]
    blame_data: dict
    performance_stats: dict

def execute_analysis(settings: Settings) -> AnalysisResult:
    """
    Main analysis function called directly from Rust via PyO3.

    Args:
        settings: Analysis configuration

    Returns:
        AnalysisResult: Complete analysis results

    Raises:
        ValueError: Invalid settings or repository
        RuntimeError: Git operation failures
    """
    try:
        logger.info(f"Starting analysis with {len(settings.input_fstrs)} repositories")

        # Perform git analysis
        api = GitInspectorAPI()
        result = api.execute_analysis(settings)

        logger.info("Analysis completed successfully")
        return result

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise RuntimeError(f"Analysis execution failed: {e}") from e
```

### Tauri Frontend Integration

```typescript
import { invoke } from "@tauri-apps/api/core";

interface Settings {
    input_fstrs: string[];
    n_files: number;
    exclude_patterns?: string[];
}

interface AnalysisResult {
    files: any[];
    authors: any[];
    blame_data: any;
    performance_stats: any;
}

export async function executeAnalysis(
    settings: Settings
): Promise<AnalysisResult> {
    try {
        const result = await invoke<AnalysisResult>(
            "execute_analysis_command",
            {
                settings,
            }
        );
        return result;
    } catch (error) {
        console.error("Analysis failed:", error);
        throw new Error(`Analysis failed: ${error}`);
    }
}
```

## Error Handling

### PyO3 Error Propagation

```rust
use pyo3::exceptions::PyRuntimeError;

#[pyfunction]
fn execute_analysis(settings: Settings) -> PyResult<AnalysisResult> {
    Python::with_gil(|py| {
        match perform_analysis(py, settings) {
            Ok(result) => Ok(result),
            Err(e) => {
                // Convert Rust errors to Python exceptions
                Err(PyRuntimeError::new_err(format!("Analysis failed: {}", e)))
            }
        }
    })
}

// Error conversion from Python to Rust
impl From<PyErr> for AnalysisError {
    fn from(err: PyErr) -> Self {
        AnalysisError::PythonError(err.to_string())
    }
}
```

### Python Exception Handling

```python
class AnalysisError(Exception):
    """Base exception for analysis operations."""
    pass

class RepositoryError(AnalysisError):
    """Repository access or validation errors."""
    pass

class GitOperationError(AnalysisError):
    """Git command execution errors."""
    pass

def execute_analysis(settings: Settings) -> AnalysisResult:
    try:
        # Validate repository access
        if not validate_repositories(settings.input_fstrs):
            raise RepositoryError("Invalid or inaccessible repositories")

        # Perform analysis
        return perform_git_analysis(settings)

    except GitOperationError as e:
        logger.error(f"Git operation failed: {e}")
        raise  # Re-raise for PyO3 to handle

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise AnalysisError(f"Analysis failed: {e}") from e
```

## Type Safety and Conversion

### Rust ↔ Python Type Mapping

```rust
use pyo3::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[pyclass]
pub struct Settings {
    #[pyo3(get, set)]
    pub input_fstrs: Vec<String>,

    #[pyo3(get, set)]
    pub n_files: usize,

    #[pyo3(get, set)]
    pub exclude_patterns: Option<Vec<String>>,
}

#[pymethods]
impl Settings {
    #[new]
    fn new(input_fstrs: Vec<String>, n_files: usize, exclude_patterns: Option<Vec<String>>) -> Self {
        Settings {
            input_fstrs,
            n_files,
            exclude_patterns,
        }
    }

    fn __repr__(&self) -> String {
        format!("Settings(input_fstrs={:?}, n_files={})", self.input_fstrs, self.n_files)
    }
}

// Automatic conversion traits
impl FromPyObject<'_> for Settings {
    fn extract(obj: &PyAny) -> PyResult<Self> {
        Ok(Settings {
            input_fstrs: obj.getattr("input_fstrs")?.extract()?,
            n_files: obj.getattr("n_files")?.extract()?,
            exclude_patterns: obj.getattr("exclude_patterns")?.extract()?,
        })
    }
}
```

### GIL Management

```rust
use pyo3::prelude::*;

// Efficient GIL usage patterns
fn batch_analysis(repositories: Vec<String>) -> PyResult<Vec<AnalysisResult>> {
    Python::with_gil(|py| {
        let analysis_module = py.import("gigui.analysis")?;
        let mut results = Vec::new();

        for repo in repositories {
            // GIL is held for the entire batch
            let result = analysis_module
                .getattr("analyze_repository")?
                .call1((repo,))?
                .extract::<AnalysisResult>()?;
            results.push(result);
        }

        Ok(results)
    })
}

// For long-running operations, consider releasing GIL
fn long_running_analysis() -> PyResult<AnalysisResult> {
    Python::with_gil(|py| {
        let analysis_module = py.import("gigui.analysis")?;

        // Release GIL for CPU-intensive work
        py.allow_threads(|| {
            // Perform non-Python work here
            std::thread::sleep(std::time::Duration::from_secs(1));
        });

        // Re-acquire GIL for Python operations
        let result = analysis_module
            .getattr("execute_analysis")?
            .call0()?
            .extract::<AnalysisResult>()?;

        Ok(result)
    })
}
```

## Performance Considerations

### Memory Management

```rust
use pyo3::prelude::*;

// Efficient Python object handling
fn process_large_dataset(data: Vec<String>) -> PyResult<Vec<ProcessedData>> {
    Python::with_gil(|py| {
        let processor = py.import("gigui.processor")?;
        let mut results = Vec::with_capacity(data.len());

        for item in data {
            // Create Python string efficiently
            let py_item = PyString::new(py, &item);

            // Process and extract result
            let result = processor
                .getattr("process_item")?
                .call1((py_item,))?
                .extract::<ProcessedData>()?;

            results.push(result);

            // Python objects are automatically cleaned up
            // when they go out of scope
        }

        Ok(results)
    })
}
```

### Async Integration

```rust
use tokio;
use pyo3::prelude::*;

#[tauri::command]
pub async fn async_analysis(settings: Settings) -> Result<AnalysisResult, String> {
    // Run PyO3 code in blocking thread pool
    let result = tokio::task::spawn_blocking(move || {
        execute_analysis(settings)
    }).await;

    match result {
        Ok(Ok(analysis_result)) => Ok(analysis_result),
        Ok(Err(py_err)) => Err(format!("Python error: {}", py_err)),
        Err(join_err) => Err(format!("Task error: {}", join_err)),
    }
}
```

## Testing Strategy

### Unit Testing Python Functions

```python
import pytest
from gigui.analysis import execute_analysis, Settings

def test_execute_analysis_basic():
    """Test basic analysis functionality."""
    settings = Settings(
        input_fstrs=["."],
        n_files=10
    )

    result = execute_analysis(settings)

    assert result.files is not None
    assert result.authors is not None
    assert len(result.files) <= 10

def test_execute_analysis_error_handling():
    """Test error handling for invalid repositories."""
    settings = Settings(
        input_fstrs=["/nonexistent/path"],
        n_files=10
    )

    with pytest.raises(RepositoryError):
        execute_analysis(settings)
```

### Integration Testing PyO3

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use pyo3::prepare_freethreaded_python;

    #[test]
    fn test_pyo3_integration() {
        prepare_freethreaded_python();

        let settings = Settings {
            input_fstrs: vec![".".to_string()],
            n_files: 5,
            exclude_patterns: None,
        };

        let result = execute_analysis(settings);
        assert!(result.is_ok());

        let analysis_result = result.unwrap();
        assert!(!analysis_result.files.is_empty());
    }

    #[test]
    fn test_error_propagation() {
        prepare_freethreaded_python();

        let settings = Settings {
            input_fstrs: vec!["/nonexistent".to_string()],
            n_files: 5,
            exclude_patterns: None,
        };

        let result = execute_analysis(settings);
        assert!(result.is_err());
    }
}
```

## Migration Benefits

### From HTTP to PyO3

| Aspect             | HTTP Architecture              | PyO3 Architecture            |
| ------------------ | ------------------------------ | ---------------------------- |
| **Performance**    | Network serialization overhead | Direct function calls        |
| **Error Handling** | HTTP status codes + JSON       | Native PyResult<T> and PyErr |
| **Development**    | Multiple processes to debug    | Single process debugging     |
| **Deployment**     | Server + client coordination   | Single executable            |
| **Type Safety**    | JSON schema validation         | Compile-time type checking   |
| **Memory Usage**   | Separate process overhead      | Shared memory space          |
| **Startup Time**   | Server startup + connection    | Embedded interpreter         |
| **Testing**        | HTTP mocking required          | Direct function testing      |

### Architectural Advantages

1. **Simplified Architecture**: Single process eliminates IPC complexity
2. **Better Performance**: Zero network overhead with direct function calls
3. **Type Safety**: Compile-time guarantees for Python-Rust interface
4. **Easier Debugging**: All components in same process with integrated logging
5. **Reduced Dependencies**: No HTTP server framework required
6. **Better Error Handling**: Native exception propagation vs HTTP error codes

## Future Extensions

### Potential Enhancements

-   **Async Python Support**: Integration with Python asyncio
-   **Parallel Processing**: Multi-threaded analysis with GIL management
-   **Plugin System**: Dynamic Python module loading
-   **Performance Monitoring**: PyO3-specific metrics and profiling
-   **Memory Optimization**: Advanced Python object lifecycle management

### Scalability Considerations

-   **Large Repositories**: Streaming analysis results
-   **Memory Management**: Efficient Python object cleanup
-   **GIL Optimization**: Strategic GIL release for CPU-intensive operations
-   **Error Recovery**: Robust error handling for long-running operations

## Summary

PyO3 direct integration provides a robust, high-performance architecture that eliminates the complexity of HTTP-based IPC while maintaining type safety and excellent error handling. The embedded Python approach simplifies deployment and development while providing better performance than network-based communication.

Key advantages:

-   **Zero IPC overhead** with direct function calls
-   **Native error propagation** via PyResult<T> and PyErr
-   **Single process simplicity** for development and deployment
-   **Type-safe integration** between Rust and Python
-   **Integrated logging and debugging** capabilities

This architecture provides a solid foundation for future enhancements while maintaining the flexibility and power of the Python analysis engine.
