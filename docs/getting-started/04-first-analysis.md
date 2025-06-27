# First Analysis

Test your GitInspectorGUI development setup with a repository analysis.

**Prerequisites**: Complete **[Prerequisites](01-prerequisites.md)**, **[Installation](02-installation.md)**, and **[Quick Start](03-quick-start.md)** first.

**Note**: This is for testing your development setup. For application usage and features, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Development Environment Test

### 1. Start the Development Environment

You only need one command to start everything:

```bash
# Start the complete development environment
pnpm run tauri dev
```

**What happens**:

-   Vite builds the React/TypeScript frontend
-   Tauri compiles the Rust wrapper with PyO3 integration
-   Python analysis engine is embedded directly in the application
-   Desktop app opens with fully integrated Python functionality

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

### 3. Test Different Repository Types

Test with different types of repositories to verify functionality:

-   **Small repository**: Quick test with minimal files
-   **Large repository**: Test performance with many files
-   **Multi-language repository**: Verify language detection
-   **Repository with complex history**: Test blame analysis

All testing is done through the desktop GUI since Python is embedded.

## What This Tests

### Python Integration

-   Python environment is correctly configured
-   PyO3 bindings work correctly
-   Git analysis engine works with real repositories
-   Python-Rust type conversion functions properly

### Frontend Integration

-   React/TypeScript compilation works
-   Tauri desktop wrapper functions correctly
-   Direct communication between frontend and embedded Python
-   UI displays analysis results properly

### Complete System

-   All components work together in a single process
-   Development hot-reload functions for frontend changes
-   Error handling displays correctly
-   PyO3 integration is stable and performant

## Troubleshooting

### Common Issues

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

**Python integration errors**:

```bash
# Check Python environment
python -c "import gigui; print('OK')"

# Reinstall Python dependencies
uv sync

# Clear Tauri cache
rm -rf src-tauri/target/debug
```

### Getting Debug Information

1. **Application logs**: Check the terminal where you started `pnpm run tauri dev`
2. **Frontend logs**: Right-click in the desktop app → "Inspect" → "Console" tab
3. **Python debugging**: Add print statements to Python code and restart the app

## Next Steps

After successful testing:

1. **[Development Workflow](../development/development-workflow.md)** - Learn development patterns and best practices
2. **[CLI Guide](cli-guide.md)** - Command-line interface usage
3. **[API Reference](../api/reference.md)** - Backend API documentation
4. **[Architecture Overview](../architecture/overview.md)** - Understanding the system design

## Summary

The first analysis test confirms that your GitInspectorGUI development environment is properly configured and all components work together. You can now proceed with development or explore the application's features.
