# Quick Start

Get GitInspectorGUI development environment running in 3 steps.

**Prerequisites**: Complete **[Prerequisites](01-prerequisites.md)** and **[Installation](02-installation.md)** first.

**Note**: This is for the development environment. For application usage, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## 3-Step Verification

After completing installation, verify everything works with these 3 steps:

### 1. Start Python Backend

```bash
python -m gigui.start_server
# Server runs at: http://127.0.0.1:8000
```

**What happens**: The FastAPI server starts and provides the git analysis API.

### 2. Start Desktop Frontend

```bash
# In a new terminal
pnpm run tauri dev
```

**What happens**:

-   Vite builds the React/TypeScript frontend
-   Tauri compiles the Rust wrapper
-   Desktop app opens and connects to the Python server

### 3. Verify Integration

-   Desktop app connects automatically to Python server
-   Test with sample repository analysis
-   Check that results are displayed properly

## Development Commands Reference

For ongoing development, use these commands:

```bash
# Backend with auto-reload (for Python development)
python -m gigui.start_server --reload --log-level DEBUG

# Frontend with hot reload (for UI development)
pnpm run tauri dev

# Frontend only (without desktop wrapper)
pnpm run dev
```

## Next Steps

Now that your environment is working:

-   **[First Analysis](04-first-analysis.md)** - Test with repository analysis
-   **[Development Workflow](../development/development-workflow.md)** - Learn development patterns
-   **[CLI Guide](cli-guide.md)** - Command-line usage
-   **[API Reference](../api/reference.md)** - Backend API documentation

## Troubleshooting

If something doesn't work:

1. **Check Prerequisites**: Ensure all tools from [Prerequisites](01-prerequisites.md) are installed
2. **Verify Installation**: Re-run verification steps from [Installation](02-installation.md)
3. **Common Issues**: See [Troubleshooting Guide](../development/troubleshooting.md)

**Quick fixes**:

```bash
# Server won't start
lsof -ti:8000 | xargs kill -9
python -m gigui.start_server

# Frontend connection issues
curl http://127.0.0.1:8000/health

# Dependencies issues
uv sync && pnpm install
```
