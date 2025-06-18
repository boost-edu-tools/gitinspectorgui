# First Analysis

Test your GitInspectorGUI development setup with a repository analysis.

**Prerequisites**: Complete **[Prerequisites](01-prerequisites.md)**, **[Installation](02-installation.md)**, and **[Quick Start](03-quick-start.md)** first.

**Note**: This is for testing your development setup. For application usage and features, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Development Environment Test

### 1. Start the Development Environment

You need both the Python backend and the desktop frontend running:

```bash
# Terminal 1: Start the Python API server (backend)
python -m gigui.start_server --reload --log-level DEBUG

# Terminal 2: Start the desktop application (frontend)
pnpm run tauri dev
```

**What happens**:

-   The Python server starts and listens for analysis requests
-   The desktop app provides the user interface
-   They communicate via HTTP (the desktop app sends requests to the Python server)

### 2. Test with Repository Analysis

1. **Prepare a test repository**:

    - Use any small git repository (your current project works well)
    - Ensure it has some commit history
    - Note the full path to the repository

2. **Run analysis through the GUI**:

    - In the desktop app, enter the repository path
    - Configure basic settings (defaults are fine for testing)
    - Click "Execute Analysis"
    - Wait for results to appear

3. **Verify results**:
    - Check that author statistics are displayed
    - Verify file analysis shows correctly
    - Ensure no error messages appear

### 3. Test API Directly (Optional)

You can also test the backend API directly:

```bash
# Test health endpoint
curl http://127.0.0.1:8080/health

# Test analysis endpoint
curl -X POST http://127.0.0.1:8080/api/execute_analysis \
  -H "Content-Type: application/json" \
  -d '{
    "input_fstrs": ["/path/to/your/test/repo"],
    "n_files": 10,
    "file_formats": ["json"]
  }' | jq '.'
```

**Expected**: JSON response with repository analysis data.

## What This Tests

### Backend Functionality

-   Python environment is correctly configured
-   FastAPI server can start and handle requests
-   Git analysis engine works with real repositories
-   JSON serialization and API responses work

### Frontend Integration

-   React/TypeScript compilation works
-   Tauri desktop wrapper functions correctly
-   HTTP communication between frontend and backend
-   UI displays analysis results properly

### Complete System

-   All components work together
-   Development hot-reload functions
-   Error handling displays correctly

## Troubleshooting

### Common Issues

**GUI shows connection errors**:

```bash
# Verify backend is running
curl http://127.0.0.1:8080/health

# Check for port conflicts
lsof -i :8080
```

**Analysis fails with repository errors**:

-   Ensure the repository path exists and is a valid git repository
-   Check that you have read permissions for the repository
-   Try with a different, smaller repository

**Desktop app won't start**:

```bash
# Check Rust/Tauri installation
rustc --version
pnpm run tauri --version

# Clear and reinstall frontend dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Python server errors**:

```bash
# Check Python environment
python -c "import gigui; print('OK')"

# Reinstall Python dependencies
uv sync
```

### Getting Debug Information

1. **Backend logs**: Check the terminal where you started `python -m gigui.start_server`
2. **Frontend logs**: Right-click in the desktop app → "Inspect" → "Console" tab
3. **API testing**: Use curl commands to test backend directly

## Next Steps

After successful testing:

1. **[Development Workflow](../development/development-workflow.md)** - Learn development patterns and best practices
2. **[CLI Guide](cli-guide.md)** - Command-line interface usage
3. **[API Reference](../api/reference.md)** - Backend API documentation
4. **[Architecture Overview](../architecture/overview.md)** - Understanding the system design

## Summary

The first analysis test confirms that your GitInspectorGUI development environment is properly configured and all components work together. You can now proceed with development or explore the application's features.
