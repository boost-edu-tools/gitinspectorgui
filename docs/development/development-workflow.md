# Development Workflow

High-level development workflows and processes for GitInspectorGUI, focusing on team collaboration and development patterns.

!!! tip "Detailed Guides"

    For specific development tasks, see:

    -   **[Commands Reference](development-commands.md)** - All development commands
    -   **[Development Architecture](development-architecture.md)** - System architecture

## Overview

GitInspectorGUI uses a **single-process PyO3 architecture** that embeds Python directly within the Tauri desktop application for optimal performance and simplicity.

**Key Benefits**:

-   **Simplified Development**: Single command starts complete environment
-   **Fast Iteration**: Frontend hot reloading with embedded Python
-   **Direct Integration**: PyO3 provides direct Python-Rust function calls
-   **Single Process**: No network overhead or server management

For detailed commands, see **[Development Commands](development-commands.md)**.

## Development Approaches

### 1. Complete Application Development

**Best for**: UI features, integration testing, complete feature development

**Workflow**:

1. Start development environment: `pnpm run tauri dev`
2. Make changes to any layer (Python, Rust, or frontend)
3. See immediate feedback for frontend changes
4. Restart application for Python/Rust changes

### 2. Python-Focused Development

**Best for**: Analysis algorithms, data processing, Python-focused work

**Workflow**:

1. Develop Python functions independently
2. Test Python logic with unit tests
3. Integrate with PyO3 interface when ready
4. Test through desktop application

### 3. Frontend-Only Development

**Best for**: UI/UX work, component development, styling

**Workflow**:

1. Use mock data or demo mode
2. Start frontend only: `pnpm run dev`
3. Focus on user interface development
4. Integrate with embedded Python when ready

## Hot Reloading

### Python Changes

-   **Manual restart required** - Python is embedded, so app must be restarted
-   **Fast restart** - Single process restart is quick
-   **No connection loss** - No separate server to reconnect to

### Frontend Changes

-   **Hot Module Replacement** - Components update without page refresh
-   **State preservation** - React state maintained when possible
-   **Automatic refresh** - Full reload if HMR fails

### Rust Changes

-   **Auto-recompile** - Cargo rebuilds on file changes
-   **Full restart** - Tauri app restarts completely
-   **PyO3 integration** - Python bindings are recompiled automatically

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
