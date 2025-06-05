# API Examples

Practical examples for using the GitInspectorGUI HTTP API.

## Quick Start Examples

### Basic Health Check

```bash
curl http://127.0.0.1:8080/health
```

**Response:**

```json
{
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-06-05T20:52:00.000Z",
    "uptime": 3600.5
}
```

### Simple Repository Analysis

```bash
curl -X POST http://127.0.0.1:8080/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{
    "input_fstrs": ["/path/to/repository"],
    "depth": 0,
    "n_files": 100
  }'
```

## Complete Examples

### 1. Basic Analysis

**Request:**

```json
{
    "input_fstrs": ["/Users/developer/projects/my-repo"],
    "depth": 0,
    "subfolder": "",
    "n_files": 50,
    "extensions": [".py", ".js", ".ts", ".md"],
    "since": "2024-01-01",
    "until": "2024-12-31"
}
```

**cURL Command:**

```bash
curl -X POST http://127.0.0.1:8080/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d @analysis_request.json
```

**Response:**

```json
{
    "repositories": [
        {
            "name": "my-repo",
            "path": "/Users/developer/projects/my-repo",
            "analysis_date": "2025-06-05T20:52:00.000Z",
            "commit_count": 156,
            "author_count": 3,
            "file_count": 89,
            "authors": [
                {
                    "name": "John Developer",
                    "email": "john@example.com",
                    "commits": 78,
                    "insertions": 2456,
                    "deletions": 892,
                    "files_changed": 45
                }
            ],
            "files": [
                {
                    "name": "main.py",
                    "path": "src/main.py",
                    "lines": 234,
                    "commits": 12,
                    "authors": ["john@example.com", "jane@example.com"]
                }
            ]
        }
    ],
    "summary": {
        "total_repositories": 1,
        "total_commits": 156,
        "total_authors": 3,
        "analysis_duration": 2.34
    }
}
```

### 2. Advanced Filtering

**Request with Exclusions:**

```json
{
    "input_fstrs": ["/path/to/large-project"],
    "depth": 2,
    "n_files": 200,
    "extensions": [".py", ".js", ".ts"],
    "ex_files": [
        "*.test.js",
        "*.spec.ts",
        "node_modules/*",
        "dist/*",
        "build/*"
    ],
    "ex_authors": ["bot@automated.com"],
    "ex_emails": ["noreply@github.com"],
    "since": "2024-06-01",
    "until": "2024-12-31",
    "blame_exclusions": "comments,whitespace",
    "processes": 4
}
```

### 3. Multiple Repositories

**Request:**

```json
{
    "input_fstrs": [
        "/path/to/frontend-repo",
        "/path/to/backend-repo",
        "/path/to/shared-lib"
    ],
    "depth": 0,
    "n_files": 100,
    "extensions": [".py", ".js", ".ts", ".jsx", ".tsx"],
    "since": "2024-01-01",
    "view": "detailed"
}
```

## Language-Specific Examples

### Python

```python
import requests
import json

# Configuration
API_BASE = "http://127.0.0.1:8080"
headers = {"Content-Type": "application/json"}

# Health check
response = requests.get(f"{API_BASE}/health")
print(f"Server status: {response.json()['status']}")

# Repository analysis
analysis_config = {
    "input_fstrs": ["/path/to/repository"],
    "extensions": [".py", ".js", ".ts"],
    "since": "2024-01-01",
    "n_files": 100
}

response = requests.post(
    f"{API_BASE}/api/execute_analysis",
    headers=headers,
    json=analysis_config
)

if response.status_code == 200:
    results = response.json()
    print(f"Analyzed {results['summary']['total_commits']} commits")
    for repo in results['repositories']:
        print(f"Repository: {repo['name']}")
        print(f"Authors: {repo['author_count']}")
        print(f"Files: {repo['file_count']}")
else:
    print(f"Error: {response.status_code} - {response.text}")
```

### JavaScript/TypeScript

```typescript
interface AnalysisRequest {
    input_fstrs: string[];
    extensions?: string[];
    since?: string;
    until?: string;
    n_files?: number;
}

interface AnalysisResponse {
    repositories: Repository[];
    summary: AnalysisSummary;
}

class GitInspectorAPI {
    private baseUrl = "http://127.0.0.1:8080";

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            return data.status === "healthy";
        } catch (error) {
            console.error("Health check failed:", error);
            return false;
        }
    }

    async analyzeRepository(
        config: AnalysisRequest
    ): Promise<AnalysisResponse> {
        const response = await fetch(`${this.baseUrl}/api/execute_analysis`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(config),
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
        }

        return response.json();
    }
}

// Usage
const api = new GitInspectorAPI();

async function runAnalysis() {
    // Check server health
    const isHealthy = await api.healthCheck();
    if (!isHealthy) {
        console.error("Server is not healthy");
        return;
    }

    // Run analysis
    try {
        const results = await api.analyzeRepository({
            input_fstrs: ["/path/to/repository"],
            extensions: [".js", ".ts", ".jsx", ".tsx"],
            since: "2024-01-01",
            n_files: 100,
        });

        console.log(
            `Analysis complete: ${results.summary.total_commits} commits`
        );
    } catch (error) {
        console.error("Analysis failed:", error);
    }
}

runAnalysis();
```

### Bash/Shell

```bash
#!/bin/bash

API_BASE="http://127.0.0.1:8080"
REPO_PATH="/path/to/repository"

# Health check function
check_health() {
    echo "Checking server health..."
    response=$(curl -s "$API_BASE/health")
    status=$(echo "$response" | jq -r '.status')

    if [ "$status" = "healthy" ]; then
        echo "✅ Server is healthy"
        return 0
    else
        echo "❌ Server is not healthy"
        return 1
    fi
}

# Analysis function
run_analysis() {
    local repo_path="$1"
    local output_file="$2"

    echo "Starting analysis of $repo_path..."

    # Create request payload
    request_data=$(cat <<EOF
{
    "input_fstrs": ["$repo_path"],
    "extensions": [".py", ".js", ".ts", ".md"],
    "since": "2024-01-01",
    "n_files": 100,
    "processes": 2
}
EOF
)

    # Execute analysis
    response=$(curl -s -X POST "$API_BASE/api/execute_analysis" \
        -H "Content-Type: application/json" \
        -d "$request_data")

    # Check if successful
    if echo "$response" | jq -e '.repositories' > /dev/null; then
        echo "✅ Analysis completed successfully"

        # Extract summary
        total_commits=$(echo "$response" | jq -r '.summary.total_commits')
        total_authors=$(echo "$response" | jq -r '.summary.total_authors')
        duration=$(echo "$response" | jq -r '.summary.analysis_duration')

        echo "📊 Summary:"
        echo "   Commits: $total_commits"
        echo "   Authors: $total_authors"
        echo "   Duration: ${duration}s"

        # Save full results
        if [ -n "$output_file" ]; then
            echo "$response" | jq '.' > "$output_file"
            echo "💾 Results saved to $output_file"
        fi
    else
        echo "❌ Analysis failed"
        echo "$response" | jq -r '.detail // .error // .'
        return 1
    fi
}

# Main execution
main() {
    if ! check_health; then
        echo "Please start the GitInspectorGUI server first:"
        echo "python -m gigui.start_server"
        exit 1
    fi

    if [ $# -eq 0 ]; then
        echo "Usage: $0 <repository_path> [output_file]"
        exit 1
    fi

    run_analysis "$1" "$2"
}

main "$@"
```

## Settings Management Examples

### Get Current Settings

```bash
curl http://127.0.0.1:8080/api/settings
```

**Response:**

```json
{
    "input_fstrs": [],
    "depth": 0,
    "n_files": 100,
    "extensions": [".py", ".js", ".ts"],
    "since": "",
    "until": "",
    "processes": 1,
    "enhanced_settings": {
        "ui_theme": "light",
        "auto_save": true,
        "default_view": "summary"
    }
}
```

### Update Settings

```bash
curl -X POST http://127.0.0.1:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "n_files": 200,
    "extensions": [".py", ".js", ".ts", ".jsx", ".tsx"],
    "processes": 4,
    "enhanced_settings": {
      "ui_theme": "dark",
      "auto_save": true
    }
  }'
```

## Error Handling Examples

### Handling Common Errors

```python
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError

def safe_api_call(url, method='GET', **kwargs):
    """Make a safe API call with proper error handling."""
    try:
        if method.upper() == 'GET':
            response = requests.get(url, timeout=30, **kwargs)
        elif method.upper() == 'POST':
            response = requests.post(url, timeout=30, **kwargs)

        # Check for HTTP errors
        response.raise_for_status()

        return response.json()

    except ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
        return None
    except Timeout:
        print("❌ Request timed out. Analysis may be taking too long.")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error {e.response.status_code}: {e.response.text}")
        return None
    except ValueError as e:
        print(f"❌ Invalid JSON response: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

# Usage examples
result = safe_api_call("http://127.0.0.1:8080/health")
if result:
    print(f"Server status: {result['status']}")

analysis_data = {
    "input_fstrs": ["/invalid/path"],
    "n_files": 100
}

result = safe_api_call(
    "http://127.0.0.1:8080/api/execute_analysis",
    method='POST',
    json=analysis_data,
    headers={'Content-Type': 'application/json'}
)

if result:
    print("Analysis completed successfully")
else:
    print("Analysis failed - check error messages above")
```

## Performance Optimization Examples

### Batch Processing Multiple Repositories

```python
import asyncio
import aiohttp
from typing import List, Dict

async def analyze_repositories_batch(repo_paths: List[str]) -> List[Dict]:
    """Analyze multiple repositories concurrently."""

    async def analyze_single_repo(session, repo_path):
        config = {
            "input_fstrs": [repo_path],
            "n_files": 50,  # Limit for faster processing
            "processes": 1  # Single process per repo
        }

        try:
            async with session.post(
                "http://127.0.0.1:8080/api/execute_analysis",
                json=config
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"Failed to analyze {repo_path}: {response.status}")
                    return None
        except Exception as e:
            print(f"Error analyzing {repo_path}: {e}")
            return None

    async with aiohttp.ClientSession() as session:
        tasks = [analyze_single_repo(session, repo) for repo in repo_paths]
        results = await asyncio.gather(*tasks)
        return [r for r in results if r is not None]

# Usage
repositories = [
    "/path/to/repo1",
    "/path/to/repo2",
    "/path/to/repo3"
]

results = asyncio.run(analyze_repositories_batch(repositories))
print(f"Successfully analyzed {len(results)} repositories")
```

### Incremental Analysis

```python
from datetime import datetime, timedelta

def incremental_analysis(repo_path: str, last_analysis_date: str = None):
    """Perform incremental analysis since last run."""

    if last_analysis_date:
        since_date = last_analysis_date
    else:
        # Default to last 30 days
        since_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    config = {
        "input_fstrs": [repo_path],
        "since": since_date,
        "until": datetime.now().strftime("%Y-%m-%d"),
        "n_files": 200,
        "processes": 2
    }

    response = requests.post(
        "http://127.0.0.1:8080/api/execute_analysis",
        json=config,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Analysis failed: {response.text}")

# Usage
try:
    results = incremental_analysis(
        "/path/to/repository",
        last_analysis_date="2024-11-01"
    )
    print(f"Found {results['summary']['total_commits']} new commits")
except Exception as e:
    print(f"Incremental analysis failed: {e}")
```

These examples provide a comprehensive foundation for integrating with the GitInspectorGUI HTTP API. Adapt them to your specific use case and programming language preferences.
