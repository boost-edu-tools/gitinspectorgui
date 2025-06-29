# Architecture Design Decisions

## IPC Evolution: stdout → HTTP → Plugin-Based Integration

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

### Current Plugin-Based Integration

```mermaid
graph TB
    A[Tauri Frontend] -->|callFunction()| B[tauri-plugin-python API]
    B -->|Plugin calls| C[Tauri Plugin]
    C -->|PyO3 bindings| D[Python Analysis Engine]
    D -->|Native objects| C
    C -->|Rust types| B
    B -->|JSON| A

    E[Python Logs] --> F[Integrated Logging]
    D --> E
```

## Plugin-Based Architecture

### Key Benefits

#### Performance

-   **Zero IPC overhead** - Direct function calls through plugin layer
-   **Native memory access** - No serialization between components
-   **Embedded interpreter** - Python runs within the same process via PyO3
-   **Type-safe conversion** - Automatic Python ↔ Rust type conversion

#### Development

-   **Single process** - Simplified debugging and development
-   **Integrated logging** - Python logging works seamlessly with Rust
-   **Plugin error handling** - Automatic error conversion and propagation
-   **Hot reload** - Frontend changes don't require backend restart

#### Deployment

-   **Single executable** - No separate server process to manage
-   **Simplified distribution** - Embedded Python interpreter
-   **Cross-platform consistency** - Same architecture on all platforms
-   **Reduced attack surface** - No network communication required

## Implementation

### Plugin Integration (Rust)

```rust
use tauri_plugin_python::{init_and_register, PythonExt};

fn main() {
    tauri::Builder::default()
        .plugin(init_and_register(vec![
            "health_check".into(),
            "get_engine_info".into(),
            "execute_analysis".into(),
            "get_settings".into(),
            "save_settings".into(),
            "get_blame_data".into(),
        ]))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Python Entry Point

```python
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
    return {"status": "healthy", "message": "Python backend is running"}

def get_engine_info():
    """Get information about the analysis engine."""
    return {
        "name": "GitInspectorGUI Analysis Engine",
        "version": "1.0.0",
        "backend": "tauri-plugin-python"
    }

def execute_analysis(settings_json):
    """Execute repository analysis."""
    try:
        settings = json.loads(settings_json)
        logger.info(f"Starting analysis with settings: {settings}")

        result = api.execute_analysis(settings)
        logger.info("Analysis completed successfully")

        return json.dumps(result)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise

def get_settings():
    """Get current analysis settings."""
    try:
        settings = api.get_settings()
        return json.dumps(settings)
    except Exception as e:
        logger.error(f"Failed to get settings: {e}")
        raise

def save_settings(settings_json):
    """Save analysis settings."""
    try:
        settings = json.loads(settings_json)
        api.save_settings(settings)
        return json.dumps({"status": "success"})
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        raise

def get_blame_data(settings_json):
    """Get blame data for repositories."""
    try:
        settings = json.loads(settings_json)
        result = api.get_blame_data(settings)
        return json.dumps(result)
    except Exception as e:
        logger.error(f"Failed to get blame data: {e}")
        raise

# Register functions with the plugin
_tauri_plugin_functions = [
    health_check,
    get_engine_info,
    execute_analysis,
    get_settings,
    save_settings,
    get_blame_data,
]
```

### Frontend Integration

```typescript
import { callFunction } from "tauri-plugin-python-api";

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
        const settingsJson = JSON.stringify(settings);
        const resultJson = await callFunction("execute_analysis", [settingsJson]);
        return JSON.parse(resultJson);
    } catch (error) {
        console.error("Analysis failed:", error);
        throw new Error(`Analysis failed: ${error}`);
    }
}

export async function healthCheck(): Promise<any> {
    try {
        return await callFunction("health_check", []);
    } catch (error) {
        console.error("Health check failed:", error);
        throw new Error(`Health check failed: ${error}`);
    }
}

export async function getEngineInfo(): Promise<any> {
    try {
        return await callFunction("get_engine_info", []);
    } catch (error) {
        console.error("Failed to get engine info:", error);
        throw new Error(`Failed to get engine info: ${error}`);
    }
}
```

## Error Handling

### Plugin Error Propagation

The tauri-plugin-python automatically handles error conversion between Python exceptions and JavaScript errors:

```python
def execute_analysis(settings_json):
    """Execute repository analysis with proper error handling."""
    try:
        settings = json.loads(settings_json)

        # Validate repository access
        if not validate_repositories(settings.get('input_fstrs', [])):
            raise ValueError("Invalid or inaccessible repositories")

        # Perform analysis
        return json.dumps(perform_git_analysis(settings))

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON settings: {e}")
        raise ValueError(f"Invalid settings format: {e}")

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise RuntimeError(f"Analysis execution failed: {e}")
```

### Frontend Error Handling

```typescript
export async function executeAnalysis(settings: Settings): Promise<AnalysisResult> {
    try {
        const settingsJson = JSON.stringify(settings);
        const resultJson = await callFunction("execute_analysis", [settingsJson]);
        return JSON.parse(resultJson);
    } catch (error) {
        // Plugin automatically converts Python exceptions to JavaScript errors
        if (error instanceof Error) {
            if (error.message.includes("Invalid or inaccessible repositories")) {
                throw new Error("Repository validation failed. Please check your repository paths.");
            }
            if (error.message.includes("Invalid settings format")) {
                throw new Error("Settings validation failed. Please check your configuration.");
            }
        }
        throw new Error(`Analysis failed: ${error}`);
    }
}
```

## Type Safety and Conversion

### JSON-Based Communication

The plugin uses JSON for type-safe communication between frontend and Python:

```python
from pydantic import BaseModel
from typing import List, Optional
import json

class Settings(BaseModel):
    input_fstrs: List[str]
    n_files: int
    exclude_patterns: Optional[List[str]] = None

class AnalysisResult(BaseModel):
    files: List[dict]
    authors: List[dict]
    blame_data: dict
    performance_stats: dict

def execute_analysis(settings_json: str) -> str:
    """Type-safe analysis execution with JSON serialization."""
    # Parse and validate input
    settings_dict = json.loads(settings_json)
    settings = Settings(**settings_dict)

    # Perform analysis
    result = perform_git_analysis(settings)

    # Validate and serialize output
    analysis_result = AnalysisResult(**result)
    return analysis_result.model_dump_json()
```

### TypeScript Type Definitions

```typescript
interface EngineInfo {
    name: string;
    version: string;
    backend: string;
}

interface HealthStatus {
    status: "healthy" | "error";
    message: string;
}

interface Settings {
    input_fstrs: string[];
    n_files: number;
    exclude_patterns?: string[];
}

interface AnalysisResult {
    files: FileData[];
    authors: AuthorData[];
    blame_data: BlameData;
    performance_stats: PerformanceStats;
}
```

## Performance Considerations

### Plugin Overhead

The tauri-plugin-python provides minimal overhead while maintaining the performance benefits of PyO3:

```python
def batch_analysis(repositories: List[str]) -> str:
    """Efficient batch processing through plugin."""
    results = []

    for repo in repositories:
        try:
            # Each repository analysis is optimized
            result = analyze_single_repository(repo)
            results.append(result)
        except Exception as e:
            logger.warning(f"Skipping repository {repo}: {e}")
            continue

    return json.dumps({"results": results, "processed": len(results)})
```

### Memory Management

```python
import gc
import logging

def execute_analysis(settings_json: str) -> str:
    """Memory-efficient analysis execution."""
    try:
        settings = json.loads(settings_json)

        # Process repositories efficiently
        result = process_repositories_streaming(settings)

        # Explicit cleanup for large datasets
        gc.collect()

        return json.dumps(result)

    except Exception as e:
        # Ensure cleanup on error
        gc.collect()
        raise
```

## Testing Strategy

### Plugin Integration Testing

```python
import pytest
import json
from unittest.mock import patch

def test_health_check():
    """Test plugin health check function."""
    result = health_check()
    assert result["status"] == "healthy"
    assert "message" in result

def test_execute_analysis_valid_input():
    """Test analysis with valid settings."""
    settings = {
        "input_fstrs": ["."],
        "n_files": 10
    }

    result_json = execute_analysis(json.dumps(settings))
    result = json.loads(result_json)

    assert "files" in result
    assert "authors" in result
    assert isinstance(result["files"], list)

def test_execute_analysis_invalid_json():
    """Test error handling for invalid JSON."""
    with pytest.raises(ValueError, match="Invalid settings format"):
        execute_analysis("invalid json")
```

### Frontend Integration Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { executeAnalysis, healthCheck } from './api';

// Mock the plugin
vi.mock('tauri-plugin-python-api', () => ({
    callFunction: vi.fn(),
}));

describe('Plugin API Integration', () => {
    it('should execute analysis successfully', async () => {
        const mockResult = JSON.stringify({
            files: [],
            authors: [],
            blame_data: {},
            performance_stats: {}
        });

        vi.mocked(callFunction).mockResolvedValue(mockResult);

        const settings = {
            input_fstrs: ['.'],
            n_files: 10
        };

        const result = await executeAnalysis(settings);
        expect(result.files).toBeDefined();
        expect(result.authors).toBeDefined();
    });

    it('should handle health check', async () => {
        const mockHealth = { status: 'healthy', message: 'OK' };
        vi.mocked(callFunction).mockResolvedValue(mockHealth);

        const result = await healthCheck();
        expect(result.status).toBe('healthy');
    });
});
```

## Architecture Benefits

### Plugin-Based Advantages

| Aspect             | Previous Approaches            | Plugin Architecture          |
| ------------------ | ------------------------------ | ---------------------------- |
| **Performance**    | Network/IPC overhead           | Direct function calls        |
| **Error Handling** | HTTP status codes + JSON       | Automatic error conversion   |
| **Development**    | Multiple processes to debug    | Single process debugging     |
| **Deployment**     | Server + client coordination   | Single executable            |
| **Type Safety**    | Manual JSON validation         | Plugin-managed conversion    |
| **Memory Usage**   | Separate process overhead      | Shared memory space          |
| **Startup Time**   | Server startup + connection    | Embedded interpreter         |
| **Testing**        | HTTP mocking required          | Direct function testing      |

### Key Architectural Advantages

1. **Simplified Integration**: Plugin handles all PyO3 complexity automatically
2. **Better Performance**: Zero network overhead with direct function calls
3. **Automatic Error Handling**: Plugin converts Python exceptions to JavaScript errors
4. **Easier Debugging**: All components in same process with integrated logging
5. **Reduced Boilerplate**: No manual PyO3 binding code required
6. **Modern API**: Clean `callFunction()` interface for frontend integration

## Future Extensions

### Potential Enhancements

-   **Async Python Support**: Integration with Python asyncio through plugin
-   **Parallel Processing**: Multi-threaded analysis with automatic GIL management
-   **Plugin System**: Dynamic Python module loading via plugin configuration
-   **Performance Monitoring**: Plugin-specific metrics and profiling
-   **Memory Optimization**: Advanced Python object lifecycle management

### Scalability Considerations

-   **Large Repositories**: Streaming analysis results through plugin
-   **Memory Management**: Efficient Python object cleanup
-   **Error Recovery**: Robust error handling for long-running operations
-   **Plugin Configuration**: Advanced plugin settings for optimization

## Summary

The tauri-plugin-python architecture provides a robust, high-performance solution that eliminates the complexity of manual PyO3 integration while maintaining all performance benefits. The plugin approach simplifies development and deployment while providing better performance than network-based communication.

Key advantages:

-   **Zero integration overhead** with plugin-managed PyO3 bindings
-   **Automatic error conversion** between Python and JavaScript
-   **Single process simplicity** for development and deployment
-   **Type-safe communication** through JSON serialization
-   **Integrated logging and debugging** capabilities
-   **Modern API design** with clean function call interface

This architecture provides a solid foundation for future enhancements while maintaining the flexibility and power of the Python analysis engine through a simplified, plugin-based interface.
