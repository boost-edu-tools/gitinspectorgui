# HTTP API Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for migrating from the fragile stdout-based sidecar to a robust HTTP-based API server architecture.

## Implementation Strategy

### Phase 1: HTTP Server Foundation (Week 1)

#### 1.1 Project Structure Setup
```
gitinspectorgui/
├── python/
│   ├── gigui/
│   │   ├── api.py           # Existing API logic
│   │   ├── http_server.py   # New HTTP server
│   │   └── models.py        # Pydantic models
│   ├── pyproject.toml       # Updated with HTTP server dependencies
│   └── start_server.py      # Server entry point
└── src-tauri/
    └── src/
        ├── commands.rs      # Updated with HTTP client
        └── http_client.rs   # New HTTP client module
```

#### 1.2 Dependencies
Add to `pyproject.toml` dependencies:
```toml
[project]
dependencies = [
    # ... existing dependencies
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.5.0",
    "httpx>=0.25.0",  # For testing
]
```

#### 1.3 Pydantic Models
Create type-safe request/response models:
```python
# gigui/models.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class Settings(BaseModel):
    input_fstrs: List[str] = Field(..., description="Repository paths to analyze")
    output_fstr: Optional[str] = Field(None, description="Output file path")
    # ... other settings fields

class RepositoryResult(BaseModel):
    path: str
    commit_count: int
    author_count: int
    # ... other result fields

class AnalysisResult(BaseModel):
    repositories: List[RepositoryResult]
    total_commits: int
    total_authors: int
    analysis_duration: float
    timestamp: datetime

class ErrorCode(str, Enum):
    VALIDATION_ERROR = "validation_error"
    REPOSITORY_NOT_FOUND = "repository_not_found"
    ANALYSIS_FAILED = "analysis_failed"
    INTERNAL_ERROR = "internal_error"

class ErrorResponse(BaseModel):
    error_code: ErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    request_id: str
```

#### 1.4 HTTP Server Implementation
```python
# gigui/http_server.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import uuid
from datetime import datetime
from .models import Settings, AnalysisResult, ErrorResponse, ErrorCode
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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code=ErrorCode.INTERNAL_ERROR,
            message="Internal server error",
            details={"exception": str(exc)},
            timestamp=datetime.utcnow(),
            request_id=str(uuid.uuid4())
        ).dict()
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow()
    }

@app.post("/api/execute_analysis", response_model=AnalysisResult)
async def execute_analysis(settings: Settings) -> AnalysisResult:
    """Execute git repository analysis"""
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Starting analysis for {len(settings.input_fstrs)} repositories")
    
    try:
        # Validate repositories exist
        for repo_path in settings.input_fstrs:
            if not os.path.exists(repo_path):
                raise HTTPException(
                    status_code=400,
                    detail=ErrorResponse(
                        error_code=ErrorCode.REPOSITORY_NOT_FOUND,
                        message=f"Repository not found: {repo_path}",
                        timestamp=datetime.utcnow(),
                        request_id=request_id
                    ).dict()
                )
        
        # Execute analysis
        api = GitInspectorAPI()
        start_time = time.time()
        result = api.execute_analysis(settings)
        duration = time.time() - start_time
        
        logger.info(f"[{request_id}] Analysis completed in {duration:.2f}s: {len(result.repositories)} repositories")
        
        # Add metadata
        result.analysis_duration = duration
        result.timestamp = datetime.utcnow()
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error_code=ErrorCode.ANALYSIS_FAILED,
                message=f"Analysis failed: {str(e)}",
                timestamp=datetime.utcnow(),
                request_id=request_id
            ).dict()
        )

def start_server(host: str = "127.0.0.1", port: int = 8080):
    """Start the HTTP server"""
    logger.info(f"Starting GitInspectorGUI API server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    start_server()
```

### Phase 2: Tauri HTTP Client (Week 2)

#### 2.1 Add HTTP Dependencies to Tauri
Update `src-tauri/Cargo.toml`:
```toml
[dependencies]
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1.0", features = ["full"] }
serde_json = "1.0"
```

#### 2.2 HTTP Client Module
```rust
// src-tauri/src/http_client.rs
use reqwest;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub input_fstrs: Vec<String>,
    pub output_fstr: Option<String>,
    // ... other fields
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub repositories: Vec<RepositoryResult>,
    pub total_commits: i32,
    pub total_authors: i32,
    pub analysis_duration: f64,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepositoryResult {
    pub path: String,
    pub commit_count: i32,
    pub author_count: i32,
    // ... other fields
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error_code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
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
                let error_response: ErrorResponse = response.json().await
                    .map_err(|_| format!("Server error {}: Unable to parse error response", status))?;
                Err(format!("Server error {}: {} ({})", status, error_response.message, error_response.error_code))
            }
        }
    }
}
```

#### 2.3 Updated Tauri Commands
```rust
// src-tauri/src/commands.rs
use crate::http_client::{GitInspectorClient, Settings, AnalysisResult};
use tauri::command;
use std::sync::OnceLock;

static HTTP_CLIENT: OnceLock<GitInspectorClient> = OnceLock::new();

fn get_client() -> &'static GitInspectorClient {
    HTTP_CLIENT.get_or_init(|| {
        GitInspectorClient::new("http://127.0.0.1:8080".to_string())
    })
}

#[command]
pub async fn execute_analysis_http(settings: Settings) -> Result<AnalysisResult, String> {
    println!("Executing analysis via HTTP with settings: {:?}", settings);
    
    let client = get_client();
    
    // Check if server is healthy
    if !client.health_check().await.unwrap_or(false) {
        return Err("API server is not responding. Please ensure the server is running.".to_string());
    }
    
    // Execute analysis
    client.execute_analysis(settings).await
}

// Keep existing sidecar command as fallback
#[command]
pub async fn execute_analysis_sidecar(settings: Settings) -> Result<AnalysisResult, String> {
    // ... existing sidecar implementation
}

// Feature flag to choose implementation
#[command]
pub async fn execute_analysis(settings: Settings) -> Result<AnalysisResult, String> {
    // Try HTTP first, fallback to sidecar
    match execute_analysis_http(settings.clone()).await {
        Ok(result) => Ok(result),
        Err(http_error) => {
            println!("HTTP analysis failed: {}, falling back to sidecar", http_error);
            execute_analysis_sidecar(settings).await
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

        // Start Python HTTP server
        let mut cmd = Command::new("python")
            .args(&["-m", "gigui.http_server"])
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

#### 3.2 Tauri App Setup
```rust
// src-tauri/src/main.rs
mod commands;
mod http_client;
mod server_manager;

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
            commands::execute_analysis,
            commands::execute_analysis_http,
            commands::execute_analysis_sidecar
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Phase 4: Testing & Validation (Week 3)

#### 4.1 HTTP API Tests
```python
# tests/test_http_api.py
import pytest
import httpx
from fastapi.testclient import TestClient
from gigui.http_server import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_execute_analysis_success():
    settings = {
        "input_fstrs": ["/path/to/test/repo"],
        "output_fstr": None
    }
    response = client.post("/api/execute_analysis", json=settings)
    assert response.status_code == 200
    data = response.json()
    assert "repositories" in data
    assert "total_commits" in data

def test_execute_analysis_invalid_repo():
    settings = {
        "input_fstrs": ["/nonexistent/repo"],
        "output_fstr": None
    }
    response = client.post("/api/execute_analysis", json=settings)
    assert response.status_code == 400
    data = response.json()
    assert data["error_code"] == "repository_not_found"
```

#### 4.2 Integration Tests
```rust
// src-tauri/tests/integration_tests.rs
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_http_client_health_check() {
        let client = GitInspectorClient::new("http://127.0.0.1:8080".to_string());
        let result = client.health_check().await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_execute_analysis_http() {
        let client = GitInspectorClient::new("http://127.0.0.1:8080".to_string());
        let settings = Settings {
            input_fstrs: vec!["/path/to/test/repo".to_string()],
            output_fstr: None,
        };
        
        let result = client.execute_analysis(settings).await;
        assert!(result.is_ok());
    }
}
```

## Migration Timeline

### Week 1: Foundation
- [x] Create architectural analysis
- [ ] Set up HTTP server structure
- [ ] Implement basic FastAPI server
- [ ] Add Pydantic models
- [ ] Basic health check endpoint

### Week 2: Integration
- [ ] Implement execute_analysis endpoint
- [ ] Create Tauri HTTP client
- [ ] Add server lifecycle management
- [ ] Feature flag for HTTP vs sidecar
- [ ] Error handling and logging

### Week 3: Testing & Polish
- [ ] Unit tests for HTTP API
- [ ] Integration tests
- [ ] Performance testing
- [ ] Documentation updates
- [ ] Cross-platform testing

### Week 4: Migration & Cleanup
- [ ] Default to HTTP mode
- [ ] Remove sidecar dependencies
- [ ] Update build scripts
- [ ] Final testing and validation

## Success Criteria

1. **Functionality**: All existing features work via HTTP API
2. **Reliability**: No more JSON parsing errors from stdout contamination
3. **Performance**: Analysis performance matches or exceeds sidecar
4. **Debugging**: Full logging capability without breaking communication
5. **Maintainability**: Clean separation of concerns, easy to extend
6. **Testing**: Comprehensive test coverage for HTTP API

## Risk Mitigation

1. **Backward Compatibility**: Keep sidecar as fallback during migration
2. **Port Conflicts**: Automatic port selection if default port busy
3. **Server Startup**: Graceful handling of server startup failures
4. **Cross-Platform**: Test on Windows, macOS, and Linux
5. **Performance**: Monitor and optimize HTTP overhead

This implementation plan provides a robust foundation for eliminating the stdout contamination issues while significantly improving the architecture's maintainability and debuggability.