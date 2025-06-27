# Quick Start

Get GitInspectorGUI development environment running in one command.

**Prerequisites**: Complete **[Prerequisites](01-prerequisites.md)** and **[Installation](02-installation.md)** first.

**Note**: This is for the development environment. For application usage, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Single-Step Verification

After completing installation, verify everything works with this single step:

### Start Development Environment

```bash
pnpm run tauri dev
```

**What happens**:

-   Vite builds the React/TypeScript frontend
-   Tauri compiles the Rust wrapper with PyO3 integration
-   Python analysis engine is embedded directly in the application
-   Desktop app opens with fully integrated Python functionality

### Verify Integration

-   Desktop app opens with GitInspectorGUI interface
-   Python analysis engine is ready for use (no separate server needed)
-   Test with sample repository analysis through the GUI
-   Check that results are displayed properly

## Development Commands Reference

For ongoing development, use these commands:

```bash
# Complete development environment (recommended)
pnpm run tauri dev

# Frontend only (without desktop wrapper)
pnpm run dev

# Note: Python changes require restarting the desktop app
# since Python is embedded via PyO3
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
# Desktop app won't start
pnpm clean
pnpm install
pnpm run tauri dev

# Dependencies issues
uv sync && pnpm install

# Clear development cache
rm -rf node_modules/.vite
rm -rf src-tauri/target/debug
```
