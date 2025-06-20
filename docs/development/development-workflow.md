# Development Workflow

High-level development workflows and processes for GitInspectorGUI, focusing on team collaboration and development patterns.

!!! tip "Detailed Guides"
For specific development tasks, see:

-   **[Commands Reference](development-commands.md)** - All development commands
-   **[Development Architecture](development-architecture.md)** - System architecture

## Overview

GitInspectorGUI uses a **multi-server development architecture** that enables independent frontend and backend development through a clean HTTP API boundary.

**Key Benefits**:

-   **Independent Development**: Backend and frontend can be developed separately
-   **Fast Iteration**: Hot reloading and auto-restart for all services
-   **Clear Separation**: HTTP API provides clean interface between layers
-   **Flexible Testing**: Each service can be tested independently

## Development Approaches

### 1. Full Stack Development

**Best for**: UI features, integration testing, complete feature development

```bash
# Start all services
pnpm dev

# This provides:
# - Frontend hot reload (React/TypeScript)
# - Desktop app wrapper (Tauri)
# - Backend auto-restart (Python)
```

**Workflow**:

1. Start all development services
2. Make changes to any layer
3. See immediate feedback across the stack
4. Test integration between services

### 2. Backend-Only Development

**Best for**: API development, data processing, Python-focused work

```bash
# Start only Python backend
python -m gigui.start_server --reload --log-level DEBUG

# Test with curl
curl http://127.0.0.1:8000/health
```

**Workflow**:

1. Focus on Python backend development
2. Test API endpoints directly with curl
3. Iterate quickly without frontend overhead
4. Integrate with frontend when ready

### 3. Frontend-Only Development

**Best for**: UI/UX work, component development, styling

```bash
# Start frontend with mock data
pnpm dev:frontend

# Or with desktop wrapper
pnpm tauri dev
```

**Workflow**:

1. Use mock data or existing API
2. Focus on user interface development
3. Iterate on design and user experience
4. Connect to real backend when ready

## Hot Reloading

### Python Changes

-   **Auto-restart** - Server detects file changes and restarts
-   **Preserved connections** - Existing HTTP connections maintained
-   **Instant feedback** - Changes visible immediately

### Frontend Changes

-   **Hot Module Replacement** - Components update without page refresh
-   **State preservation** - React state maintained when possible
-   **Automatic refresh** - Full reload if HMR fails

### Rust Changes

-   **Auto-recompile** - Cargo rebuilds on file changes
-   **Full restart** - Tauri app restarts completely

## Debugging & Testing

### Direct API Testing

```bash
# Start server with debug logging
python -m gigui.start_server --reload --log-level DEBUG

# Test health endpoint
curl http://127.0.0.1:8000/health

# Test analysis with a small repository
curl -X POST http://127.0.0.1:8000/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{
    "input_fstrs": ["/path/to/small/repo"],
    "n_files": 10,
    "file_formats": ["json"]
  }' | jq '.'
```

### Integration Testing

```bash
# Test HTTP endpoints
curl http://127.0.0.1:8000/health
curl -X GET http://127.0.0.1:8000/api/settings

# Frontend testing
pnpm run test
pnpm run test:e2e

# Test the complete system
python -m gigui.start_server --reload &
pnpm run tauri dev
# Use the GUI to test your changes
```

## Frontend Integration

### When You Need Frontend Changes

Sometimes you'll need frontend modifications (new UI elements, different data display). Here's how to handle this:

**Option 1: Use AI Tools (Recommended)**

1. **Make your Python changes first** and test them with curl
2. **Use your AI tools** to make the corresponding frontend changes
3. **Focus on the API contract** - ensure your Python output matches what the frontend expects

**Option 2: Minimal Frontend Understanding**

Key files to know about:

-   `src/lib/api.ts` - Frontend API calls (mirrors your Python endpoints)
-   `src/components/SettingsForm.tsx` - Settings UI (if you add new options)
-   `src/components/ResultsTables.tsx` - Results display (if you change output format)

Simple changes you can make:

```typescript
// In src/lib/api.ts - add a new API call
export async function analyzeComplexity(settings: Settings) {
    const response = await fetch("/api/analyze_complexity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
    });
    return response.json();
}
```

### Integration Testing

Once your Python changes work, test with the full application:

```bash
# Keep your Python server running, then in another terminal:
pnpm run tauri dev
```

The frontend will automatically connect to your Python server.

## Configuration

### VS Code Setup

```json
// .vscode/launch.json
{
    "configurations": [
        {
            "name": "Debug API Server",
            "type": "python",
            "request": "launch",
            "module": "gigui.start_server",
            "args": ["--host", "127.0.0.1", "--port", "8000"]
        }
    ]
}
```

## Troubleshooting

### Common Issues

**Server won't restart**

```bash
# Kill existing processes
pkill -f "gigui.start_server"
python -m gigui.start_server --reload
```

**Frontend connection issues**

````bash
# Verify server running
curl http://127.0.0.1:8000/health

**Hot reload not working**

```bash
# Clear caches
pnpm store prune
rm -rf node_modules/.vite

# Restart development
pnpm run tauri dev
````

### Server Debugging

```bash
# Start with maximum logging
python -m gigui.start_server --reload --log-level DEBUG

# Check server logs for errors
# Logs appear in the terminal where you started the server
```

### API Debugging

```bash
# Test API endpoints directly
curl -v http://127.0.0.1:8000/health
curl -v -X POST http://127.0.0.1:8000/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{"input_fstrs": ["/test/repo"]}'

# Use jq to format JSON responses
curl -s http://127.0.0.1:8000/api/settings | jq '.'
```

## Related Documentation

-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Package Management](package-management.md)** - Dependencies and tools
-   **[API Reference](../api/reference.md)** - Full API documentation
-   **[Technology Primer](../technology-primer.md)** - Understanding the full stack when needed
