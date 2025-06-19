# API Examples

Practical examples for GitInspectorGUI HTTP API usage.

## Quick Start

### Health Check

```bash
curl http://127.0.0.1:8000/health
```

**Response:**

```json
{
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-06-05T20:52:00.000Z"
}
```

### Basic Analysis

```bash
curl -X POST http://127.0.0.1:8000/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{"input_fstrs": ["/path/to/repo"], "n_files": 100}'
```

## Analysis Examples

### Filtered Analysis

```json
{
    "input_fstrs": ["/path/to/repo"],
    "n_files": 200,
    "extensions": [".py", ".js", ".ts"],
    "ex_files": ["*.test.js", "node_modules/*", "dist/*"],
    "since": "2024-01-01",
    "processes": 4
}
```

### Multiple Repositories

```json
{
    "input_fstrs": ["/path/to/frontend", "/path/to/backend", "/path/to/shared"],
    "extensions": [".py", ".js", ".ts", ".jsx", ".tsx"],
    "n_files": 100
}
```

### Response Format

```json
{
    "repositories": [
        {
            "name": "repo-name",
            "commit_count": 156,
            "author_count": 3,
            "authors": [{ "name": "John", "commits": 78 }]
        }
    ],
    "summary": {
        "total_commits": 156,
        "analysis_duration": 2.34
    }
}
```

## Client Examples

### Python

```python
import requests

API_BASE = "http://127.0.0.1:8000"

# Health check
response = requests.get(f"{API_BASE}/health")
print(f"Status: {response.json()['status']}")

# Analysis
config = {
    "input_fstrs": ["/path/to/repo"],
    "extensions": [".py", ".js", ".ts"],
    "n_files": 100
}

response = requests.post(f"{API_BASE}/api/execute_analysis", json=config)
if response.status_code == 200:
    results = response.json()
    print(f"Commits: {results['summary']['total_commits']}")
```

### TypeScript

```typescript
class GitInspectorAPI {
    private baseUrl = "http://127.0.0.1:8000";

    async healthCheck(): Promise<boolean> {
        const response = await fetch(`${this.baseUrl}/health`);
        const data = await response.json();
        return data.status === "healthy";
    }

    async analyze(config: any): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/execute_analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(config),
        });
        return response.json();
    }
}
```

### Bash

```bash
#!/bin/bash
API_BASE="http://127.0.0.1:8000"

# Health check
curl -s "$API_BASE/health" | jq -r '.status'

# Analysis
curl -X POST "$API_BASE/api/execute_analysis" \
  -H "Content-Type: application/json" \
  -d '{"input_fstrs": ["/path/to/repo"], "n_files": 100}' \
  | jq '.summary.total_commits'
```

## Settings Management

### Get Settings

```bash
curl http://127.0.0.1:8000/api/settings
```

### Update Settings

```bash
curl -X POST http://127.0.0.1:8000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"n_files": 200, "processes": 4}'
```

## Error Handling

### Python Error Handling

```python
import requests
from requests.exceptions import ConnectionError, Timeout

def safe_api_call(url, **kwargs):
    try:
        response = requests.post(url, timeout=30, **kwargs)
        response.raise_for_status()
        return response.json()
    except ConnectionError:
        print("Cannot connect to server")
        return None
    except Timeout:
        print("Request timed out")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e.response.status_code}")
        return None
```

## Performance Tips

### Batch Analysis

```python
import asyncio
import aiohttp

async def analyze_batch(repo_paths):
    async def analyze_repo(session, path):
        config = {"input_fstrs": [path], "n_files": 50}
        async with session.post(
            "http://127.0.0.1:8000/api/execute_analysis",
            json=config
        ) as response:
            return await response.json() if response.status == 200 else None

    async with aiohttp.ClientSession() as session:
        tasks = [analyze_repo(session, path) for path in repo_paths]
        return await asyncio.gather(*tasks)
```

### Incremental Analysis

```python
from datetime import datetime, timedelta

def incremental_analysis(repo_path, days_back=30):
    since_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    config = {
        "input_fstrs": [repo_path],
        "since": since_date,
        "n_files": 200
    }
    return requests.post("http://127.0.0.1:8000/api/execute_analysis", json=config)
```

## Related

-   **[API Reference](reference.md)** - Complete API documentation
-   **[Error Handling](error-handling.md)** - Error codes and troubleshooting
