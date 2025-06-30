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
from pathlib import Path

# Ensure we can import the gigui module
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))


def main():
    """Main entry point that delegates to the actual API."""
    try:
        # Get the absolute path to the script directory
        script_dir = Path(__file__).resolve().parent

        # Find the gitinspectorgui project root by looking for python/gigui directory
        current_path = script_dir
        python_gigui_path = None

        # Search up the directory tree for python/gigui
        for _ in range(10):  # Limit search depth
            potential_path = current_path / "python"
            if potential_path.exists() and (potential_path / "gigui").exists():
                python_gigui_path = potential_path
                break
            current_path = current_path.parent
            if current_path == current_path.parent:  # Reached root
                break

        # If we found the python directory, add it to sys.path
        if python_gigui_path:
            if str(python_gigui_path) not in sys.path:
                sys.path.insert(0, str(python_gigui_path))

        # Also add the script directory itself
        if str(script_dir) not in sys.path:
            sys.path.insert(0, str(script_dir))

        # Import the API module (this will pick up any changes automatically)
        from gigui.api.main import main as api_main

        # Call the actual API main function
        api_main()

    except ImportError as e:
        print(f"Error importing gigui.api: {e}", file=sys.stderr)
        print(f"Current working directory: {Path.cwd()}", file=sys.stderr)
        print(f"Script directory: {Path(__file__).resolve().parent}", file=sys.stderr)
        print(f"Python path: {sys.path}", file=sys.stderr)

        # Debug information
        script_dir = Path(__file__).resolve().parent
        print(f"Searched for python/gigui starting from: {script_dir}", file=sys.stderr)

        # Try to find the python directory
        current_path = script_dir
        for i in range(10):
            potential_path = current_path / "python"
            print(
                f"  Checking: {potential_path} (exists: {potential_path.exists()})",
                file=sys.stderr,
            )
            if potential_path.exists():
                gigui_path = potential_path / "gigui"
                print(
                    f"    gigui at: {gigui_path} (exists: {gigui_path.exists()})",
                    file=sys.stderr,
                )
            current_path = current_path.parent
            if current_path == current_path.parent:
                break

        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
