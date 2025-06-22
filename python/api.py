"""
Legacy API wrapper for GitInspectorGUI.

This module provides a command-line interface that wraps the new GitInspectorAPI
for backward compatibility with existing scripts and tools.
"""

import json
import logging
import sys
from dataclasses import asdict
from typing import Any

# Import required modules
from gigui.api.main import GitInspectorAPI
from gigui.api.types import AnalysisResult, Settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_settings_from_dict(settings_dict: dict[str, Any]) -> Settings:
    """
    Creates a Settings object from a dictionary of settings.
    """
    # Provide defaults for all required fields
    defaults = {
        "input_fstrs": [],
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
        "depth": 0,
        "subfolder": "",
        "n_files": 0,
        "since": "",
        "until": "",
        "outfile_base": "",
        "fix": False,
        "view": False,
        "copy_move": False,
        "scaled_percentages": False,
        "blame_exclusions": False,
        "blame_skip": False,
        "show_renames": False,
        "deletions": False,
        "whitespace": False,
        "empty_lines": False,
        "comments": False,
        "multithread": True,
        "multicore": False,
        "verbosity": 1,
        "max_thread_workers": 4,
        "git_log_chunk_size": 1000,
        "blame_chunk_size": 100,
        "max_core_workers": 2,
        "memory_limit_mb": 512,
        "enable_gc_optimization": True,
        "max_file_size_kb": 1024,
        "max_commit_count": 10000,
        "follow_renames": True,
        "ignore_merge_commits": False,
        "ignore_revs_file": "",
        "enable_ignore_revs": False,
        "blame_follow_moves": True,
        "blame_ignore_whitespace": False,
        "blame_minimal_context": False,
        "blame_show_email": True,
        "output_encoding": "utf-8",
        "date_format": "%Y-%m-%d",
        "author_display_format": "name",
        "line_number_format": "decimal",
        "excel_max_rows": 65536,
        "excel_abbreviate_names": False,
        "excel_freeze_panes": True,
        "html_theme": "default",
        "html_enable_search": True,
        "html_max_entries_per_page": 100,
        "server_port": 8000,
        "server_host": "127.0.0.1",
        "max_browser_tabs": 5,
        "auto_open_browser": False,
        "dryrun": False,
        "profile": False,
        "debug_show_main_event_loop": False,
        "debug_multiprocessing": False,
        "debug_git_commands": False,
        "log_git_output": False,
        "gui_settings_full_path": "",
        "col_percent": False,
        "legacy_mode": False,
        "preserve_legacy_output_format": False,
    }

    # Apply defaults for missing fields
    for key, default_value in defaults.items():
        if key not in settings_dict or settings_dict[key] is None:
            settings_dict[key] = default_value

    # Special handling for n_files, which might be "" in JSON but needs to be int
    if "n_files" in settings_dict and isinstance(settings_dict["n_files"], str):
        try:
            settings_dict["n_files"] = (
                int(settings_dict["n_files"]) if settings_dict["n_files"] else 0
            )
        except ValueError:
            settings_dict["n_files"] = 0

    # Ensure input_fstrs is a list
    if not isinstance(settings_dict["input_fstrs"], list):
        settings_dict["input_fstrs"] = []
        logger.warning("'input_fstrs' was not a list or was missing, defaulting to empty list.")

    try:
        settings = Settings(**settings_dict)
        return settings
    except Exception as e:
        logger.error(f"Failed to create Settings object: {e}")
        raise ValueError(f"Invalid settings: {e}") from e


def process_repositories(settings: Settings) -> dict[str, Any]:
    """
    Processes repositories using the new GitInspectorAPI.
    """
    if not settings.input_fstrs:
        return {"error": "No input repository paths provided in settings."}

    try:
        api = GitInspectorAPI()

        logger.info(f"Starting analysis for {len(settings.input_fstrs)} repositories")
        result = api.execute_analysis(settings)

        if result.success:
            logger.info(f"Successfully processed {len(result.repositories)} repositories")
            return {"status": "success", "data": asdict(result)}
        logger.error(f"Analysis failed: {result.error}")
        return {"status": "error", "error_message": result.error}

    except Exception as e:
        logger.error(f"Error processing repositories: {e}", exc_info=True)
        return {"status": "error", "error_message": str(e)}


def main():
    """Main entry point for command-line usage."""
    # Read settings JSON from stdin
    try:
        input_json_str = sys.stdin.read()
        if not input_json_str:
            print(json.dumps({"error": "No input JSON received from stdin."}), file=sys.stderr)
            sys.exit(1)
        settings_dict = json.loads(input_json_str)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Error reading from stdin: {e}"}), file=sys.stderr)
        sys.exit(1)

    try:
        settings = create_settings_from_dict(settings_dict)
    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    if not settings.input_fstrs:
        print(
            json.dumps(
                {"error": "No input repository paths ('input_fstrs') provided in settings."}
            ),
            file=sys.stderr,
        )
        sys.exit(1)

    result = process_repositories(settings)

    # Output the results as JSON to stdout
    try:
        output_json = json.dumps(result, indent=4)
        print(output_json)
    except TypeError as e:
        # Fallback if complex objects are not serializable
        print(
            json.dumps(
                {
                    "error": f"Failed to serialize results to JSON: {e}",
                    "results_preview": str(result)[:500],
                }
            ),
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
