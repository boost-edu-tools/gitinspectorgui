#!/bin/bash

# GitInspectorGUI Development Mode Script
# This script allows easy switching between development and production modes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_DIR="$SCRIPT_DIR/src-tauri"
ORIGINAL_CONFIG="$TAURI_DIR/tauri.conf.json"
DEV_CONFIG="$TAURI_DIR/tauri.conf.dev.json"
BACKUP_CONFIG="$TAURI_DIR/tauri.conf.json.backup"

show_help() {
    echo "GitInspectorGUI Development Mode Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  enable    Enable development mode (use Python script instead of sidecar)"
    echo "  disable   Disable development mode (use PyInstaller sidecar)"
    echo "  status    Show current mode"
    echo "  dev       Start Tauri in development mode"
    echo "  test      Test the Python API directly"
    echo "  help      Show this help message"
    echo ""
    echo "Development mode allows you to:"
    echo "  - See changes to Python code immediately in the GUI"
    echo "  - Debug Python code with full debugger support"
    echo "  - Skip PyInstaller rebuilds during development"
    echo ""
}

enable_dev_mode() {
    echo "Enabling development mode..."
    
    # Backup original config if not already backed up
    if [ ! -f "$BACKUP_CONFIG" ]; then
        cp "$ORIGINAL_CONFIG" "$BACKUP_CONFIG"
        echo "Backed up original config to tauri.conf.json.backup"
    fi
    
    # Copy dev config to main config
    cp "$DEV_CONFIG" "$ORIGINAL_CONFIG"
    echo "✅ Development mode enabled!"
    echo "   - Tauri will now use python/dev_api.py instead of the PyInstaller sidecar"
    echo "   - Changes to Python code will be visible immediately"
    echo "   - Run '$0 dev' to start development server"
}

disable_dev_mode() {
    echo "Disabling development mode..."
    
    if [ ! -f "$BACKUP_CONFIG" ]; then
        echo "❌ No backup config found. Development mode may not have been enabled."
        exit 1
    fi
    
    # Restore original config
    cp "$BACKUP_CONFIG" "$ORIGINAL_CONFIG"
    echo "✅ Development mode disabled!"
    echo "   - Tauri will now use the PyInstaller sidecar"
    echo "   - You'll need to rebuild the sidecar for Python changes"
}

show_status() {
    if [ -f "$BACKUP_CONFIG" ]; then
        # Check if current config uses dev_api.py
        if grep -q "dev_api.py" "$ORIGINAL_CONFIG"; then
            echo "📍 Status: Development mode ENABLED"
            echo "   - Using: python/dev_api.py"
            echo "   - Python changes are immediately visible"
        else
            echo "📍 Status: Development mode DISABLED"
            echo "   - Using: PyInstaller sidecar"
        fi
    else
        echo "📍 Status: Development mode DISABLED"
        echo "   - Using: PyInstaller sidecar"
    fi
}

start_dev() {
    echo "Starting Tauri development server..."
    cd "$SCRIPT_DIR"
    pnpm run tauri dev
}

test_api() {
    echo "Testing Python API directly..."
    cd "$SCRIPT_DIR/python"
    
    echo "1. Testing get_settings..."
    python dev_api.py get_settings
    
    echo ""
    echo "2. Testing save_settings..."
    python dev_api.py save_settings '{"input_fstrs": ["/tmp/test"], "depth": 5}'
    
    echo ""
    echo "3. Testing execute_analysis..."
    python dev_api.py execute_analysis '{"input_fstrs": ["/tmp/test"]}'
    
    echo ""
    echo "✅ API tests completed!"
}

case "${1:-help}" in
    "enable")
        enable_dev_mode
        ;;
    "disable")
        disable_dev_mode
        ;;
    "status")
        show_status
        ;;
    "dev")
        start_dev
        ;;
    "test")
        test_api
        ;;
    "help"|*)
        show_help
        ;;
esac