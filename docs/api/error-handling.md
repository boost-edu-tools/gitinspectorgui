# Error Handling Guide

Comprehensive guide for handling errors when using the GitInspectorGUI HTTP API.

## HTTP Status Codes

The API uses standard HTTP status codes to indicate the success or failure of requests:

| Status Code | Meaning               | Description                      |
| ----------- | --------------------- | -------------------------------- |
| `200`       | OK                    | Request successful               |
| `400`       | Bad Request           | Invalid request parameters       |
| `401`       | Unauthorized          | Authentication required (future) |
| `404`       | Not Found             | Endpoint or resource not found   |
| `422`       | Unprocessable Entity  | Validation errors                |
| `500`       | Internal Server Error | Server-side error                |
| `503`       | Service Unavailable   | Server temporarily unavailable   |

## Error Response Format

All error responses follow a consistent JSON format:

```json
{
    "error": "error_type",
    "message": "Human-readable error description",
    "details": {
        "field": "specific_error_details",
        "code": "ERROR_CODE"
    },
    "timestamp": "2025-06-05T20:53:00.000Z",
    "request_id": "req_123456789"
}
```

## Common Error Types

### 1. Validation Errors (400/422)

**Invalid Repository Path:**

```json
{
    "error": "validation_error",
    "message": "Repository path is invalid or inaccessible",
    "details": {
        "field": "input_fstrs",
        "path": "/invalid/path",
        "reason": "Directory does not exist"
    }
}
```

**Missing Required Fields:**

```json
{
    "error": "validation_error",
    "message": "Required field missing",
    "details": {
        "field": "input_fstrs",
        "code": "FIELD_REQUIRED"
    }
}
```

**Invalid Date Format:**

```json
{
    "error": "validation_error",
    "message": "Invalid date format",
    "details": {
        "field": "since",
        "value": "invalid-date",
        "expected_format": "YYYY-MM-DD"
    }
}
```

### 2. Repository Errors (400)

**Not a Git Repository:**

```json
{
    "error": "repository_error",
    "message": "Path is not a valid git repository",
    "details": {
        "path": "/path/to/folder",
        "reason": "No .git directory found"
    }
}
```

**Permission Denied:**

```json
{
    "error": "repository_error",
    "message": "Permission denied accessing repository",
    "details": {
        "path": "/restricted/repo",
        "reason": "Insufficient file permissions"
    }
}
```

**Empty Repository:**

```json
{
    "error": "repository_error",
    "message": "Repository has no commits",
    "details": {
        "path": "/empty/repo",
        "reason": "No commits found in specified date range"
    }
}
```

### 3. Analysis Errors (500)

**Analysis Timeout:**

```json
{
    "error": "analysis_error",
    "message": "Analysis timed out",
    "details": {
        "timeout_seconds": 300,
        "reason": "Repository too large or system overloaded"
    }
}
```

**Git Command Failed:**

```json
{
    "error": "analysis_error",
    "message": "Git command execution failed",
    "details": {
        "command": "git log --since=2024-01-01",
        "exit_code": 128,
        "stderr": "fatal: bad revision '2024-01-01'"
    }
}
```

**Memory Error:**

```json
{
    "error": "analysis_error",
    "message": "Insufficient memory to complete analysis",
    "details": {
        "reason": "Repository too large for available memory",
        "suggestion": "Try reducing the analysis scope or increasing system memory"
    }
}
```

### 4. Server Errors (500/503)

**Internal Server Error:**

```json
{
    "error": "internal_error",
    "message": "An unexpected error occurred",
    "details": {
        "code": "UNEXPECTED_ERROR",
        "request_id": "req_123456789"
    }
}
```

**Service Unavailable:**

```json
{
    "error": "service_unavailable",
    "message": "Server is temporarily unavailable",
    "details": {
        "reason": "Server maintenance in progress",
        "retry_after": 300
    }
}
```

## Error Handling Strategies

### 1. Basic Error Handling

```python
import requests
from requests.exceptions import RequestException

def handle_api_response(response):
    """Handle API response with proper error checking."""

    if response.status_code == 200:
        return response.json()

    try:
        error_data = response.json()
        error_type = error_data.get('error', 'unknown_error')
        message = error_data.get('message', 'Unknown error occurred')
        details = error_data.get('details', {})

        print(f"API Error ({response.status_code}): {error_type}")
        print(f"Message: {message}")

        if details:
            print("Details:")
            for key, value in details.items():
                print(f"  {key}: {value}")

    except ValueError:
        # Response is not JSON
        print(f"HTTP Error {response.status_code}: {response.text}")

    return None

# Usage
response = requests.post("http://127.0.0.1:8080/api/execute_analysis", json={})
result = handle_api_response(response)
```

### 2. Retry Logic with Exponential Backoff

```python
import time
import random
from typing import Optional, Dict, Any

def api_call_with_retry(
    url: str,
    method: str = 'GET',
    max_retries: int = 3,
    base_delay: float = 1.0,
    **kwargs
) -> Optional[Dict[Any, Any]]:
    """Make API call with retry logic and exponential backoff."""

    for attempt in range(max_retries + 1):
        try:
            if method.upper() == 'GET':
                response = requests.get(url, **kwargs)
            elif method.upper() == 'POST':
                response = requests.post(url, **kwargs)
            else:
                raise ValueError(f"Unsupported method: {method}")

            # Success case
            if response.status_code == 200:
                return response.json()

            # Client errors (4xx) - don't retry
            if 400 <= response.status_code < 500:
                print(f"Client error {response.status_code}: {response.text}")
                return None

            # Server errors (5xx) - retry
            if response.status_code >= 500:
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    print(f"Server error {response.status_code}, retrying in {delay:.1f}s...")
                    time.sleep(delay)
                    continue
                else:
                    print(f"Max retries exceeded. Last error: {response.status_code}")
                    return None

        except requests.exceptions.ConnectionError:
            if attempt < max_retries:
                delay = base_delay * (2 ** attempt)
                print(f"Connection error, retrying in {delay:.1f}s...")
                time.sleep(delay)
                continue
            else:
                print("Connection failed after all retries")
                return None

        except requests.exceptions.Timeout:
            if attempt < max_retries:
                print(f"Request timed out, retrying...")
                time.sleep(base_delay)
                continue
            else:
                print("Request timed out after all retries")
                return None

    return None

# Usage
result = api_call_with_retry(
    "http://127.0.0.1:8080/api/execute_analysis",
    method='POST',
    json={"input_fstrs": ["/path/to/repo"]},
    headers={"Content-Type": "application/json"},
    timeout=30
)
```

### 3. Comprehensive Error Handler Class

```python
import logging
from enum import Enum
from typing import Optional, Dict, Any, Callable

class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class APIErrorHandler:
    """Comprehensive error handler for GitInspectorGUI API."""

    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)
        self.error_callbacks: Dict[str, Callable] = {}

    def register_error_callback(self, error_type: str, callback: Callable):
        """Register a callback for specific error types."""
        self.error_callbacks[error_type] = callback

    def get_error_severity(self, status_code: int, error_type: str) -> ErrorSeverity:
        """Determine error severity based on status code and type."""
        if status_code >= 500:
            return ErrorSeverity.CRITICAL
        elif error_type in ['repository_error', 'analysis_error']:
            return ErrorSeverity.HIGH
        elif status_code >= 400:
            return ErrorSeverity.MEDIUM
        else:
            return ErrorSeverity.LOW

    def handle_error(self, response: requests.Response) -> Optional[Dict[str, Any]]:
        """Handle API error response."""
        try:
            error_data = response.json()
        except ValueError:
            error_data = {
                "error": "parse_error",
                "message": f"Could not parse error response: {response.text}",
                "details": {"status_code": response.status_code}
            }

        error_type = error_data.get('error', 'unknown_error')
        message = error_data.get('message', 'Unknown error')
        details = error_data.get('details', {})
        severity = self.get_error_severity(response.status_code, error_type)

        # Log the error
        log_message = f"API Error: {error_type} - {message}"
        if severity == ErrorSeverity.CRITICAL:
            self.logger.critical(log_message, extra={"details": details})
        elif severity == ErrorSeverity.HIGH:
            self.logger.error(log_message, extra={"details": details})
        elif severity == ErrorSeverity.MEDIUM:
            self.logger.warning(log_message, extra={"details": details})
        else:
            self.logger.info(log_message, extra={"details": details})

        # Execute registered callback if available
        if error_type in self.error_callbacks:
            try:
                self.error_callbacks[error_type](error_data, response)
            except Exception as e:
                self.logger.error(f"Error callback failed: {e}")

        return error_data

    def should_retry(self, error_data: Dict[str, Any], status_code: int) -> bool:
        """Determine if the request should be retried."""
        # Don't retry client errors (4xx)
        if 400 <= status_code < 500:
            return False

        # Retry server errors (5xx)
        if status_code >= 500:
            return True

        # Don't retry specific error types
        non_retryable_errors = [
            'validation_error',
            'repository_error',
            'permission_error'
        ]

        error_type = error_data.get('error', '')
        return error_type not in non_retryable_errors

# Usage example
def on_repository_error(error_data, response):
    """Handle repository-specific errors."""
    details = error_data.get('details', {})
    path = details.get('path', 'unknown')
    print(f"Repository error for {path}: {error_data['message']}")

    # Suggest solutions
    if 'permission' in error_data['message'].lower():
        print("💡 Try: chmod +r /path/to/repository")
    elif 'not a valid git repository' in error_data['message']:
        print("💡 Try: git init or check the path")

# Setup error handler
error_handler = APIErrorHandler()
error_handler.register_error_callback('repository_error', on_repository_error)

# Make API call with error handling
response = requests.post("http://127.0.0.1:8080/api/execute_analysis", json={})
if response.status_code != 200:
    error_data = error_handler.handle_error(response)
    should_retry = error_handler.should_retry(error_data, response.status_code)
    print(f"Should retry: {should_retry}")
```

## Error Prevention

### 1. Input Validation

```python
import os
from pathlib import Path
from datetime import datetime

def validate_analysis_request(config: Dict[str, Any]) -> Dict[str, str]:
    """Validate analysis request before sending to API."""
    errors = {}

    # Validate repository paths
    input_fstrs = config.get('input_fstrs', [])
    if not input_fstrs:
        errors['input_fstrs'] = "At least one repository path is required"
    else:
        for i, path in enumerate(input_fstrs):
            if not os.path.exists(path):
                errors[f'input_fstrs[{i}]'] = f"Path does not exist: {path}"
            elif not os.path.isdir(path):
                errors[f'input_fstrs[{i}]'] = f"Path is not a directory: {path}"
            elif not os.path.exists(os.path.join(path, '.git')):
                errors[f'input_fstrs[{i}]'] = f"Not a git repository: {path}"

    # Validate date formats
    for date_field in ['since', 'until']:
        date_value = config.get(date_field)
        if date_value:
            try:
                datetime.strptime(date_value, '%Y-%m-%d')
            except ValueError:
                errors[date_field] = f"Invalid date format. Use YYYY-MM-DD"

    # Validate numeric fields
    numeric_fields = ['depth', 'n_files', 'processes']
    for field in numeric_fields:
        value = config.get(field)
        if value is not None:
            if not isinstance(value, int) or value < 0:
                errors[field] = f"{field} must be a non-negative integer"

    return errors

# Usage
config = {
    "input_fstrs": ["/path/to/repo"],
    "since": "2024-01-01",
    "n_files": 100
}

validation_errors = validate_analysis_request(config)
if validation_errors:
    print("Validation errors:")
    for field, error in validation_errors.items():
        print(f"  {field}: {error}")
else:
    # Proceed with API call
    response = requests.post("http://127.0.0.1:8080/api/execute_analysis", json=config)
```

### 2. Health Checks

```python
def check_api_health(base_url: str = "http://127.0.0.1:8080") -> bool:
    """Check if the API server is healthy before making requests."""
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            return health_data.get('status') == 'healthy'
    except Exception as e:
        print(f"Health check failed: {e}")

    return False

# Usage
if not check_api_health():
    print("❌ API server is not available")
    print("Please start the server: python -m gigui.start_server")
    exit(1)

print("✅ API server is healthy")
```

## Debugging Tips

### 1. Enable Detailed Logging

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Enable requests logging
import http.client as http_client
http_client.HTTPConnection.debuglevel = 1

requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(logging.DEBUG)
requests_log.propagate = True
```

### 2. Request/Response Inspection

```python
def debug_api_call(url, method='GET', **kwargs):
    """Make API call with detailed debugging information."""
    print(f"🔍 Making {method} request to: {url}")

    if 'json' in kwargs:
        print(f"📤 Request body: {json.dumps(kwargs['json'], indent=2)}")

    if 'headers' in kwargs:
        print(f"📋 Headers: {kwargs['headers']}")

    try:
        if method.upper() == 'GET':
            response = requests.get(url, **kwargs)
        elif method.upper() == 'POST':
            response = requests.post(url, **kwargs)

        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response headers: {dict(response.headers)}")

        try:
            response_json = response.json()
            print(f"📥 Response body: {json.dumps(response_json, indent=2)}")
            return response_json
        except ValueError:
            print(f"📥 Response body (text): {response.text}")
            return None

    except Exception as e:
        print(f"❌ Request failed: {e}")
        return None
```

## Best Practices

1. **Always check status codes** before processing responses
2. **Implement retry logic** for transient errors (5xx)
3. **Validate inputs** before sending requests
4. **Use timeouts** to prevent hanging requests
5. **Log errors** with sufficient context for debugging
6. **Provide user-friendly error messages** in your application
7. **Monitor API health** before making requests
8. **Handle network errors** gracefully
9. **Cache successful responses** when appropriate
10. **Test error scenarios** during development

Following these error handling patterns will make your integration with the GitInspectorGUI API more robust and user-friendly.
