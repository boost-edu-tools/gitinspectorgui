#!/bin/bash

# GitInspectorGUI Server Management Script
# Helps manage multiple servers in the Tauri React Vite FastAPI Python full stack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Common ports used by the application
VITE_PORT=5173
TAURI_DEV_PORT=1420
FASTAPI_PORT=8000
DOCS_PORT=8080

# Alternative ports for side-by-side testing with old app
ALT_FASTAPI_PORT=8001
ALT_DOCS_PORT=8081
ALT_VITE_PORT=5174

# Old app ports (Werkzeug typically uses these)
OLD_APP_PORTS="5000 8000 8080"

show_help() {
    echo "GitInspectorGUI Server Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status         Show all running servers and their ports"
    echo "  kill-all       Kill all servers (Vite, Tauri, FastAPI, docs)"
    echo "  kill-new-only  Kill only new app servers (preserve old app)"
    echo "  kill-port      Kill process on specific port"
    echo "  clean          Clean start - kill all servers and clear caches"
    echo "  start-dev      Clean start development servers"
    echo "  start-alt      Start with alternative ports (side-by-side mode)"
    echo "  start-docs     Start documentation server"
    echo "  check-conflicts Check for port conflicts with old app"
    echo "  ports          Show which processes are using common ports"
    echo "  help           Show this help message"
    echo ""
    echo "Default ports:"
    echo "  5173  - Vite development server"
    echo "  1420  - Tauri development server"
    echo "  8000  - FastAPI Python API"
    echo "  8080  - MkDocs documentation server"
    echo ""
    echo "Alternative ports (for side-by-side testing):"
    echo "  5174  - Vite development server (alt)"
    echo "  8001  - FastAPI Python API (alt)"
    echo "  8081  - MkDocs documentation server (alt)"
    echo ""
    echo "Old app typically uses: 5000 (Werkzeug), 8000, 8080"
    echo ""
}

show_status() {
    echo "🔍 Checking server status..."
    echo ""

    check_port() {
        local port=$1
        local name=$2
        local pid=$(lsof -ti:$port 2>/dev/null || echo "")

        if [ -n "$pid" ]; then
            local cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo "✅ Port $port ($name): PID $pid - $cmd"
        else
            echo "❌ Port $port ($name): Not in use"
        fi
    }

    check_port $VITE_PORT "Vite"
    check_port $TAURI_DEV_PORT "Tauri"
    check_port $FASTAPI_PORT "FastAPI"
    check_port $DOCS_PORT "Docs"

    echo ""
    echo "📊 All Node.js processes:"
    pgrep -fl node || echo "No Node.js processes found"

    echo ""
    echo "🐍 All Python processes:"
    pgrep -fl python || echo "No Python processes found"
}

kill_port() {
    local port=$1
    if [ -z "$port" ]; then
        echo "❌ Please specify a port number"
        echo "Usage: $0 kill-port <port>"
        exit 1
    fi

    local pid=$(lsof -ti:$port 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
        echo "🔪 Killing process on port $port (PID: $pid)..."
        kill -9 $pid
        echo "✅ Process killed"
    else
        echo "ℹ️  No process found on port $port"
    fi
}

kill_all_servers() {
    echo "🔪 Killing all development servers..."

    # Kill by port
    for port in $VITE_PORT $TAURI_DEV_PORT $FASTAPI_PORT $DOCS_PORT; do
        local pid=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ -n "$pid" ]; then
            echo "  Killing process on port $port (PID: $pid)..."
            kill -9 $pid 2>/dev/null || true
        fi
    done

    # Kill by process name patterns
    echo "  Killing Node.js development processes..."
    pkill -f "vite" 2>/dev/null || true
    pkill -f "tauri dev" 2>/dev/null || true
    pkill -f "pnpm.*dev" 2>/dev/null || true

    echo "  Killing Python API processes..."
    pkill -f "uvicorn" 2>/dev/null || true
    pkill -f "dev_api.py" 2>/dev/null || true
    pkill -f "api.py" 2>/dev/null || true

    echo "  Killing documentation processes..."
    pkill -f "mkdocs" 2>/dev/null || true

    sleep 2
    echo "✅ All servers killed"
}

clean_caches() {
    echo "🧹 Cleaning caches and temporary files..."

    cd "$PROJECT_ROOT"

    # Clean Node.js caches
    if [ -d "node_modules/.vite" ]; then
        echo "  Cleaning Vite cache..."
        rm -rf node_modules/.vite
    fi

    if [ -d ".vite" ]; then
        echo "  Cleaning .vite directory..."
        rm -rf .vite
    fi

    # Clean Tauri cache
    if [ -d "src-tauri/target" ]; then
        echo "  Cleaning Tauri target directory..."
        rm -rf src-tauri/target/debug
    fi

    # Clean Python cache
    echo "  Cleaning Python cache..."
    find python -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find python -name "*.pyc" -delete 2>/dev/null || true

    # Clean documentation build
    if [ -d "site" ]; then
        echo "  Cleaning documentation build..."
        rm -rf site
    fi

    echo "✅ Caches cleaned"
}

clean_start() {
    echo "🚀 Performing clean start..."
    kill_all_servers
    clean_caches
    echo "✅ Clean start completed - ready for fresh development"
}

start_dev_servers() {
    echo "🚀 Starting development servers with clean slate..."

    clean_start

    cd "$PROJECT_ROOT"

    echo ""
    echo "Starting servers in background..."
    echo "Use 'tail -f /tmp/gitinspector-*.log' to monitor logs"
    echo ""

    # Start FastAPI in background
    echo "🐍 Starting FastAPI server on port $FASTAPI_PORT..."
    cd python
    nohup python dev_api.py > /tmp/gitinspector-api.log 2>&1 &
    cd ..

    sleep 2

    # Start Tauri dev (this will also start Vite)
    echo "⚡ Starting Tauri development server..."
    echo "This will open the application window..."
    pnpm run tauri dev
}

start_docs_server() {
    echo "📚 Starting documentation server..."

    # Kill existing docs server
    local pid=$(lsof -ti:$DOCS_PORT 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
        echo "  Killing existing docs server (PID: $pid)..."
        kill -9 $pid
    fi

    cd "$PROJECT_ROOT"

    echo "Starting MkDocs server on port $DOCS_PORT..."
    mkdocs serve --dev-addr=127.0.0.1:$DOCS_PORT
}

kill_new_only() {
    echo "🔪 Killing only new app servers (preserving old app)..."

    # Kill new app ports only
    for port in $VITE_PORT $TAURI_DEV_PORT $FASTAPI_PORT $DOCS_PORT $ALT_FASTAPI_PORT $ALT_DOCS_PORT $ALT_VITE_PORT; do
        local pid=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ -n "$pid" ]; then
            echo "  Killing process on port $port (PID: $pid)..."
            kill -9 $pid 2>/dev/null || true
        fi
    done

    # Kill by process name patterns (but be more selective)
    echo "  Killing Tauri/Vite processes..."
    pkill -f "tauri dev" 2>/dev/null || true
    pkill -f "pnpm.*dev" 2>/dev/null || true

    # Only kill our specific API processes
    pkill -f "dev_api.py" 2>/dev/null || true
    pkill -f "gitinspector.*api" 2>/dev/null || true

    sleep 2
    echo "✅ New app servers killed (old app preserved)"
}

check_conflicts() {
    echo "🔍 Checking for port conflicts with old app..."
    echo ""

    local conflicts_found=false

    for port in $OLD_APP_PORTS; do
        local pid=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ -n "$pid" ]; then
            local cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            local args=$(ps -p $pid -o args= 2>/dev/null || echo "")
            echo "⚠️  Port $port in use: PID $pid - $cmd"
            echo "   Command: $args"

            # Check if it conflicts with our default ports
            if [ "$port" = "$FASTAPI_PORT" ] || [ "$port" = "$DOCS_PORT" ]; then
                echo "   ❌ CONFLICT: This port conflicts with new app defaults!"
                conflicts_found=true
            fi
            echo ""
        fi
    done

    if [ "$conflicts_found" = true ]; then
        echo "💡 Recommendation: Use 'start-alt' to run with alternative ports"
        echo "   Alternative ports: FastAPI=$ALT_FASTAPI_PORT, Docs=$ALT_DOCS_PORT, Vite=$ALT_VITE_PORT"
    else
        echo "✅ No conflicts detected - safe to use default ports"
    fi
}

start_alt_servers() {
    echo "🚀 Starting development servers with alternative ports (side-by-side mode)..."

    # Only kill new app servers, preserve old app
    kill_new_only
    clean_caches

    cd "$PROJECT_ROOT"

    echo ""
    echo "Starting servers with alternative ports..."
    echo "FastAPI: $ALT_FASTAPI_PORT, Docs: $ALT_DOCS_PORT, Vite: $ALT_VITE_PORT"
    echo "Use 'tail -f /tmp/gitinspector-alt-*.log' to monitor logs"
    echo ""

    # Start FastAPI on alternative port
    echo "🐍 Starting FastAPI server on port $ALT_FASTAPI_PORT..."
    cd python
    # Set environment variable to use alternative port
    FASTAPI_PORT=$ALT_FASTAPI_PORT nohup python dev_api.py > /tmp/gitinspector-alt-api.log 2>&1 &
    cd ..

    sleep 2

    # Start Vite on alternative port and then Tauri
    echo "⚡ Starting Vite on port $ALT_VITE_PORT..."
    VITE_PORT=$ALT_VITE_PORT nohup pnpm run dev --port $ALT_VITE_PORT > /tmp/gitinspector-alt-vite.log 2>&1 &

    sleep 3

    echo "🖥️  Starting Tauri development server..."
    echo "This will open the application window..."
    VITE_DEV_SERVER_URL="http://localhost:$ALT_VITE_PORT" pnpm run tauri dev
}

start_alt_docs() {
    echo "📚 Starting documentation server on alternative port $ALT_DOCS_PORT..."

    # Kill existing docs server on alt port
    local pid=$(lsof -ti:$ALT_DOCS_PORT 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
        echo "  Killing existing docs server (PID: $pid)..."
        kill -9 $pid
    fi

    cd "$PROJECT_ROOT"

    echo "Starting MkDocs server on port $ALT_DOCS_PORT..."
    mkdocs serve --dev-addr=127.0.0.1:$ALT_DOCS_PORT
}

show_ports() {
    echo "🔍 Checking common development ports..."
    echo ""

    # Check old app ports first
    echo "Old app ports:"
    for port in $OLD_APP_PORTS; do
        local pid=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ -n "$pid" ]; then
            local cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo "  Port $port: PID $pid - $cmd (OLD APP)"
        else
            echo "  Port $port: Available"
        fi
    done

    echo ""
    echo "New app ports:"
    for port in $VITE_PORT $TAURI_DEV_PORT $FASTAPI_PORT $DOCS_PORT; do
        local pid=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ -n "$pid" ]; then
            local cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo "  Port $port: PID $pid - $cmd (NEW APP)"
        else
            echo "  Port $port: Available"
        fi
    done

    echo ""
    echo "Alternative ports:"
    for port in $ALT_VITE_PORT $ALT_FASTAPI_PORT $ALT_DOCS_PORT; do
        local pid=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ -n "$pid" ]; then
            local cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo "  Port $port: PID $pid - $cmd (ALT)"
        else
            echo "  Port $port: Available"
        fi
    done

    echo ""
    echo "Other common ports:"
    for port in 3000 1420 3001 9000; do
        local pid=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ -n "$pid" ]; then
            local cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            local args=$(ps -p $pid -o args= 2>/dev/null || echo "")
            echo "  Port $port: PID $pid - $cmd"
            echo "    Command: $args"
        fi
    done
}

case "${1:-help}" in
    "status")
        show_status
        ;;
    "kill-all")
        kill_all_servers
        ;;
    "kill-new-only")
        kill_new_only
        ;;
    "kill-port")
        kill_port "$2"
        ;;
    "clean")
        clean_start
        ;;
    "start-dev")
        start_dev_servers
        ;;
    "start-alt")
        start_alt_servers
        ;;
    "start-docs")
        start_docs_server
        ;;
    "start-alt-docs")
        start_alt_docs
        ;;
    "check-conflicts")
        check_conflicts
        ;;
    "ports")
        show_ports
        ;;
    "help"|*)
        show_help
        ;;
esac
