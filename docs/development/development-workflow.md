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

For detailed commands, see **[Development Commands](development-commands.md)**.

## Development Approaches

### 1. Full Stack Development

**Best for**: UI features, integration testing, complete feature development

**Workflow**:

1. Start all development services (see [Development Commands](development-commands.md#quick-start-commands))
2. Make changes to any layer
3. See immediate feedback across the stack
4. Test integration between services

### 2. Backend-Only Development

**Best for**: API development, data processing, Python-focused work

**Workflow**:

1. Focus on Python backend development
2. Test API endpoints directly (see [API Testing Commands](development-commands.md#api-testing-commands))
3. Iterate quickly without frontend overhead
4. Integrate with frontend when ready

### 3. Frontend-Only Development

**Best for**: UI/UX work, component development, styling

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

For detailed API testing commands, see [API Testing Commands](development-commands.md#api-testing-commands).

**Process**:

1. Start server with debug logging
2. Test health endpoint to verify connectivity
3. Test analysis with a small repository
4. Use formatted JSON output for readability

### Integration Testing

For complete testing commands, see [Integration Testing Commands](development-commands.md#integration-testing-commands).

**Process**:

1. Test HTTP endpoints individually
2. Run frontend tests in isolation
3. Test the complete system integration
4. Use the GUI to verify end-to-end functionality

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

For detailed troubleshooting commands, see [Troubleshooting Commands](development-commands.md#troubleshooting-commands) and [Troubleshooting Guide](troubleshooting.md).

### Common Issues

**Server won't restart**: Kill existing processes and restart (see [Port Management](development-commands.md#port-management))

**Frontend connection issues**: Verify server is running and accessible (see [Service Health Checks](development-commands.md#service-health-checks))

**Hot reload not working**: Clear caches and restart development environment (see [Cache Management](development-commands.md#cache-management))

### Debugging Process

1. **Server Debugging**: Start with maximum logging to identify issues
2. **API Debugging**: Test endpoints directly to isolate problems
3. **Integration Debugging**: Use formatted JSON responses for analysis

For specific debugging commands, see [Backend Debugging Commands](development-commands.md#backend-debugging-commands).

## Related Documentation

-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Package Management](package-management-overview.md)** - Dependencies and tools
-   **[API Reference](../api/reference.md)** - Full API documentation
-   **[Technology Primer](../technology-primer.md)** - Understanding the full stack when needed
