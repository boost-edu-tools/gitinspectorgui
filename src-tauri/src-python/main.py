"""Main Python entry point for tauri-plugin-python integration.
This module provides the interface between Rust and the Python gitinspector backend.
"""

import json
import os
import sys
from dataclasses import asdict
from pathlib import Path

# Add the project's Python directory to the path
try:
    # Try to use __file__ if available (normal Python execution)
    project_root = Path(__file__).parent.parent.parent
except NameError:
    # Fallback for embedded Python environments like tauri-plugin-python
    project_root = Path.cwd()

python_dir = project_root / "python"
sys.path.insert(0, str(python_dir))

# Import the real analysis API
try:
    from gigui.api.main import GitInspectorAPI
    from gigui.api.types import Settings

    print(f"Successfully imported GitInspectorAPI from {python_dir}")
except ImportError as e:
    print(f"Failed to import GitInspectorAPI: {e}")
    GitInspectorAPI = None
    Settings = None

# Initialize the API instance
api_instance = None
if GitInspectorAPI:
    try:
        api_instance = GitInspectorAPI()
        print("GitInspectorAPI instance created successfully")
    except Exception as e:
        print(f"Failed to create GitInspectorAPI instance: {e}")
        api_instance = None

# Register functions that can be called from Tauri
_tauri_plugin_functions = [
    "execute_analysis",
    "get_settings",
    "save_settings",
    "get_engine_info",
    "get_performance_stats",
    "health_check",
    "get_blame_data",
]


def execute_analysis(settings_json):
    """Execute git analysis with the provided settings."""
    try:
        if not api_instance:
            return json.dumps(
                {
                    "repositories": [],
                    "success": False,
                    "error": "GitInspectorAPI not available",
                }
            )

        # Parse settings
        if isinstance(settings_json, str):
            settings_dict = json.loads(settings_json)
        else:
            settings_dict = settings_json

        # Ensure all required fields have defaults
        defaults = {
            "include_files": [],
            "ex_files": [],
            "extensions": [
                "c",
                "cc",
                "cif",
                "cpp",
                "glsl",
                "h",
                "hh",
                "hpp",
                "java",
                "js",
                "py",
                "rb",
                "sql",
                "ts",
            ],
            "ex_authors": [],
            "ex_emails": [],
            "ex_revisions": [],
            "ex_messages": [],
            "file_formats": ["html"],
            "ex_author_patterns": [],
            "ex_email_patterns": [],
            "ex_message_patterns": [],
            "ex_file_patterns": [],
            "ignore_revs_file": "",
            "enable_ignore_revs": False,
            "blame_follow_moves": True,
            "blame_ignore_whitespace": False,
            "blame_minimal_context": False,
            "blame_show_email": True,
            "output_encoding": "utf-8",
            "date_format": "iso",
            "author_display_format": "name",
            "line_number_format": "decimal",
            "excel_max_rows": 1048576,
            "excel_abbreviate_names": True,
            "excel_freeze_panes": True,
            "html_theme": "default",
            "html_enable_search": True,
            "html_max_entries_per_page": 100,
            "server_port": 8000,
            "server_host": "localhost",
            "max_browser_tabs": 20,
            "auto_open_browser": True,
            "profile": 0,
            "debug_show_main_event_loop": False,
            "debug_multiprocessing": False,
            "debug_git_commands": False,
            "log_git_output": False,
            "legacy_mode": False,
            "preserve_legacy_output_format": False,
            "max_thread_workers": 6,
            "git_log_chunk_size": 100,
            "blame_chunk_size": 20,
            "max_core_workers": 16,
            "memory_limit_mb": 1024,
            "enable_gc_optimization": True,
            "max_commit_count": 0,
            "max_file_size_kb": 1024,
            "follow_renames": True,
            "ignore_merge_commits": False,
        }

        # Apply defaults for missing fields
        for key, default_value in defaults.items():
            if key not in settings_dict or settings_dict[key] is None:
                settings_dict[key] = default_value

        # Convert to Settings object
        if not Settings:
            return json.dumps(
                {
                    "repositories": [],
                    "success": False,
                    "error": "Settings class not available",
                }
            )

        settings = Settings(**settings_dict)

        # Execute analysis using the real API
        result = api_instance.execute_analysis(settings)

        # Convert result to JSON
        return json.dumps(asdict(result))

    except Exception as e:
        import traceback

        error_msg = f"Analysis execution failed: {e}"
        print(f"Error in execute_analysis: {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")

        error_response = {"repositories": [], "success": False, "error": error_msg}
        return json.dumps(error_response)


def get_settings():
    """Get default settings."""
    try:
        if not api_instance:
            # Return basic default settings if API is not available
            default_settings = {
                "input_fstrs": [],
                "depth": 5,
                "subfolder": "",
                "n_files": 5,
                "include_files": [],
                "ex_files": [],
                "extensions": [
                    "c",
                    "cc",
                    "cif",
                    "cpp",
                    "glsl",
                    "h",
                    "hh",
                    "hpp",
                    "java",
                    "js",
                    "py",
                    "rb",
                    "sql",
                    "ts",
                ],
                "ex_authors": [],
                "ex_emails": [],
                "ex_revisions": [],
                "ex_messages": [],
                "since": "",
                "until": "",
                "outfile_base": "gitinspect",
                "fix": "prefix",
                "file_formats": ["html"],
                "view": "auto",
                "copy_move": 1,
                "scaled_percentages": False,
                "blame_exclusions": "hide",
                "blame_skip": False,
                "show_renames": False,
                "deletions": False,
                "whitespace": False,
                "empty_lines": False,
                "comments": False,
                "multithread": True,
                "multicore": False,
                "verbosity": 0,
                "dryrun": 0,
                "gui_settings_full_path": False,
                "col_percent": 75,
            }
            return json.dumps(default_settings)

        # Use the real API to get settings
        settings = api_instance.get_settings()
        return json.dumps(asdict(settings))
    except Exception as e:
        error_response = {"error": str(e)}
        return json.dumps(error_response)


def save_settings(settings_json):
    """Save settings."""
    try:
        # For now, just validate the JSON
        if isinstance(settings_json, str):
            json.loads(settings_json)

        response = {"success": True, "error": None}
        return json.dumps(response)

    except Exception as e:
        response = {"success": False, "error": str(e)}
        return json.dumps(response)


def get_engine_info():
    """Get engine information."""
    try:
        info = {
            "engine": "tauri-plugin-python",
            "version": "0.3.6",
            "python_version": sys.version,
            "backend": "gitinspector-gui",
        }
        return json.dumps(info)
    except Exception as e:
        error_response = {"error": str(e)}
        return json.dumps(error_response)


def get_performance_stats():
    """Get performance statistics."""
    try:
        stats = {"memory_usage": "N/A", "cpu_usage": "N/A", "active_threads": "N/A"}
        return json.dumps(stats)
    except Exception as e:
        error_response = {"error": str(e)}
        return json.dumps(error_response)


def get_blame_data(settings_json):
    """Get blame data for repositories."""
    try:
        if not api_instance:
            return json.dumps({
                "blame_data": [],
                "success": False,
                "error": "GitInspectorAPI not available"
            })

        # Parse settings
        if isinstance(settings_json, str):
            settings_dict = json.loads(settings_json)
        else:
            settings_dict = settings_json

        # For now, return a placeholder response
        # This would be implemented to call the actual blame analysis
        blame_response = {
            "blame_data": [],
            "success": True,
            "message": "Blame data analysis not yet implemented"
        }
        return json.dumps(blame_response)

    except Exception as e:
        error_response = {
            "blame_data": [],
            "success": False,
            "error": str(e)
        }
        return json.dumps(error_response)


def health_check():
    """Perform health check."""
    try:
        status = {
            "status": "healthy",
            "version": "2.0.0-plugin",
            "backend": "tauri-plugin-python",
            "api_available": api_instance is not None,
            "python_path": sys.executable,
            "working_directory": os.getcwd(),
        }
        return json.dumps(status)
    except Exception as e:
        error_response = {"status": "unhealthy", "error": str(e)}
        return json.dumps(error_response)


if __name__ == "__main__":
    # Test the functions
    print("Testing tauri-plugin-python module...")
    print("Health check:", health_check())
    print("Engine info:", get_engine_info())
    print("Settings:", get_settings())
