# API Integration Examples

Practical examples for GitInspectorGUI simplified PyO3 helper function implementation.

## Overview

This document shows how to implement the required Python functions that will be called directly from the frontend via our PyO3 helper functions. Our integration handles all communication between JavaScript and Python automatically.

**Implementation Focus**: These examples show direct Python function implementations using our PyO3 helper function system. For PyO3 architecture details, see [Design Decisions](../architecture/design-decisions.md).

## Python Function Implementation

### Entry Point Structure

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
```

### Core Analysis Functions

```python
def health_check():
    """Check if the Python backend is healthy."""
    try:
        # Verify API is accessible
        api_status = api.get_status() if hasattr(api, 'get_status') else "ready"

        return {
            "status": "healthy",
            "message": "Python backend is running",
            "api_status": api_status,
            "backend": "direct-pyo3"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "message": f"Backend error: {str(e)}",
            "backend": "direct-pyo3"
        }

def get_engine_info():
    """Get information about the analysis engine."""
    try:
        return {
            "name": "GitInspectorGUI Analysis Engine",
            "version": "1.0.0",
            "backend": "direct-pyo3",
            "python_version": sys.version,
            "capabilities": [
                "repository_analysis",
                "blame_data",
                "author_statistics",
                "file_analysis",
                "settings_management"
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get engine info: {e}")
        raise RuntimeError(f"Engine info retrieval failed: {e}")

def execute_analysis(settings_json):
    """Execute repository analysis."""
    try:
        settings = json.loads(settings_json)
        logger.info(f"Starting analysis with settings: {settings}")

        # Validate settings
        if not settings.get('input_fstrs'):
            raise ValueError("No repositories specified for analysis")

        # Execute analysis through API
        result = api.execute_analysis(settings)
        logger.info("Analysis completed successfully")

        return json.dumps(result)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON settings: {e}")
        raise ValueError(f"Invalid settings format: {e}")
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise RuntimeError(f"Analysis execution failed: {e}")

def get_settings():
    """Get current analysis settings."""
    try:
        settings = api.get_settings()
        return json.dumps(settings)
    except Exception as e:
        logger.error(f"Failed to get settings: {e}")
        raise RuntimeError(f"Settings retrieval failed: {e}")

def save_settings(settings_json):
    """Save analysis settings."""
    try:
        settings = json.loads(settings_json)
        api.save_settings(settings)
        return json.dumps({"status": "success", "message": "Settings saved successfully"})
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON settings: {e}")
        raise ValueError(f"Invalid settings format: {e}")
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        raise RuntimeError(f"Settings save failed: {e}")

def get_blame_data(settings_json):
    """Get blame data for repositories."""
    try:
        settings = json.loads(settings_json)
        logger.info(f"Getting blame data with settings: {settings}")

        result = api.get_blame_data(settings)
        logger.info("Blame data retrieval completed")

        return json.dumps(result)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON settings: {e}")
        raise ValueError(f"Invalid settings format: {e}")
    except Exception as e:
        logger.error(f"Failed to get blame data: {e}")
        raise RuntimeError(f"Blame data retrieval failed: {e}")

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

## Frontend Integration

### API Layer Implementation

```typescript
// src/lib/api.ts
import { invoke } from "@tauri-apps/api/core";

export interface Settings {
    input_fstrs: string[];
    n_files: number;
    exclude_patterns?: string[];
    extensions?: string[];
    since?: string;
    until?: string;
}

export interface AnalysisResult {
    files: FileData[];
    authors: AuthorData[];
    blame_data: BlameData;
    performance_stats: PerformanceStats;
}

export interface HealthStatus {
    status: "healthy" | "error";
    message: string;
    api_status?: string;
    backend: string;
}

export interface EngineInfo {
    name: string;
    version: string;
    backend: string;
    python_version: string;
    capabilities: string[];
}

export async function healthCheck(): Promise<HealthStatus> {
    try {
        return await invoke<HealthStatus>("health_check");
    } catch (error) {
        console.error("Health check failed:", error);
        throw new Error(`PyO3 backend is not available: ${error}`);
    }
}

export async function getEngineInfo(): Promise<EngineInfo> {
    try {
        return await invoke<EngineInfo>("get_engine_info");
    } catch (error) {
        console.error("Failed to get engine info:", error);
        throw new Error(`Failed to get engine info: ${error}`);
    }
}

export async function executeAnalysis(settings: Settings): Promise<AnalysisResult> {
    try {
        return await invoke<AnalysisResult>("execute_analysis", { settings });
    } catch (error) {
        console.error("Analysis failed:", error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes("No repositories specified")) {
                throw new Error("Please select at least one repository for analysis.");
            }
            if (error.message.includes("Invalid settings format")) {
                throw new Error("Settings validation failed. Please check your configuration.");
            }
            if (error.message.includes("Git command not found")) {
                throw new Error("Git is not installed or not in PATH. Please install Git and try again.");
            }
        }

        throw new Error(`Analysis failed: ${error}`);
    }
}

export async function getSettings(): Promise<Settings> {
    try {
        return await invoke<Settings>("get_settings");
    } catch (error) {
        console.error("Failed to get settings:", error);
        throw new Error(`Failed to load settings: ${error}`);
    }
}

export async function saveSettings(settings: Settings): Promise<void> {
    try {
        const result = await invoke<{status: string, message: string}>("save_settings", { settings });
        if (result.status !== "success") {
            throw new Error(result.message || "Failed to save settings");
        }
    } catch (error) {
        console.error("Failed to save settings:", error);
        throw new Error(`Failed to save settings: ${error}`);
    }
}

export async function getBlameData(settings: Settings): Promise<any> {
    try {
        return await invoke<any>("get_blame_data", { settings });
    } catch (error) {
        console.error("Failed to get blame data:", error);
        throw new Error(`Failed to get blame data: ${error}`);
    }
}
```

### React Component Integration

```typescript
// src/components/AnalysisComponent.tsx
import React, { useState } from 'react';
import { executeAnalysis, type Settings, type AnalysisResult } from '../lib/api';

export function AnalysisComponent() {
    const [settings, setSettings] = useState<Settings>({
        input_fstrs: [],
        n_files: 100
    });
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            const analysisResult = await executeAnalysis(settings);
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="analysis-component">
            <div className="settings-section">
                <h3>Analysis Settings</h3>
                <input
                    type="number"
                    value={settings.n_files}
                    onChange={(e) => setSettings({
                        ...settings,
                        n_files: parseInt(e.target.value) || 100
                    })}
                    placeholder="Number of files"
                />
                <button
                    onClick={handleAnalysis}
                    disabled={loading || settings.input_fstrs.length === 0}
                >
                    {loading ? 'Analyzing...' : 'Start Analysis'}
                </button>
            </div>

            {error && (
                <div className="error-section">
                    <p className="error-message">{error}</p>
                </div>
            )}

            {result && (
                <div className="results-section">
                    <h3>Analysis Results</h3>
                    <p>Files analyzed: {result.files.length}</p>
                    <p>Authors found: {result.authors.length}</p>
                </div>
            )}
        </div>
    );
}
```

## Advanced Examples

### Batch Processing

```python
def batch_analysis(repositories_json):
    """Process multiple repositories efficiently."""
    try:
        repositories = json.loads(repositories_json)
        results = []

        for repo_config in repositories:
            try:
                repo_result = api.execute_analysis(repo_config)
                results.append({
                    "repository": repo_config.get("name", "unknown"),
                    "status": "success",
                    "data": repo_result
                })
            except Exception as e:
                logger.warning(f"Repository analysis failed: {e}")
                results.append({
                    "repository": repo_config.get("name", "unknown"),
                    "status": "error",
                    "error": str(e)
                })

        return json.dumps({
            "results": results,
            "summary": {
                "total": len(repositories),
                "successful": len([r for r in results if r["status"] == "success"]),
                "failed": len([r for r in results if r["status"] == "error"])
            }
        })
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise RuntimeError(f"Batch analysis failed: {e}")

# Add to function registry
_tauri_plugin_functions.append(batch_analysis)
```

### Streaming Results

```python
def stream_analysis_progress(settings_json):
    """Stream analysis progress updates."""
    try:
        settings = json.loads(settings_json)

        # Initialize progress tracking
        progress = {
            "stage": "initialization",
            "progress": 0,
            "message": "Starting analysis..."
        }

        # Simulate progress updates (in real implementation, this would be integrated with the analysis engine)
        stages = [
            ("repository_scan", 20, "Scanning repositories..."),
            ("file_analysis", 50, "Analyzing files..."),
            ("author_analysis", 75, "Processing authors..."),
            ("blame_analysis", 90, "Generating blame data..."),
            ("completion", 100, "Analysis complete")
        ]

        results = []
        for stage, progress_pct, message in stages:
            progress.update({
                "stage": stage,
                "progress": progress_pct,
                "message": message
            })
            results.append(progress.copy())

        # Add final result
        final_result = api.execute_analysis(settings)
        results.append({
            "stage": "result",
            "progress": 100,
            "message": "Analysis complete",
            "data": final_result
        })

        return json.dumps(results)
    except Exception as e:
        logger.error(f"Streaming analysis failed: {e}")
        raise RuntimeError(f"Streaming analysis failed: {e}")
```

### Configuration Validation

```python
def validate_configuration(config_json):
    """Validate analysis configuration."""
    try:
        config = json.loads(config_json)
        errors = []
        warnings = []

        # Validate repositories
        repositories = config.get('input_fstrs', [])
        if not repositories:
            errors.append("No repositories specified")
        else:
            for repo in repositories:
                if not os.path.exists(repo):
                    errors.append(f"Repository not found: {repo}")
                elif not os.path.isdir(repo):
                    errors.append(f"Repository path is not a directory: {repo}")
                elif not os.path.exists(os.path.join(repo, '.git')):
                    warnings.append(f"Directory is not a git repository: {repo}")

        # Validate numeric settings
        n_files = config.get('n_files', 0)
        if n_files <= 0:
            errors.append("Number of files must be positive")
        elif n_files > 10000:
            warnings.append("Large number of files may impact performance")

        # Validate file extensions
        extensions = config.get('extensions', [])
        for ext in extensions:
            if not ext.startswith('.'):
                errors.append(f"File extension must start with '.': {ext}")

        return json.dumps({
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "config": config
        })
    except json.JSONDecodeError as e:
        return json.dumps({
            "valid": False,
            "errors": [f"Invalid JSON: {e}"],
            "warnings": [],
            "config": None
        })
    except Exception as e:
        logger.error(f"Configuration validation failed: {e}")
        raise RuntimeError(f"Configuration validation failed: {e}")

# Add to function registry
_tauri_plugin_functions.extend([stream_analysis_progress, validate_configuration])
```

## Testing Examples

### Python Function Testing

```python
# tests/test_plugin_functions.py
import pytest
import json
from unittest.mock import patch, MagicMock

def test_health_check():
    """Test health check function."""
    result = health_check()

    assert result["status"] == "healthy"
    assert result["backend"] == "direct-pyo3"
    assert "message" in result

def test_execute_analysis_valid_input():
    """Test analysis with valid settings."""
    settings = {
        "input_fstrs": ["."],
        "n_files": 10
    }

    with patch.object(api, 'execute_analysis') as mock_analysis:
        mock_analysis.return_value = {
            "files": [],
            "authors": [],
            "blame_data": {},
            "performance_stats": {}
        }

        result_json = execute_analysis(json.dumps(settings))
        result = json.loads(result_json)

        assert "files" in result
        assert "authors" in result
        mock_analysis.assert_called_once_with(settings)

def test_execute_analysis_invalid_json():
    """Test error handling for invalid JSON."""
    with pytest.raises(ValueError, match="Invalid settings format"):
        execute_analysis("invalid json")

def test_execute_analysis_no_repositories():
    """Test error handling for missing repositories."""
    settings = {"input_fstrs": [], "n_files": 10}

    with pytest.raises(ValueError, match="No repositories specified"):
        execute_analysis(json.dumps(settings))
```

### Frontend Integration Testing

```typescript
// src/lib/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAnalysis, healthCheck, getEngineInfo } from '../api';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('PyO3 API Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should execute analysis successfully', async () => {
        const mockResult = {
            files: [],
            authors: [],
            blame_data: {},
            performance_stats: {}
        };

        vi.mocked(invoke).mockResolvedValue(mockResult);

        const settings = {
            input_fstrs: ['.'],
            n_files: 10
        };

        const result = await executeAnalysis(settings);

        expect(invoke).toHaveBeenCalledWith('execute_analysis', { settings });
        expect(result.files).toBeDefined();
        expect(result.authors).toBeDefined();
    });

    it('should handle health check', async () => {
        const mockHealth = {
            status: 'healthy',
            message: 'Python backend is running',
            backend: 'direct-pyo3'
        };

        vi.mocked(invoke).mockResolvedValue(mockHealth);

        const result = await healthCheck();

        expect(invoke).toHaveBeenCalledWith('health_check');
        expect(result.status).toBe('healthy');
        expect(result.backend).toBe('direct-pyo3');
    });

    it('should get engine info', async () => {
        const mockInfo = {
            name: 'GitInspectorGUI Analysis Engine',
            version: '1.0.0',
            backend: 'direct-pyo3',
            python_version: '3.11.0',
            capabilities: ['repository_analysis']
        };

        vi.mocked(invoke).mockResolvedValue(mockInfo);

        const result = await getEngineInfo();

        expect(invoke).toHaveBeenCalledWith('get_engine_info');
        expect(result.name).toBe('GitInspectorGUI Analysis Engine');
        expect(result.backend).toBe('direct-pyo3');
    });

    it('should handle analysis errors', async () => {
        const mockError = new Error('No repositories specified');
        vi.mocked(invoke).mockRejectedValue(mockError);

        const settings = { input_fstrs: [], n_files: 10 };

        await expect(executeAnalysis(settings)).rejects.toThrow('Please select at least one repository');
    });
});
```

## Best Practices

### Function Implementation Guidelines

1. **Always use JSON for data exchange** between frontend and Python
2. **Implement comprehensive error handling** with specific exception types
3. **Log important operations** for debugging and monitoring
4. **Validate inputs early** to provide clear error messages
5. **Use type hints** in Python for better code documentation
6. **Return consistent data structures** for predictable frontend integration
7. **Handle edge cases gracefully** (empty inputs, missing files, etc.)

### Performance Considerations

```python
def optimized_analysis(settings_json):
    """Optimized analysis implementation."""
    import gc

    try:
        settings = json.loads(settings_json)

        # Process in batches for large datasets
        batch_size = 100
        repositories = settings.get('input_fstrs', [])

        results = []
        for i in range(0, len(repositories), batch_size):
            batch = repositories[i:i + batch_size]
            batch_result = process_repository_batch(batch, settings)
            results.extend(batch_result)

            # Explicit garbage collection for large datasets
            gc.collect()

        return json.dumps({
            "repositories": results,
            "total_processed": len(results)
        })
    except Exception as e:
        gc.collect()  # Cleanup on error
        raise
```

This simplified PyO3 helper function integration approach provides seamless Python-JavaScript communication through our helper functions, eliminating the complexity of manual integration while maintaining high performance and excellent error handling.
