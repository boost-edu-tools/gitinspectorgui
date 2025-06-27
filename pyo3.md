# GitInspectorGUI: FastAPI to PyO3 Conversion Plan

## Overview

This plan converts the current HTTP-based IPC architecture (Tauri ↔ FastAPI) to direct Python calls using PyO3, eliminating the FastAPI server and HTTP overhead entirely.

## Current vs Target Architecture

### Current Architecture

```
React Frontend ↔ Tauri Commands ↔ HTTP Client ↔ FastAPI Server ↔ Python Analysis
```

### Target Architecture

```
React Frontend ↔ Tauri Commands ↔ PyO3 Embedded Python ↔ Python Analysis (Direct)
```

## Benefits of PyO3 Approach

1. **No IPC Overhead**: Direct function calls instead of HTTP requests
2. **Simplified Deployment**: No separate server process to manage
3. **Better Error Handling**: Native Rust error propagation
4. **Improved Performance**: Eliminate network serialization/deserialization
5. **Reduced Complexity**: No server startup, health checks, or port management
6. **Memory Efficiency**: Shared memory space between Rust and Python

## Implementation Strategy

We'll use the **tauri-plugin-python** with PyO3 backend for maximum compatibility and performance.

## Phase 1: Project Setup and Dependencies

### 1.1 Add PyO3 Dependencies

**File: `src-tauri/Cargo.toml`**

```toml
[dependencies]
# Remove HTTP-related dependencies (reqwest, etc.)
tauri = { version = "2.0", features = ["protocol-asset"] }
tauri-plugin-python = { version = "0.3", features = ["pyo3"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

### 1.2 Configure Python Integration

**File: `src-tauri/tauri.conf.json`**

```json
{
    "bundle": {
        "resources": ["../python/gigui/**/*", "../python/pyproject.toml"]
    },
    "plugins": {
        "python": {
            "interpreter": "pyo3",
            "pythonPath": "python/gigui"
        }
    }
}
```

### 1.3 Create Python Entry Point

**File: `src-tauri/src-python/main.py`**

```python
"""
Main Python entry point for PyO3 integration.
This file registers all callable functions and handles module initialization.
"""

# Import existing analysis modules
import sys
import os
import json
from pathlib import Path

# Add the gigui package to Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python"))

from gigui.api import GitInspectorAPI
from gigui.models.analysis_result import AnalysisResult
from gigui.models.settings import Settings as GuiSettings

# Register functions that can be called from Tauri
_tauri_plugin_functions = [
    "execute_analysis",
    "get_settings",
    "save_settings",
    "get_engine_info",
    "get_performance_stats",
    "health_check"
]

# Global API instance for persistent state
api_instance = None

def initialize_api():
    """Initialize the GitInspectorAPI instance."""
    global api_instance
    if api_instance is None:
        api_instance = GitInspectorAPI()
    return api_instance

def execute_analysis(settings_dict):
    """
    Execute git analysis with the provided settings.

    Args:
        settings_dict (dict): Analysis settings as dictionary

    Returns:
        dict: Analysis results in dictionary format
    """
    try:
        api = initialize_api()

        # Convert dict to Settings object
        settings = GuiSettings.model_validate(settings_dict)

        # Execute analysis
        result = api.execute_analysis(settings)

        # Convert result to dict for JSON serialization
        return result.model_dump() if hasattr(result, 'model_dump') else result

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

def get_settings():
    """Get current settings."""
    try:
        api = initialize_api()
        settings = api.get_settings()
        return settings.model_dump() if hasattr(settings, 'model_dump') else settings
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def save_settings(settings_dict):
    """Save settings."""
    try:
        api = initialize_api()
        settings = GuiSettings.model_validate(settings_dict)
        api.save_settings(settings)
        return {
            "success": True,
            "message": "Settings saved successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def get_engine_info():
    """Get engine information."""
    try:
        api = initialize_api()
        return api.get_engine_info()
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def get_performance_stats():
    """Get performance statistics."""
    try:
        api = initialize_api()
        return api.get_performance_stats()
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def health_check():
    """Health check endpoint."""
    try:
        api = initialize_api()
        return {
            "status": "healthy",
            "version": "2.0.0-pyo3",
            "backend": "PyO3",
            "timestamp": str(api.get_current_time()) if hasattr(api, 'get_current_time') else None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Initialize API on module load
initialize_api()
```

## Phase 2: Rust Backend Conversion

### 2.1 Update Main Tauri Application

**File: `src-tauri/src/main.rs`**

```rust
// Remove HTTP server management and process spawning code
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_python::init())
        .invoke_handler(tauri::generate_handler![
            commands::execute_analysis,
            commands::get_settings,
            commands::save_settings,
            commands::get_engine_info,
            commands::get_performance_stats,
            commands::health_check
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2.2 Rewrite Commands with PyO3

**File: `src-tauri/src/commands.rs`**

```rust
use serde::{Deserialize, Serialize};
use tauri::command;
use tauri_plugin_python::{PythonExt, TauriPython};

// Keep existing Settings struct for type safety
#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    // ... existing settings fields ...
    pub input_fstrs: Vec<String>,
    pub depth: i32,
    pub n_files: i32,
    // ... all other existing fields ...
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub success: bool,
    pub repositories: Vec<Repository>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Repository {
    pub path: String,
    pub authors: Vec<Author>,
    pub files: Vec<FileInfo>,
    // ... other repository fields ...
}

// Helper function to call Python functions
async fn call_python_function<T, R>(
    app: &tauri::AppHandle,
    function_name: &str,
    args: T,
) -> Result<R, String>
where
    T: Serialize,
    R: for<'de> Deserialize<'de>,
{
    let python = app.state::<TauriPython>();

    python
        .call_function(function_name, args)
        .await
        .map_err(|e| format!("Python call failed: {}", e))?
        .extract()
        .map_err(|e| format!("Failed to extract result: {}", e))
}

#[command]
pub async fn execute_analysis(
    app: tauri::AppHandle,
    settings: Settings,
) -> Result<AnalysisResult, String> {
    call_python_function(&app, "execute_analysis", settings).await
}

#[command]
pub async fn get_settings(app: tauri::AppHandle) -> Result<Settings, String> {
    call_python_function(&app, "get_settings", ()).await
}

#[command]
pub async fn save_settings(
    app: tauri::AppHandle,
    settings: Settings,
) -> Result<serde_json::Value, String> {
    call_python_function(&app, "save_settings", settings).await
}

#[command]
pub async fn get_engine_info(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    call_python_function(&app, "get_engine_info", ()).await
}

#[command]
pub async fn get_performance_stats(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    call_python_function(&app, "get_performance_stats", ()).await
}

#[command]
pub async fn health_check(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    call_python_function(&app, "health_check", ()).await
}
```

## Phase 3: Python Module Preparation

### 3.1 Update Python Package Structure

**Current structure:**

```
python/
├── gigui/
│   ├── http_server.py     # REMOVE
│   ├── api.py            # KEEP & MODIFY
│   ├── models/           # KEEP
│   └── analysis/         # KEEP
```

**Target structure:**

```
python/
├── gigui/
│   ├── api.py            # Modified for direct calls
│   ├── models/           # Same
│   ├── analysis/         # Same
│   └── pyo3_bridge.py    # NEW: PyO3-specific utilities
```

### 3.2 Modify Python API

**File: `python/gigui/api.py`**

```python
"""
GitInspector API for direct Python calls (PyO3).
Removed FastAPI dependencies and HTTP-specific code.
"""

import asyncio
from typing import Optional, Dict, Any
from pathlib import Path

from .models.settings import Settings
from .models.analysis_result import AnalysisResult
from .analysis.engine import GitAnalysisEngine

class GitInspectorAPI:
    """
    Main API class for git analysis operations.
    Designed for direct Python calls via PyO3.
    """

    def __init__(self):
        self.engine = GitAnalysisEngine()
        self.settings_file = Path.home() / ".gitinspector" / "settings.json"
        self._current_settings: Optional[Settings] = None

    def execute_analysis(self, settings: Settings) -> AnalysisResult:
        """
        Execute git analysis with provided settings.

        Args:
            settings: Analysis configuration

        Returns:
            Analysis results
        """
        try:
            # Store current settings
            self._current_settings = settings

            # Run analysis using existing engine
            result = self.engine.analyze(settings)

            return AnalysisResult(
                success=True,
                repositories=result.repositories,
                execution_time=result.execution_time,
                settings_used=settings
            )

        except Exception as e:
            return AnalysisResult(
                success=False,
                error=str(e),
                error_type=type(e).__name__
            )

    def get_settings(self) -> Settings:
        """Get current or default settings."""
        if self._current_settings:
            return self._current_settings

        # Load from file or return defaults
        if self.settings_file.exists():
            import json
            with open(self.settings_file, 'r') as f:
                data = json.load(f)
                return Settings.model_validate(data)

        return Settings()  # Default settings

    def save_settings(self, settings: Settings) -> None:
        """Save settings to file."""
        self.settings_file.parent.mkdir(parents=True, exist_ok=True)

        with open(self.settings_file, 'w') as f:
            import json
            json.dump(settings.model_dump(), f, indent=2)

        self._current_settings = settings

    def get_engine_info(self) -> Dict[str, Any]:
        """Get information about the analysis engine."""
        return {
            "name": "GitInspector Engine",
            "version": "3.0.0",
            "backend": "PyO3",
            "features": [
                "Multi-threading",
                "Large repository support",
                "Custom file filtering",
                "Author analytics"
            ]
        }

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics."""
        return {
            "memory_usage": "N/A",  # TODO: Implement if needed
            "last_analysis_time": getattr(self, '_last_analysis_time', None),
            "cache_hits": 0,  # TODO: Implement if caching added
        }
```

## Phase 4: Frontend Modifications

### 4.1 Update Frontend API Calls

**File: `src/lib/api.ts`**

```typescript
// Remove HTTP client code and replace with direct Tauri invoke calls

import { invoke } from "@tauri-apps/api/core";
import {
    Settings,
    AnalysisResult,
    EngineInfo,
    PerformanceStats,
} from "./types";

export class GitInspectorAPI {
    async executeAnalysis(settings: Settings): Promise<AnalysisResult> {
        try {
            return await invoke("execute_analysis", { settings });
        } catch (error) {
            console.error("Analysis failed:", error);
            throw new Error(`Analysis failed: ${error}`);
        }
    }

    async getSettings(): Promise<Settings> {
        return await invoke("get_settings");
    }

    async saveSettings(settings: Settings): Promise<void> {
        await invoke("save_settings", { settings });
    }

    async getEngineInfo(): Promise<EngineInfo> {
        return await invoke("get_engine_info");
    }

    async getPerformanceStats(): Promise<PerformanceStats> {
        return await invoke("get_performance_stats");
    }

    async healthCheck(): Promise<{ status: string; version: string }> {
        return await invoke("health_check");
    }
}

// Export singleton instance
export const api = new GitInspectorAPI();
```

### 4.2 Update React Components

**File: `src/components/AnalysisPanel.tsx`**

```typescript
// Remove HTTP error handling and server status checks
// Update to use direct API calls

import React, { useState } from "react";
import { api } from "../lib/api";
import { Settings, AnalysisResult } from "../lib/types";

export const AnalysisPanel: React.FC = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = async (settings: Settings) => {
        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await api.executeAnalysis(settings);
            setResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Remove server health check logic
    // Remove HTTP timeout handling
    // Simplified error handling for direct calls

    return (
        <div className="analysis-panel">
            {/* Existing UI components */}
            {/* Remove server status indicators */}
            {/* Remove HTTP-specific error messages */}
        </div>
    );
};
```

## Phase 5: Build System Updates

### 5.1 Update Build Scripts

**File: `package.json`**

```json
{
    "scripts": {
        "tauri:dev": "tauri dev",
        "tauri:build": "tauri build",
        "dev": "vite",
        "build": "tsc && vite build",
        "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "preview": "vite preview"
    }
}
```

### 5.2 Remove HTTP Server Scripts

**Remove these files:**

-   `python/gigui/http_server.py`
-   `python/gigui/start_server.py`
-   `scripts/start-dev-server.sh`
-   Any HTTP-specific startup scripts

### 5.3 Update Development Workflow

**New development process:**

1. `pnpm run tauri:dev` - Starts both frontend and PyO3-integrated backend
2. Python changes require restart (no hot-reload for PyO3)
3. Frontend changes still have hot-reload via Vite

## Phase 6: Testing and Validation

### 6.1 Create PyO3 Test Suite

**File: `tests/test_pyo3_integration.py`**

```python
"""Test PyO3 integration without running full Tauri app."""

import json
import sys
from pathlib import Path

# Add the src-python directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src-tauri" / "src-python"))

from main import (
    execute_analysis,
    get_settings,
    save_settings,
    health_check
)

def test_health_check():
    """Test health check function."""
    result = health_check()
    assert result["status"] == "healthy"
    assert "PyO3" in result["version"]

def test_settings_roundtrip():
    """Test settings save and load."""
    test_settings = {
        "input_fstrs": ["/tmp/test-repo"],
        "depth": 10,
        "n_files": 20
    }

    # Save settings
    save_result = save_settings(test_settings)
    assert save_result["success"] is True

    # Load settings
    loaded_settings = get_settings()
    assert loaded_settings["input_fstrs"] == test_settings["input_fstrs"]

if __name__ == "__main__":
    test_health_check()
    test_settings_roundtrip()
    print("✅ All PyO3 integration tests passed!")
```

### 6.2 Create Integration Test

**File: `src-tauri/tests/pyo3_commands.rs`**

```rust
#[cfg(test)]
mod tests {
    use crate::commands::*;
    use tauri::test::{MockRuntime, mock_context};

    #[tokio::test]
    async fn test_health_check() {
        let app = mock_context().app;
        let result = health_check(app.handle()).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_settings_operations() {
        let app = mock_context().app;

        // Test getting default settings
        let settings = get_settings(app.handle()).await;
        assert!(settings.is_ok());

        // Test saving settings
        let test_settings = Settings {
            input_fstrs: vec!["/tmp/test".to_string()],
            depth: 5,
            n_files: 10,
            // ... other required fields
        };

        let save_result = save_settings(app.handle(), test_settings.clone()).await;
        assert!(save_result.is_ok());
    }
}
```

## Phase 7: Deployment and Distribution

### 7.1 Update Build Configuration

**File: `src-tauri/tauri.conf.json`**

```json
{
    "build": {
        "beforeBuildCommand": "pnpm run build",
        "beforeDevCommand": "pnpm run dev",
        "frontendDist": "../dist",
        "devUrl": "http://localhost:5173"
    },
    "bundle": {
        "resources": ["../python/gigui/**/*"],
        "targets": ["msi", "deb", "dmg", "app"]
    }
}
```

### 7.2 Python Dependencies Bundling

Since PyO3 requires Python libraries to be available, we need to ensure all dependencies are bundled:

**Create: `scripts/bundle-python-deps.sh`**

```bash
#!/bin/bash
# Bundle Python dependencies for PyO3

echo "Bundling Python dependencies..."

# Create dependencies directory
mkdir -p src-tauri/python-deps

# Install dependencies to specific directory
cd python
pip install -t ../src-tauri/python-deps -r requirements.txt

echo "Python dependencies bundled successfully!"
```

## Phase 8: Migration Execution Steps

### 8.1 Pre-Migration Checklist

-   [ ] Backup current working code
-   [ ] Ensure all tests pass with current HTTP implementation
-   [ ] Document current API endpoints and their behavior
-   [ ] Create branch for PyO3 migration

### 8.2 Migration Order

1. **Setup Phase**: Add PyO3 dependencies and basic structure
2. **Python Phase**: Create PyO3 bridge and modify API classes
3. **Rust Phase**: Replace HTTP commands with PyO3 calls
4. **Frontend Phase**: Update API client to use direct Tauri invoke
5. **Testing Phase**: Create and run integration tests
6. **Cleanup Phase**: Remove FastAPI and HTTP-related code

### 8.3 Rollback Plan

If issues arise:

1. Keep HTTP implementation in separate branch
2. Feature flag to switch between HTTP and PyO3
3. Gradual migration with fallback options

## Expected Outcomes

### Performance Improvements

-   **Startup Time**: Faster (no HTTP server startup)
-   **Request Latency**: ~10-50ms improvement per request
-   **Memory Usage**: Reduced (single process instead of two)
-   **CPU Usage**: Lower (no HTTP serialization overhead)

### Development Benefits

-   **Simplified Architecture**: One process instead of two
-   **Better Error Handling**: Direct exception propagation
-   **Easier Debugging**: Single process debugging
-   **Reduced Complexity**: No HTTP server management

### Potential Challenges

-   **Python Hot-Reload**: Lost (requires app restart for Python changes)
-   **Cross-Platform**: May require platform-specific Python builds
-   **Dependency Management**: All Python deps must be bundled
-   **Learning Curve**: Team needs to understand PyO3 concepts

## Success Criteria

-   [ ] All existing functionality works identically
-   [ ] Performance improvements measured and documented
-   [ ] No HTTP server processes running
-   [ ] All tests passing
-   [ ] Cross-platform builds working
-   [ ] Documentation updated
-   [ ] Development workflow documented

## Timeline Estimate

-   **Phase 1-2 (Setup)**: 1-2 days
-   **Phase 3-4 (Core Migration)**: 3-5 days
-   **Phase 5-6 (Testing)**: 2-3 days
-   **Phase 7-8 (Polish & Deploy)**: 1-2 days

**Total**: 7-12 days depending on complexity and issues encountered.
