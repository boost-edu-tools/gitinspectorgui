# HTTP API Reference Guide

## Overview

This document provides comprehensive documentation for the GitInspectorGUI HTTP API, including all endpoints, request/response schemas, error handling, and practical examples.

## Base Configuration

- **Base URL**: `http://127.0.0.1:8080`
- **Content-Type**: `application/json`
- **Timeout**: 30 seconds
- **Retry Logic**: 3 attempts with exponential backoff

## Authentication

Currently, the API runs on localhost without authentication. For production deployments, consider implementing:
- API key authentication
- HTTPS with TLS certificates
- Rate limiting and request validation

## Endpoints Overview

| Endpoint | Method | Purpose | Response Time |
|----------|--------|---------|---------------|
| `/health` | GET | Health check and server status | ~50ms |
| `/api/execute_analysis` | POST | Execute repository analysis | 10s-300s |
| `/api/settings` | GET | Retrieve current settings | ~100ms |
| `/api/settings` | POST | Save settings configuration | ~200ms |
| `/api/engine_info` | GET | Get engine capabilities | ~50ms |
| `/api/performance_stats` | GET | Get performance metrics | ~30ms |

---

## 1. Health Check

### `GET /health`

Check server health and get basic system information.

#### Request
```http
GET /health HTTP/1.1
Host: 127.0.0.1:8080
```

#### Response
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-06-02T15:00:00.000Z",
  "api_info": {
    "engine_version": "2.1.0",
    "supported_formats": ["json", "xml", "html"],
    "legacy_engine_available": true,
    "performance_monitoring": true
  }
}
```

#### Status Codes
- `200 OK`: Server is healthy and operational
- `500 Internal Server Error`: Server has issues

#### Example Usage

**cURL:**
```bash
curl -X GET http://127.0.0.1:8080/health
```

**Python:**
```python
import requests

response = requests.get("http://127.0.0.1:8080/health")
if response.status_code == 200:
    health_data = response.json()
    print(f"Server status: {health_data['status']}")
else:
    print("Server is not responding")
```

**Rust (reqwest):**
```rust
let response = reqwest::get("http://127.0.0.1:8080/health").await?;
if response.status().is_success() {
    let health: serde_json::Value = response.json().await?;
    println!("Server status: {}", health["status"]);
}
```

---

## 2. Execute Analysis

### `POST /api/execute_analysis`

Execute git repository analysis with specified settings.

#### Request Schema

```json
{
  "input_fstrs": ["string"],
  "depth": 0,
  "subfolder": "string",
  "n_files": 0,
  "include_files": ["string"],
  "ex_files": ["string"],
  "extensions": ["string"],
  "ex_authors": ["string"],
  "ex_emails": ["string"],
  "ex_revisions": ["string"],
  "ex_messages": ["string"],
  "since": "string",
  "until": "string",
  "outfile_base": "string",
  "fix": "string",
  "file_formats": ["string"],
  "view": "string",
  "copy_move": 0,
  "scaled_percentages": false,
  "blame_exclusions": "string",
  "blame_skip": false,
  "show_renames": false,
  "deletions": false,
  "whitespace": false,
  "empty_lines": false,
  "comments": false,
  "processes": 1,
  "legacy_engine": false,
  "enhanced_settings": {}
}
```

#### Response Schema

```json
{
  "repositories": [
    {
      "name": "string",
      "path": "string",
      "analysis_date": "2025-06-02T15:00:00.000Z",
      "commit_count": 0,
      "author_count": 0,
      "file_count": 0,
      "authors": [
        {
          "name": "string",
          "email": "string",
          "commits": 0,
          "insertions": 0,
          "deletions": 0,
          "files_changed": 0
        }
      ],
      "files": [
        {
          "name": "string",
          "path": "string",
          "lines": 0,
          "commits": 0,
          "authors": ["string"]
        }
      ],
      "timeline": [
        {
          "date": "2025-06-02",
          "commits": 0,
          "insertions": 0,
          "deletions": 0
        }
      ]
    }
  ],
  "summary": {
    "total_repositories": 0,
    "total_commits": 0,
    "total_authors": 0,
    "analysis_duration": 0.0,
    "settings_used": {}
  }
}
```

#### Example Request

```json
{
  "input_fstrs": ["/path/to/repository"],
  "depth": 0,
  "subfolder": "",
  "n_files": 100,
  "include_files": [],
  "ex_files": ["*.log", "*.tmp"],
  "extensions": [".py", ".js", ".ts"],
  "ex_authors": [],
  "ex_emails": [],
  "ex_revisions": [],
  "ex_messages": [],
  "since": "",
  "until": "",
  "outfile_base": "analysis",
  "fix": "",
  "file_formats": ["json"],
  "view": "detailed",
  "copy_move": 90,
  "scaled_percentages": true,
  "blame_exclusions": "",
  "blame_skip": false,
  "show_renames": true,
  "deletions": true,
  "whitespace": false,
  "empty_lines": false,
  "comments": true,
  "processes": 4,
  "legacy_engine": false,
  "enhanced_settings": {
    "enable_caching": true,
    "detailed_blame": true
  }
}
```

#### Status Codes
- `200 OK`: Analysis completed successfully
- `400 Bad Request`: Invalid settings or validation failed
- `500 Internal Server Error`: Analysis execution failed

#### Example Usage

**cURL:**
```bash
curl -X POST http://127.0.0.1:8080/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{
    "input_fstrs": ["/path/to/repo"],
    "depth": 0,
    "n_files": 100,
    "file_formats": ["json"]
  }'
```

**Python:**
```python
import requests

settings = {
    "input_fstrs": ["/path/to/repository"],
    "depth": 0,
    "n_files": 100,
    "file_formats": ["json"],
    "processes": 4
}

response = requests.post(
    "http://127.0.0.1:8080/api/execute_analysis",
    json=settings,
    timeout=300
)

if response.status_code == 200:
    result = response.json()
    print(f"Analyzed {result['summary']['total_repositories']} repositories")
    print(f"Found {result['summary']['total_commits']} commits")
else:
    print(f"Analysis failed: {response.text}")
```

**Rust:**
```rust
use serde_json::json;

let settings = json!({
    "input_fstrs": ["/path/to/repository"],
    "depth": 0,
    "n_files": 100,
    "file_formats": ["json"],
    "processes": 4
});

let client = reqwest::Client::new();
let response = client
    .post("http://127.0.0.1:8080/api/execute_analysis")
    .json(&settings)
    .timeout(Duration::from_secs(300))
    .send()
    .await?;

if response.status().is_success() {
    let result: serde_json::Value = response.json().await?;
    println!("Analysis completed successfully");
} else {
    println!("Analysis failed: {}", response.text().await?);
}
```

---

## 3. Get Settings

### `GET /api/settings`

Retrieve current default settings configuration.

#### Request
```http
GET /api/settings HTTP/1.1
Host: 127.0.0.1:8080
```

#### Response
Returns the complete settings object with all default values:

```json
{
  "input_fstrs": [],
  "depth": 0,
  "subfolder": "",
  "n_files": 100,
  "include_files": [],
  "ex_files": [],
  "extensions": [],
  "ex_authors": [],
  "ex_emails": [],
  "ex_revisions": [],
  "ex_messages": [],
  "since": "",
  "until": "",
  "outfile_base": "gitinspector",
  "fix": "",
  "file_formats": ["json"],
  "view": "detailed",
  "copy_move": 90,
  "scaled_percentages": false,
  "blame_exclusions": "",
  "blame_skip": false,
  "show_renames": false,
  "deletions": false,
  "whitespace": false,
  "empty_lines": false,
  "comments": false,
  "processes": 1,
  "legacy_engine": false,
  "enhanced_settings": {}
}
```

#### Status Codes
- `200 OK`: Settings retrieved successfully
- `500 Internal Server Error`: Failed to load settings

#### Example Usage

**Python:**
```python
import requests

response = requests.get("http://127.0.0.1:8080/api/settings")
if response.status_code == 200:
    settings = response.json()
    print(f"Default processes: {settings['processes']}")
    print(f"Default file formats: {settings['file_formats']}")
```

---

## 4. Save Settings

### `POST /api/settings`

Save settings configuration as new defaults.

#### Request Schema
Same as the settings object from GET /api/settings.

#### Response
```json
{
  "success": true,
  "message": "Settings saved successfully"
}
```

#### Status Codes
- `200 OK`: Settings saved successfully
- `400 Bad Request`: Invalid settings format
- `500 Internal Server Error`: Failed to save settings

#### Example Usage

**Python:**
```python
import requests

# Get current settings
current_settings = requests.get("http://127.0.0.1:8080/api/settings").json()

# Modify settings
current_settings["processes"] = 8
current_settings["file_formats"] = ["json", "xml"]

# Save updated settings
response = requests.post(
    "http://127.0.0.1:8080/api/settings",
    json=current_settings
)

if response.status_code == 200:
    print("Settings saved successfully")
```

---

## 5. Engine Information

### `GET /api/engine_info`

Get information about the analysis engine capabilities.

#### Request
```http
GET /api/engine_info HTTP/1.1
Host: 127.0.0.1:8080
```

#### Response
```json
{
  "engine_version": "2.1.0",
  "supported_formats": ["json", "xml", "html", "csv"],
  "legacy_engine_available": true,
  "features": {
    "blame_analysis": true,
    "rename_detection": true,
    "copy_move_detection": true,
    "performance_monitoring": true,
    "enhanced_settings": true
  },
  "limits": {
    "max_repositories": 100,
    "max_file_size": "100MB",
    "max_commit_count": 1000000
  },
  "performance": {
    "recommended_processes": 4,
    "memory_usage": "moderate",
    "disk_space_required": "minimal"
  }
}
```

#### Status Codes
- `200 OK`: Engine information retrieved successfully

---

## 6. Performance Statistics

### `GET /api/performance_stats`

Get current API performance statistics and metrics.

#### Request
```http
GET /api/performance_stats HTTP/1.1
Host: 127.0.0.1:8080
```

#### Response
```json
{
  "uptime_seconds": 3600,
  "total_requests": 1247,
  "successful_requests": 1237,
  "failed_requests": 10,
  "average_response_time": 0.3,
  "error_rate": 0.008,
  "endpoints": {
    "/api/execute_analysis": {
      "requests": 45,
      "avg_response_time": 15.2,
      "success_rate": 0.98
    },
    "/api/settings": {
      "requests": 892,
      "avg_response_time": 0.1,
      "success_rate": 1.0
    },
    "/health": {
      "requests": 310,
      "avg_response_time": 0.05,
      "success_rate": 1.0
    }
  },
  "system": {
    "memory_usage": "245MB",
    "cpu_usage": "12%",
    "disk_usage": "1.2GB"
  }
}
```

#### Status Codes
- `200 OK`: Performance statistics retrieved successfully

---

## Error Handling

### Error Response Format

All API errors return a consistent JSON structure:

```json
{
  "error": "Error category",
  "message": "Detailed error description",
  "timestamp": "2025-06-02T15:00:00.000Z",
  "request_id": "uuid-string"
}
```

### Common Error Scenarios

#### 1. Settings Validation Error (400)
```json
{
  "error": "Settings validation failed",
  "message": "Repository path '/invalid/path' does not exist",
  "timestamp": "2025-06-02T15:00:00.000Z",
  "request_id": "12345678-1234-1234-1234-123456789012"
}
```

#### 2. Analysis Execution Error (500)
```json
{
  "error": "Analysis failed",
  "message": "Git repository not found at specified path",
  "timestamp": "2025-06-02T15:00:00.000Z",
  "request_id": "12345678-1234-1234-1234-123456789012"
}
```

#### 3. Server Error (500)
```json
{
  "error": "Internal server error",
  "message": "Unexpected error during processing",
  "timestamp": "2025-06-02T15:00:00.000Z",
  "request_id": "12345678-1234-1234-1234-123456789012"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input or validation failed |
| 500 | Internal Server Error | Server-side processing error |
| 503 | Service Unavailable | Server overloaded or maintenance |

---

## Rate Limiting

Currently, no rate limiting is implemented. For production deployments, consider:

- **Per-IP limits**: 100 requests per minute
- **Analysis limits**: 5 concurrent analyses per client
- **Settings limits**: 10 saves per minute

---

## Monitoring and Logging

### Request Logging

All requests are logged with the following format:
```
2025-06-02 15:00:00 - gigui.http_server - INFO - [request-id] Starting analysis for 3 repositories
2025-06-02 15:00:15 - gigui.http_server - INFO - [request-id] Analysis completed: 3 repositories
```

### Health Monitoring

Monitor these endpoints for system health:
- `GET /health` - Overall system status
- `GET /api/performance_stats` - Performance metrics

### Log Files

- **Application logs**: `gitinspector-api.log`
- **Access logs**: Console output (uvicorn)
- **Error logs**: Included in application logs with stack traces

---

## Client Libraries

### Python Client Example

```python
import requests
from typing import Dict, Any, Optional

class GitInspectorClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8080"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30
    
    def health_check(self) -> bool:
        try:
            response = self.session.get(f"{self.base_url}/health")
            return response.status_code == 200
        except:
            return False
    
    def execute_analysis(self, settings: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        response = self.session.post(
            f"{self.base_url}/api/execute_analysis",
            json=settings,
            timeout=300
        )
        response.raise_for_status()
        return response.json()
    
    def get_settings(self) -> Dict[str, Any]:
        response = self.session.get(f"{self.base_url}/api/settings")
        response.raise_for_status()
        return response.json()
    
    def save_settings(self, settings: Dict[str, Any]) -> bool:
        response = self.session.post(
            f"{self.base_url}/api/settings",
            json=settings
        )
        response.raise_for_status()
        return response.json().get("success", False)

# Usage
client = GitInspectorClient()
if client.health_check():
    settings = client.get_settings()
    settings["input_fstrs"] = ["/path/to/repo"]
    result = client.execute_analysis(settings)
    print(f"Analysis found {result['summary']['total_commits']} commits")
```

### Rust Client Example

```rust
use reqwest;
use serde_json::{json, Value};
use std::time::Duration;

pub struct GitInspectorClient {
    client: reqwest::Client,
    base_url: String,
}

impl GitInspectorClient {
    pub fn new(base_url: String) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");
        
        Self { client, base_url }
    }

    pub async fn health_check(&self) -> Result<bool, reqwest::Error> {
        let response = self.client
            .get(&format!("{}/health", self.base_url))
            .send()
            .await?;
        Ok(response.status().is_success())
    }

    pub async fn execute_analysis(&self, settings: Value) -> Result<Value, reqwest::Error> {
        let response = self.client
            .post(&format!("{}/api/execute_analysis", self.base_url))
            .json(&settings)
            .timeout(Duration::from_secs(300))
            .send()
            .await?;
        
        response.error_for_status()?.json().await
    }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Refused
**Error**: `Connection refused (os error 61)`
**Solution**: Ensure the HTTP server is running:
```bash
python -m gigui.start_server
```

#### 2. Timeout Errors
**Error**: `Request timeout after 30 seconds`
**Solutions**:
- Reduce repository size or file count
- Increase timeout in client
- Use fewer processes for analysis

#### 3. Memory Issues
**Error**: `Analysis failed: Out of memory`
**Solutions**:
- Reduce `n_files` setting
- Use `ex_files` to exclude large files
- Increase system memory

#### 4. Permission Errors
**Error**: `Permission denied accessing repository`
**Solutions**:
- Check file permissions
- Run server with appropriate user
- Verify repository path accessibility

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export GIGUI_LOG_LEVEL=DEBUG
python -m gigui.start_server
```

### Testing Endpoints

Use the provided health check to verify connectivity:
```bash
curl -v http://127.0.0.1:8080/health
```

---

## OpenAPI Documentation

The API automatically generates OpenAPI documentation available at:
- **Swagger UI**: `http://127.0.0.1:8080/docs`
- **ReDoc**: `http://127.0.0.1:8080/redoc`
- **OpenAPI JSON**: `http://127.0.0.1:8080/openapi.json`

---

**Last Updated**: June 2025  
**API Version**: 1.0.0  
**Server Implementation**: [http_server.py](../../python/gigui/http_server.py)  
**Client Implementation**: [commands.rs](../../src-tauri/src/commands.rs)