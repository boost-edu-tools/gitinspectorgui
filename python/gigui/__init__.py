"""
GitInspectorGUI - Modern git repository analysis tool.

This package provides the core Python backend for analyzing git repositories,
extracting statistics, and generating blame analysis data.
"""

from gigui.api.http_server import app, start_server
from gigui.api.main import GitInspectorAPI
from gigui.api.types import (
    AnalysisResult,
    AuthorStat,
    BlameEntry,
    FileStat,
    RepositoryResult,
    Settings,
)
from gigui.common import (
    Keys,
    divide_to_percentage,
    ensure_directory_exists,
    format_bytes,
    get_digit,
    get_dir_matches,
    get_file_extension,
    get_outfile_name,
    get_pos_number,
    get_pos_number_or_empty,
    get_posix_dir_matches_for,
    get_relative_fstr,
    get_version,
    log,
    log_end_time,
    non_hex_chars_in_list,
    open_file,
    out_profile,
    print_threads,
    resolve_and_strip_input_fstrs,
    safe_divide,
    setup_sigint_handler,
    sigint_handler,
    strip_quotes,
    to_posix_fstr,
    to_posix_fstrs,
    to_system_fstr,
    to_system_fstrs,
    truncate_string,
    validate_file_path,
)
from gigui.performance_monitor import profiler

__version__ = "0.1.0"
__author__ = "Bert van Beek"
__email__ = "d.a.v.beek@tue.nl"

__all__ = [
    # API types
    "AnalysisResult",
    "AuthorStat",
    "BlameEntry",
    "FileStat",
    "GitInspectorAPI",
    "RepositoryResult",
    "Settings",
    "app",
    "start_server",
    
    # Utility functions
    "Keys",
    "divide_to_percentage",
    "ensure_directory_exists",
    "format_bytes",
    "get_digit",
    "get_dir_matches",
    "get_file_extension",
    "get_outfile_name",
    "get_pos_number",
    "get_pos_number_or_empty",
    "get_posix_dir_matches_for",
    "get_relative_fstr",
    "get_version",
    "log",
    "log_end_time",
    "non_hex_chars_in_list",
    "open_file",
    "out_profile",
    "print_threads",
    "profiler",
    "resolve_and_strip_input_fstrs",
    "safe_divide",
    "setup_sigint_handler",
    "sigint_handler",
    "strip_quotes",
    "to_posix_fstr",
    "to_posix_fstrs",
    "to_system_fstr",
    "to_system_fstrs",
    "truncate_string",
    "validate_file_path",
]
