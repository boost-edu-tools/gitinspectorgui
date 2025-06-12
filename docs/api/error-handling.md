# Error Handling

Error handling patterns for GitInspectorGUI HTTP API.

## Status Codes

| Code  | Meaning          | Description             |
| ----- | ---------------- | ----------------------- |
| `200` | OK               | Request successful      |
| `400` | Bad Request      | Invalid parameters      |
| `422` | Validation Error | Input validation failed |
| `500` | Server Error     | Internal server error   |
| `503` | Unavailable      | Server temporarily down |

## Error Format

```json
{
    "error": "error_type",
    "message": "Human-readable description",
    "details": { "field": "specific_details" },
    "timestamp": "2025-06-05T20:53:00.000Z"
}
```

## Common Errors

### Validation Errors (400/422)

```json
{
    "error": "validation_error",
    "message": "Repository path is invalid",
    "details": { "field": "input_fstrs", "reason": "Directory does not exist" }
}
```

### Repository Errors (400)

```json
{
    "error": "repository_error",
    "message": "Not a valid git repository",
    "details": { "path": "/path/to/folder", "reason": "No .git directory" }
}
```

### Analysis Errors (500)

```json
{
    "error": "analysis_error",
    "message": "Analysis timed out",
    "details": { "timeout_seconds": 300, "reason": "Repository too large" }
}
```

### Server Errors (500/503)

```json
{
    "error": "internal_error",
    "message": "Unexpected error occurred",
    "details": { "code": "UNEXPECTED_ERROR" }
}
```

## Handling Strategies

### Basic Error Handling

```python
import requests

def handle_response(response):
    if response.status_code == 200:
        return response.json()

    try:
        error_data = response.json()
        print(f"Error ({response.status_code}): {error_data['message']}")
        return None
    except ValueError:
        print(f"HTTP Error {response.status_code}: {response.text}")
        return None
```

### Retry Logic

```python
import time
import random

def api_call_with_retry(url, max_retries=3, **kwargs):
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(url, **kwargs)
            if response.status_code == 200:
                return response.json()

            # Don't retry client errors (4xx)
            if 400 <= response.status_code < 500:
                return None

            # Retry server errors (5xx)
            if response.status_code >= 500 and attempt < max_retries:
                delay = (2 ** attempt) + random.uniform(0, 1)
                time.sleep(delay)
                continue

        except requests.exceptions.ConnectionError:
            if attempt < max_retries:
                time.sleep(2 ** attempt)
                continue
        except requests.exceptions.Timeout:
            if attempt < max_retries:
                continue

    return None
```

## Prevention

### Input Validation

```python
import os
from datetime import datetime

def validate_request(config):
    errors = {}

    # Check repository paths
    paths = config.get('input_fstrs', [])
    for i, path in enumerate(paths):
        if not os.path.exists(path):
            errors[f'path[{i}]'] = f"Path does not exist: {path}"
        elif not os.path.exists(os.path.join(path, '.git')):
            errors[f'path[{i}]'] = f"Not a git repository: {path}"

    # Check date formats
    for field in ['since', 'until']:
        if field in config:
            try:
                datetime.strptime(config[field], '%Y-%m-%d')
            except ValueError:
                errors[field] = "Use YYYY-MM-DD format"

    return errors
```

### Health Check

```python
def check_api_health(base_url="http://127.0.0.1:8080"):
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        return response.status_code == 200 and response.json().get('status') == 'healthy'
    except:
        return False
```

## Best Practices

1. **Check status codes** before processing responses
2. **Implement retry logic** for server errors (5xx)
3. **Validate inputs** before API calls
4. **Use timeouts** to prevent hanging
5. **Log errors** with context
6. **Handle network errors** gracefully
7. **Monitor API health** before requests
8. **Test error scenarios** during development

## Related

-   **[API Reference](reference.md)** - Complete API documentation
-   **[API Examples](examples.md)** - Usage examples and patterns
