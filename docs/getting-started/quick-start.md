# Quick Start Guide

Get GitInspectorGUI up and running in just a few minutes.

## Prerequisites

Before you begin, ensure you have:

-   **Python 3.12+** with pip
-   **Node.js 16+** with npm
-   **Rust 1.70+** with Cargo
-   **Git 2.20+**

## 🚀 Start in 3 Steps

### 1. Start the HTTP API Server

```bash
# Start the Python HTTP server
python -m gigui.start_server

# Server will be available at http://127.0.0.1:8080
# Health check: curl http://127.0.0.1:8080/health
```

### 2. Start the Tauri Application

```bash
# In a new terminal
npm install
npm run tauri dev
```

### 3. Verify Integration

-   The Tauri app should automatically connect to the HTTP server
-   Check the browser console for any connection errors
-   Test analysis functionality with a sample repository

## ✅ Verification

Once both components are running:

1. **Health Check**: Visit `http://127.0.0.1:8080/health` - you should see a JSON response
2. **Frontend**: The Tauri application window should open
3. **Integration**: Try loading a git repository for analysis

## 🎯 Next Steps

-   **[Installation Guide](installation.md)** - Detailed setup instructions
-   **[First Analysis](first-analysis.md)** - Run your first repository analysis
-   **[Development Mode](../development/development-mode.md)** - Set up for development

## 🔧 Production Build

For production deployment:

```bash
# Build the HTTP server (optional - runs from source)
python -m pip install -e .

# Build the Tauri application
npm run tauri build
```

## 🆘 Troubleshooting

**Server won't start?**

-   Check Python version: `python --version`
-   Verify dependencies: `pip list | grep gigui`

**Frontend won't connect?**

-   Ensure server is running on port 8080
-   Check firewall settings
-   Verify no other services are using port 8080

**Build issues?**

-   Update Node.js and npm to latest versions
-   Clear npm cache: `npm cache clean --force`
-   Reinstall dependencies: `rm -rf node_modules && npm install`

For more detailed troubleshooting, see the [Troubleshooting Guide](../development/troubleshooting.md).
