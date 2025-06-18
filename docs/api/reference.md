# HTTP API Reference

GitInspectorGUI HTTP API documentation.

## For Python Developers

This API is built with FastAPI and follows standard HTTP conventions. If you're unfamiliar with FastAPI, see the **[Technology Primer](../technology-primer.md)** first.

**Key concept**: The frontend sends JSON requests to your Python backend via HTTP. You can test all endpoints directly with curl or Python requests.

## Configuration

-   **Base URL**: `http://127.0.0.1:8080`
-   **Content-Type**: `application/json`
-   **Timeout**: 30s (300s for analysis)

## Endpoints

| Endpoint                 | Method   | Purpose             | Response Time |
| ------------------------ | -------- | ------------------- | ------------- |
| `/health`                | GET      | Health check        | ~50ms         |
| `/api/execute_analysis`  | POST     | Repository analysis | 10s-300s      |
| `/api/settings`          | GET/POST | Settings management | ~100ms        |
| `/api/engine_info`       | GET      | Engine capabilities | ~50ms         |
| `/api/performance_stats` | GET      | Performance metrics | ~30ms         |

## Health Check

### `GET /health`

**Response:**

```json
{
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-06-02T15:00:00.000Z",
    "api_info": {
        "engine_version": "2.1.0",
        "supported_formats": ["json", "xml", "html"],
        "legacy_engine_available": true
    }
}
```

**Usage:**

```bash
curl http://127.0.0.1:8080/health
```

## Execute Analysis

### `POST /api/execute_analysis`

**Key Request Fields:**

```json
{
    "input_fstrs": ["/path/to/repository"],
    "n_files": 100,
    "ex_files": ["*.log", "*.tmp"],
    "extensions": [".py", ".js", ".ts"],
    "file_formats": ["json"],
    "processes": 4,
    "legacy_engine": false
}
```

**Python-focused example**:

```json
{
    "input_fstrs": ["/home/user/my-python-project"],
    "extensions": [".py"],
    "ex_files": ["*/venv/*", "*/migrations/*", "*.pyc"],
    "n_files": 50,
    "processes": 2
}
```

**Response:**

```json
{
    "repositories": [
        {
            "name": "repo-name",
            "path": "/path/to/repo",
            "commit_count": 1234,
            "author_count": 15,
            "authors": [{ "name": "...", "commits": 100 }],
            "files": [{ "name": "...", "lines": 500 }]
        }
    ],
    "summary": {
        "total_repositories": 1,
        "total_commits": 1234,
        "analysis_duration": 15.2
    }
}
```

**Usage:**

```bash
curl -X POST http://127.0.0.1:8080/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{"input_fstrs": ["/path/to/repo"], "file_formats": ["json"]}'
```

## Settings Management

### `GET /api/settings`

**Response:**

```json
{
    "input_fstrs": [],
    "n_files": 100,
    "file_formats": ["json"],
    "processes": 1,
    "legacy_engine": false
}
```

### `POST /api/settings`

**Request:** Same as GET response
**Response:**

```json
{
    "success": true,
    "message": "Settings saved successfully"
}
```

## Engine Information

### `GET /api/engine_info`

**Response:**

```json
{
    "engine_version": "2.1.0",
    "supported_formats": ["json", "xml", "html", "csv"],
    "legacy_engine_available": true,
    "features": {
        "blame_analysis": true,
        "rename_detection": true,
        "performance_monitoring": true
    }
}
```

## Performance Statistics

### `GET /api/performance_stats`

**Response:**

```json
{
    "uptime_seconds": 3600,
    "total_requests": 1247,
    "average_response_time": 0.3,
    "endpoints": {
        "/api/execute_analysis": {
            "requests": 45,
            "avg_response_time": 15.2
        }
    }
}
```

## Error Handling

**Error Format:**

```json
{
    "error": "Error category",
    "message": "Detailed description",
    "timestamp": "2025-06-02T15:00:00.000Z"
}
```

**Status Codes:**

-   `200` - Success
-   `400` - Invalid input/validation failed
-   `500` - Server error

## Client Examples

### Python

```python
import requests
import json

# Create a session for reusing connections
client = requests.Session()
client.timeout = 30

# Health check - verify the server is running
response = client.get("http://127.0.0.1:8080/health")
if response.status_code == 200:
    print("Server is healthy:", response.json()["status"])

# Analyze a Python project
settings = {
    "input_fstrs": ["/home/user/my-django-project"],
    "extensions": [".py"],  # Only analyze Python files
    "ex_files": ["*/venv/*", "*/migrations/*", "*.pyc"],  # Exclude common Python dirs
    "n_files": 100,
    "file_formats": ["json"]
}

# Execute analysis with longer timeout for large repositories
result = client.post("http://127.0.0.1:8080/api/execute_analysis",
                    json=settings, timeout=300)

if result.status_code == 200:
    data = result.json()
    print(f"Analysis complete: {data['summary']['total_commits']} commits analyzed")
    print(f"Top contributor: {data['repositories'][0]['authors'][0]['name']}")
else:
    print(f"Error: {result.status_code} - {result.text}")
```

**Testing your Python backend directly**:

```python
# Quick test script for development
import requests

def test_api():
    base_url = "http://127.0.0.1:8080"

    # Test health endpoint
    health = requests.get(f"{base_url}/health")
    print("Health check:", health.json())

    # Test with a small repository
    test_settings = {
        "input_fstrs": ["/path/to/small/test/repo"],
        "n_files": 10,
        "file_formats": ["json"]
    }

    analysis = requests.post(f"{base_url}/api/execute_analysis",
                           json=test_settings, timeout=60)

    if analysis.status_code == 200:
        print("Analysis successful!")
        return analysis.json()
    else:
        print(f"Analysis failed: {analysis.text}")
        return None

if __name__ == "__main__":
    result = test_api()
```

### Rust

```rust
let client = reqwest::Client::new();
let settings = json!({"input_fstrs": ["/path/to/repo"]});

let response = client
    .post("http://127.0.0.1:8080/api/execute_analysis")
    .json(&settings)
    .timeout(Duration::from_secs(300))
    .send()
    .await?;
```

## Troubleshooting

**Connection Issues:**

```bash
python -m gigui.start_server  # Start server
curl http://127.0.0.1:8080/health  # Test connection
```

**Performance Issues:**

-   Reduce `n_files` setting
-   Use `ex_files` to exclude large files
-   Adjust `processes` count

**Debug Mode:**

```bash
python -m gigui.start_server --log-level DEBUG
```

## Documentation

-   **Swagger UI**: `http://127.0.0.1:8080/docs`
-   **ReDoc**: `http://127.0.0.1:8080/redoc`
-   **OpenAPI JSON**: `http://127.0.0.1:8080/openapi.json`
