#!/usr/bin/env python3
"""
Development API script for GitInspectorGUI.

This script acts as a drop-in replacement for the PyInstaller sidecar during development,
allowing immediate testing of Python changes without rebuilding the sidecar binary.

Usage:
    python dev_api.py <command> [args...]

Commands:
    get_settings                    - Get current settings
    save_settings <settings_json>   - Save settings
    execute_analysis <settings_json> - Execute git analysis

This script automatically picks up changes to the gigui.api module without restarts.
"""

import sys
import os
from pathlib import Path

# Ensure we can import the gigui module
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

def main():
    """Main entry point that delegates to the actual API."""
    try:
        # Import the API module (this will pick up any changes automatically)
        from gigui.api import main as api_main
        
        # Call the actual API main function
        api_main()
        
    except ImportError as e:
        print(f"Error importing gigui.api: {e}", file=sys.stderr)
        print("Make sure you're running this script from the correct directory.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()