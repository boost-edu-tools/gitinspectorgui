# Server Management

This guide helps you manage the multiple servers in the GitInspectorGUI full stack application and resolve common issues with old servers preventing new ones from starting.

## The Problem

The GitInspectorGUI application uses multiple servers:

-   **Vite** (port 5173) - Frontend development server
-   **Tauri** (port 1420) - Desktop application development server
-   **FastAPI** (port 8000) - Python backend API
-   **MkDocs** (port 8080) - Documentation server

Common issues include:

-   Old servers still running on ports, preventing new ones from starting
-   Cached processes interfering with fresh development
-   Multiple instances of the same server running
-   Port conflicts between different development sessions

## Server Manager Script

Use the `scripts/server-manager.sh` script to manage all servers:

```bash
# Show help and available commands
./scripts/server-manager.sh help

# Check status of all servers
./scripts/server-manager.sh status

# Kill all running servers
./scripts/server-manager.sh kill-all

# Clean start (kill servers + clear caches)
./scripts/server-manager.sh clean

# Start development servers with clean slate
./scripts/server-manager.sh start-dev

# Kill process on specific port
./scripts/server-manager.sh kill-port 5173
```

## Common Workflows

### Starting Fresh Development Session

```bash
# Clean everything and start fresh
./scripts/server-manager.sh clean
./scripts/server-manager.sh start-dev
```

### Side-by-Side Testing with Old App

```bash
# Check for conflicts with old app (Werkzeug server)
./scripts/server-manager.sh check-conflicts

# Start new app with alternative ports (preserves old app)
./scripts/server-manager.sh start-alt

# Or kill only new app servers (preserve old app)
./scripts/server-manager.sh kill-new-only
```

### Troubleshooting Port Conflicts

```bash
# Check what's running on common ports
./scripts/server-manager.sh ports

# Check specific server status
./scripts/server-manager.sh status

# Kill specific port if needed
./scripts/server-manager.sh kill-port 8000
```

### Quick Server Restart

```bash
# Kill all servers but keep caches
./scripts/server-manager.sh kill-all

# Then start normally
pnpm run tauri dev
```

## Manual Server Management

If you prefer manual control:

### Check What's Running on Ports

```bash
# Check specific port
lsof -i :5173

# Check all common development ports
lsof -i :5173 -i :8000 -i :1420 -i :8080
```

### Kill Processes by Port

```bash
# Kill process on specific port
kill -9 $(lsof -ti:5173)

# Kill multiple ports
kill -9 $(lsof -ti:5173,8000,1420,8080)
```

### Kill Processes by Name

```bash
# Kill Node.js development processes
pkill -f "vite"
pkill -f "tauri dev"

# Kill Python API processes
pkill -f "uvicorn"
pkill -f "dev_api.py"
```

## Development Mode Integration

The server manager works with the existing development mode script:

```bash
# Enable development mode (uses Python script instead of sidecar)
./scripts/dev-mode.sh enable

# Clean start with development mode
./scripts/server-manager.sh clean
./scripts/dev-mode.sh dev
```

## Monitoring Logs

When using `start-dev`, logs are written to `/tmp/`:

```bash
# Monitor API logs
tail -f /tmp/gitinspector-api.log

# Monitor all logs
tail -f /tmp/gitinspector-*.log
```

## Port Reference

### Default Ports (New App)

| Port | Service | Purpose                        |
| ---- | ------- | ------------------------------ |
| 5173 | Vite    | Frontend development server    |
| 1420 | Tauri   | Desktop app development server |
| 8000 | FastAPI | Python backend API             |
| 8080 | MkDocs  | Documentation server           |

### Alternative Ports (Side-by-Side Mode)

| Port | Service | Purpose                     |
| ---- | ------- | --------------------------- |
| 5174 | Vite    | Frontend development server |
| 8001 | FastAPI | Python backend API          |
| 8081 | MkDocs  | Documentation server        |

### Old App Ports (Typically Used)

| Port | Service  | Purpose                    |
| ---- | -------- | -------------------------- |
| 5000 | Werkzeug | Flask development server   |
| 8000 | Various  | API server (conflicts!)    |
| 8080 | Various  | Documentation (conflicts!) |

**Note**: Ports 8000 and 8080 may conflict between old and new apps. Use `check-conflicts` and `start-alt` commands for side-by-side testing.

## Troubleshooting Tips

1. **Always check status first**: `./scripts/server-manager.sh status`
2. **Use clean start for persistent issues**: `./scripts/server-manager.sh clean`
3. **Check logs for errors**: `tail -f /tmp/gitinspector-*.log`
4. **Verify ports are free**: `./scripts/server-manager.sh ports`
5. **Kill specific problematic processes**: `./scripts/server-manager.sh kill-port <port>`

## Integration with IDE

You can add these commands to your IDE's task runner or create keyboard shortcuts for common operations like clean start.
