# HTTP API Implementation Plan (Corrected)

## Overview
This document outlines the corrected step-by-step implementation plan for migrating from the fragile stdout-based sidecar to a robust HTTP-based API server architecture, leveraging the existing sophisticated API infrastructure.

## Key Corrections from Original Plan

### 1. **Leverage Existing Data Types**
- **REMOVED**: Creation of duplicate `models.py` 
- **UPDATED**: Use existing `api_types.py` with comprehensive Pydantic-compatible data classes
- **BENEFIT**: Eliminates duplication and preserves 100+ existing settings options

### 2. **Wrap Existing API Infrastructure**
- **UPDATED**: HTTP server wraps existing `GitInspectorAPI` class
- **BENEFIT**: Preserves sophisticated legacy engine integration and performance monitoring

### 3. **Simplified Implementation**
- **REDUCED**: HTTP server complexity by reusing existing validation and error handling
- **BENEFIT**: Faster implementation with lower risk of breaking existing functionality

## Implementation Strategy

### Phase 1: HTTP Server Foundation (Week 1)

#### 1.1 Project Structure Setup (CORRECTED)
```
gitinspectorgui/
├── python/
│   ├── gigui/
│   │   ├── api_types.py     # EXISTING - Use as-is (376 lines of data classes)
│   │   ├── api.py           # EXISTING - GitInspectorAPI class to wrap
│   │   ├── http_server.py   # NEW - FastAPI wrapper around existing API
│   │   └── start_server.py  # NEW - Server entry point
│   └── pyproject.toml       # UPDATE - Add missing HTTP dependencies
└── src-tauri/
    └── src/
        ├── commands.rs      # UPDATE - Add HTTP client commands
        └── http_client.rs   # NEW - HTTP client module
```

#### 1.2 Dependencies (CORRECTED)
Add to `pyproject.toml` dependencies:
```toml
[project]
dependencies = [
    # ... existing dependencies (fastapi >= 0.115 already present)
    "uvicorn[standard]>=0.24.0",  # MISSING - Add this
    "httpx>=0.25.0",              # MISSING - Add this for testing
]
```

#### 1.3 HTTP Server Implementation (SIMPLIFIED)
```python
# gigui/http_server.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import uuid
from datetime import datetime

# CORRECTED: Import from existing types instead of creating new ones
from .api_types import Settings, AnalysisResult
from .api import GitInspectorAPI

# Configure logging - now we can log freely!
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('gitinspector-api.log')
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GitInspectorGUI API",
    description="HTTP API for GitInspector analysis",
    version="1.0.0"
)

# Add CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CORRECTED: Use existing API infrastructure
api_instance = GitInspectorAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": str(uuid.uuid4())
        }
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "api_info": api_instance.get_engine_info()
    }

@app.post("/api/execute_analysis", response_model=AnalysisResult)
async def execute_analysis(settings: Settings) -> AnalysisResult:
    """Execute git repository analysis using existing API infrastructure"""
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Starting analysis for {len(settings.input_fstrs)} repositories")
    
    try:
        # CORRECTED: Use existing API validation and execution
        is_valid, error_msg = api_instance.validate_settings(settings)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Settings validation failed",
                    "message": error_msg,
                    "timestamp": datetime.utcnow().isoformat(),
                    "request_id": request_id
                }
            )
        
        # Execute analysis using existing sophisticated API
        result = api_instance.execute_analysis(settings)
        
        logger.info(f"[{request_id}] Analysis completed: {len(result.repositories)} repositories")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Analysis failed",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request_id
            }
        )

@app.get("/api/settings", response_model=Settings)
async def get_settings() -> Settings:
    """Get current settings using existing API"""
    try:
        return api_instance.get_settings()
    except Exception as e:
        logger.error(f"Failed to get settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/settings")
async def save_settings(settings: Settings) -> dict:
    """Save settings using existing API"""
    try:
        api_instance.save_settings(settings)
        return {"success": True, "message": "Settings saved successfully"}
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/engine_info")
async def get_engine_info() -> dict:
    """Get engine information and capabilities"""
    return api_instance.get_engine_info()

@app.get("/api/performance_stats")
async def get_performance_stats() -> dict:
    """Get API performance statistics"""
    return api_instance.get_performance_stats()

def start_server(host: str = "127.0.0.1", port: int = 8080):
    """Start the HTTP server"""
    logger.info(f"Starting GitInspectorGUI API server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    start_server()
```

#### 1.4 Server Entry Point
```python
# start_server.py
#!/usr/bin/env python3
"""
Entry point for GitInspectorGUI HTTP API server.
"""

import sys
import argparse
from gigui.http_server import start_server

def main():
    parser = argparse.ArgumentParser(description="GitInspectorGUI HTTP API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind to")
    
    args = parser.parse_args()
    
    try:
        start_server(host=args.host, port=args.port)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Phase 2: Tauri HTTP Client (Week 2)

#### 2.1 Add HTTP Dependencies to Tauri (CORRECTED)
Update `src-tauri/Cargo.toml`:
```toml
[dependencies]
# Existing dependencies...
tauri = { version = "1.5", features = [ "updater", "path-all", "fs-rename-file", "dialog-open", "fs-remove-dir", "fs-read-file", "fs-read-dir", "fs-exists", "fs-create-dir", "shell-sidecar", "os-all", "dialog-save", "fs-copy-file", "fs-remove-file", "fs-write-file", "shell-open", "shell-execute"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }

# NEW: Add HTTP client dependencies
reqwest = { version = "0.11", features = ["json"] }
```

#### 2.2 HTTP Client Module (CORRECTED)
```rust
// src-tauri/src/http_client.rs
use reqwest;
use serde::{Deserialize, Serialize};
use std::time::Duration;

// CORRECTED: Use existing data structures from commands.rs
use crate::commands::{Settings, AnalysisResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub timestamp: String,
    pub request_id: String,
}

pub struct GitInspectorClient {
    client: reqwest::Client,
    base_url: String,
}

impl GitInspectorClient {
    pub fn new(base_url: String) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(300)) // 5 minute timeout
            .build()
            .expect("Failed to create HTTP client");
        
        Self { client, base_url }
    }

    pub async fn health_check(&self) -> Result<bool, String> {
        let url = format!("{}/health", self.base_url);
        
        match self.client.get(&url).send().await {
            Ok(response) => Ok(response.status().is_success()),
            Err(e) => Err(format!("Health check failed: {}", e)),
        }
    }

    pub async fn execute_analysis(&self, settings: Settings) -> Result<AnalysisResult, String> {
        let url = format!("{}/api/execute_analysis", self.base_url);
        
        let response = self.client
            .post(&url)
            .json(&settings)
            .send()
            .await
            .map_err(|e| format!("HTTP request failed: {}", e))?;

        match response.status() {
            reqwest::StatusCode::OK => {
                let result: AnalysisResult = response.json().await
                    .map_err(|e| format!("JSON parsing failed: {}", e))?;
                Ok(result)
            }
            status => {
                let error_text = response.text().await
                    .unwrap_or_else(|_| format!("HTTP {} error", status));
                Err(format!("Server error {}: {}", status, error_text))
            }
        }
    }

    pub async fn get_settings(&self) -> Result<Settings, String> {
        let url = format!("{}/api/settings", self.base_url);
        
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("HTTP request failed: {}", e))?;

        match response.status() {
            reqwest::StatusCode::OK => {
                let settings: Settings = response.json().await
                    .map_err(|e| format!("JSON parsing failed: {}", e))?;
                Ok(settings)
            }
            status => {
                let error_text = response.text().await
                    .unwrap_or_else(|_| format!("HTTP {} error", status));
                Err(format!("Server error {}: {}", status, error_text))
            }
        }
    }

    pub async fn save_settings(&self, settings: Settings) -> Result<(), String> {
        let url = format!("{}/api/settings", self.base_url);
        
        let response = self.client
            .post(&url)
            .json(&settings)
            .send()
            .await
            .map_err(|e| format!("HTTP request failed: {}", e))?;

        match response.status() {
            reqwest::StatusCode::OK => Ok(()),
            status => {
                let error_text = response.text().await
                    .unwrap_or_else(|_| format!("HTTP {} error", status));
                Err(format!("Server error {}: {}", status, error_text))
            }
        }
    }
}
```

#### 2.3 Updated Tauri Commands (CORRECTED)
```rust
// src-tauri/src/commands.rs
use serde::{Deserialize, Serialize};
use tauri::{command, api::process::Command};
use std::sync::OnceLock;

// CORRECTED: Keep existing data structures (no changes needed)
// ... existing Settings, AnalysisResult, etc. structs remain the same ...

// NEW: Add HTTP client integration
use crate::http_client::GitInspectorClient;

static HTTP_CLIENT: OnceLock<GitInspectorClient> = OnceLock::new();

fn get_client() -> &'static GitInspectorClient {
    HTTP_CLIENT.get_or_init(|| {
        GitInspectorClient::new("http://127.0.0.1:8080".to_string())
    })
}

#[command]
pub async fn execute_analysis_http(_app: tauri::AppHandle, settings: Settings) -> Result<AnalysisResult, String> {
    println!("Executing analysis via HTTP with settings: {:?}", settings);
    
    let client = get_client();
    
    // Check if server is healthy
    if !client.health_check().await.unwrap_or(false) {
        return Err("API server is not responding. Please ensure the server is running.".to_string());
    }
    
    // Execute analysis
    client.execute_analysis(settings).await
}

#[command]
pub async fn get_settings_http(_app: tauri::AppHandle) -> Result<Settings, String> {
    let client = get_client();
    client.get_settings().await
}

#[command]
pub async fn save_settings_http(_app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    let client = get_client();
    client.save_settings(settings).await
}

// CORRECTED: Keep existing sidecar commands as fallback
// ... existing execute_analysis, get_settings, save_settings functions remain unchanged ...

// NEW: Feature flag to choose implementation
#[command]
pub async fn execute_analysis_with_fallback(_app: tauri::AppHandle, settings: Settings) -> Result<AnalysisResult, String> {
    // Try HTTP first, fallback to sidecar
    match execute_analysis_http(_app, settings.clone()).await {
        Ok(result) => Ok(result),
        Err(http_error) => {
            println!("HTTP analysis failed: {}, falling back to sidecar", http_error);
            execute_analysis(_app, settings).await
        }
    }
}
```

### Phase 3: Server Management (Week 2-3)

#### 3.1 Server Lifecycle Management
```rust
// src-tauri/src/server_manager.rs
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time::sleep;

pub struct ServerManager {
    server_process: Arc<Mutex<Option<Child>>>,
    server_url: String,
}

impl ServerManager {
    pub fn new(server_url: String) -> Self {
        Self {
            server_process: Arc::new(Mutex::new(None)),
            server_url,
        }
    }

    pub async fn start_server(&self) -> Result<(), String> {
        // Check if server is already running
        if self.is_server_running().await {
            return Ok(());
        }

        // CORRECTED: Start Python HTTP server using the new entry point
        let mut cmd = Command::new("python")
            .args(&["-m", "gigui.start_server"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start server: {}", e))?;

        // Store process handle
        {
            let mut process = self.server_process.lock().unwrap();
            *process = Some(cmd);
        }

        // Wait for server to be ready
        for _ in 0..30 { // 30 second timeout
            if self.is_server_running().await {
                return Ok(());
            }
            sleep(Duration::from_secs(1)).await;
        }

        Err("Server failed to start within timeout".to_string())
    }

    pub async fn is_server_running(&self) -> bool {
        let client = reqwest::Client::new();
        let health_url = format!("{}/health", self.server_url);
        
        match client.get(&health_url).send().await {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
    }

    pub fn stop_server(&self) {
        let mut process = self.server_process.lock().unwrap();
        if let Some(mut child) = process.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

impl Drop for ServerManager {
    fn drop(&mut self) {
        self.stop_server();
    }
}
```

#### 3.2 Tauri App Setup (CORRECTED)
```rust
// src-tauri/src/main.rs
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod http_client;
mod server_manager;

use commands::{
    execute_analysis, get_settings, save_settings,
    execute_analysis_http, get_settings_http, save_settings_http,
    execute_analysis_with_fallback
};
use server_manager::ServerManager;
use tauri::{Manager, State};
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    server_manager: Arc<ServerManager>,
}

#[tokio::main]
async fn main() {
    let server_manager = Arc::new(ServerManager::new("http://127.0.0.1:8080".to_string()));
    let app_state = AppState { server_manager };

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            let state: State<AppState> = app.state();
            let server_manager = state.server_manager.clone();
            
            // Start server on app startup
            tauri::async_runtime::spawn(async move {
                if let Err(e) = server_manager.start_server().await {
                    eprintln!("Failed to start API server: {}", e);
                }
            });
            
            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::Destroyed = event.event() {
                // Stop server on app exit
                let state: State<AppState> = event.window().state();
                state.server_manager.stop_server();
            }
        })
        .invoke_handler(tauri::generate_handler![
            // CORRECTED: Include both HTTP and sidecar commands
            execute_analysis,
            get_settings,
            save_settings,
            execute_analysis_http,
            get_settings_http,
            save_settings_http,
            execute_analysis_with_fallback
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Phase 4: Testing & Validation (Week 3)

#### 4.1 HTTP API Tests (CORRECTED)
```python
# tests/test_http_api.py
import pytest
import httpx
from fastapi.testclient import TestClient
from gigui.http_server import app
from gigui.api_types import Settings

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "api_info" in data

def test_execute_analysis_success():
    # CORRECTED: Use realistic test data that matches existing Settings structure
    settings = {
        "input_fstrs": ["/path/to/test/repo"],
        "depth": 5,
        "n_files": 5,
        "extensions": ["py", "js"],
        "ex_authors": [],
        "ex_emails": [],
        "ex_revisions": [],
        "ex_messages": [],
        "file_formats": ["html"],
        "multithread": True,
        "verbosity": 0
    }
    response = client.post("/api/execute_analysis", json=settings)
    assert response.status_code == 200
    data = response.json()
    assert "repositories" in data
    assert "success" in data

def test_get_settings():
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "input_fstrs" in data

def test_save_settings():
    settings = {
        "input_fstrs": ["/test/repo"],
        "depth": 5,
        "n_files": 5,
        "extensions": ["py"],
        "ex_authors": [],
        "ex_emails": [],
        "ex_revisions": [],
        "ex_messages": [],
        "file_formats": ["html"],
        "multithread": True,
        "verbosity": 0
    }
    response = client.post("/api/settings", json=settings)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

def test_engine_info():
    response = client.get("/api/engine_info")
    assert response.status_code == 200
    data = response.json()
    assert "capabilities" in data or "api_integration" in data
```

## Migration Timeline (CORRECTED)

### Week 1: Foundation
- [x] Create architectural analysis
- [ ] Add missing dependencies (uvicorn, httpx)
- [ ] Implement HTTP server wrapper around existing API
- [ ] Create server entry point
- [ ] Basic health check and API endpoints

### Week 2: Integration
- [ ] Implement Tauri HTTP client
- [ ] Add server lifecycle management
- [ ] Update Tauri commands with HTTP support
- [ ] Feature flag for HTTP vs sidecar
- [ ] Error handling and logging

### Week 3: Testing & Migration
- [ ] Unit tests for HTTP API
- [ ] Integration tests
- [ ] Performance comparison testing
- [ ] Cross-platform testing
- [ ] Default to HTTP mode with sidecar fallback

## Success Criteria (CORRECTED)

1. **Functionality**: All existing features work via HTTP API without loss of capability
2. **Reliability**: No more JSON parsing errors from stdout contamination
3. **Performance**: Analysis performance matches or exceeds sidecar
4. **Debugging**: Full logging capability without breaking communication
5. **Maintainability**: Clean separation of concerns, leveraging existing infrastructure
6. **Testing**: Comprehensive test coverage for HTTP API
7. **Compatibility**: All 100+ existing settings options preserved

## Risk Mitigation (CORRECTED)

1. **Backward Compatibility**: Keep sidecar as fallback during migration
2. **Existing Functionality**: Wrap rather than replace existing API infrastructure
3. **Server Startup**: Graceful handling of server startup failures
4. **Cross-Platform**: Test on Windows, macOS, and Linux
5. **Performance**: Monitor HTTP overhead vs direct API calls
6. **Data Integrity**: Ensure all existing data types and validation preserved

## Key Benefits of Corrected Approach

1. **Reduced Risk**: Leverages existing tested infrastructure
2. **Faster Implementation**: No need to recreate sophisticated API logic
3. **Feature Preservation**: All existing capabilities maintained
4. **Simplified Testing**: Existing API tests remain valid
5. **Easier Maintenance**: Single source of truth for API logic

This corrected implementation plan provides a robust foundation for eliminating stdout contamination issues while preserving all existing sophisticated functionality and significantly reducing implementation complexity.