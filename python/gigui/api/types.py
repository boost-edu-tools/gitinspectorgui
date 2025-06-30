"""
API data types for GitInspectorGUI backend.

This module contains the data classes used by both the API and Legacy Engine
to avoid circular import issues.
"""

from dataclasses import dataclass
from pathlib import Path


@dataclass
class AuthorStat:
    """Statistics for a single author."""

    name: str
    email: str
    commits: int
    insertions: int
    deletions: int
    files: int
    percentage: float
    age: str = ""  # New field for age information


@dataclass
class FileStat:
    """Statistics for a single file."""

    name: str
    path: str
    lines: int
    commits: int
    authors: int
    percentage: float


@dataclass
class BlameEntry:
    """A single blame entry."""

    file: str
    line_number: int
    author: str
    commit: str
    date: str
    content: str


@dataclass
class RepositoryResult:
    """Analysis results for a single repository."""

    name: str
    path: str
    authors: list[AuthorStat]
    files: list[FileStat]
    blame_data: list[BlameEntry]


@dataclass
class AnalysisResult:
    """Complete analysis results."""

    repositories: list[RepositoryResult]
    success: bool
    error: str | None = None


@dataclass
class Settings:
    """Enhanced settings for git repository analysis with legacy compatibility."""

    # Repository and Input Settings
    input_fstrs: list[str]
    depth: int = 5
    subfolder: str = ""

    # File Analysis Settings
    n_files: int = 5
    include_files: list[str] = None
    ex_files: list[str] = None
    extensions: list[str] = None

    # Author and Commit Filtering
    ex_authors: list[str] = None
    ex_emails: list[str] = None
    ex_revisions: list[str] = None
    ex_messages: list[str] = None
    since: str = ""
    until: str = ""

    # Output and Format Settings
    outfile_base: str = "gitinspect"
    fix: str = "prefix"  # Options: "prefix", "postfix", "nofix"
    file_formats: list[str] = None  # Options: ["html", "excel"]
    view: str = "auto"  # Options: "auto", "dynamic-blame-history", "none"

    # Analysis Options
    copy_move: int = 1
    scaled_percentages: bool = False
    blame_exclusions: str = "hide"  # Options: "hide", "show", "remove"
    blame_skip: bool = False
    show_renames: bool = False

    # Content Analysis
    deletions: bool = False
    whitespace: bool = False
    empty_lines: bool = False
    comments: bool = False

    # Performance Settings - Enhanced with legacy threading/chunking options
    multithread: bool = True
    multicore: bool = False
    verbosity: int = 0

    # Advanced Performance Tuning (from legacy)
    max_thread_workers: int = 6
    git_log_chunk_size: int = 100
    blame_chunk_size: int = 20
    max_core_workers: int = 16

    # Memory Management Settings
    memory_limit_mb: int = 1024  # Memory limit for large repositories
    enable_gc_optimization: bool = True  # Enable garbage collection optimization

    # Repository Analysis Depth and Scope Controls
    max_commit_count: int = 0  # 0 = unlimited, >0 = limit commits analyzed
    max_file_size_kb: int = 1024  # Skip files larger than this (in KB)
    follow_renames: bool = True  # Follow file renames in git history
    ignore_merge_commits: bool = False  # Skip merge commits in analysis

    # Advanced Filtering Options - Pattern-based exclusions
    ex_author_patterns: list[str] = None  # Glob patterns for author exclusion
    ex_email_patterns: list[str] = None  # Glob patterns for email exclusion
    ex_message_patterns: list[str] = None  # Glob patterns for commit message exclusion
    ex_file_patterns: list[str] = None  # Advanced file exclusion patterns

    # Ignore-revs File Support (like .git-blame-ignore-revs)
    ignore_revs_file: str = ""  # Path to ignore-revs file
    enable_ignore_revs: bool = False  # Enable ignore-revs functionality

    # Blame Analysis Configuration
    blame_follow_moves: bool = True  # Follow file moves in blame
    blame_ignore_whitespace: bool = False  # Ignore whitespace in blame
    blame_minimal_context: bool = False  # Use minimal context in blame
    blame_show_email: bool = True  # Show email addresses in blame output

    # Output Format and Display Options
    output_encoding: str = "utf-8"  # Output file encoding
    date_format: str = "iso"  # Date format: "iso", "short", "relative"
    author_display_format: str = "name"  # "name", "email", "both"
    line_number_format: str = "decimal"  # "decimal", "hex"

    # Excel-specific Output Options
    excel_max_rows: int = 1048576  # Excel row limit
    excel_abbreviate_names: bool = True  # Abbreviate long names in Excel
    excel_freeze_panes: bool = True  # Freeze header panes in Excel

    # HTML-specific Output Options
    html_theme: str = "default"  # HTML theme: "default", "dark", "light"
    html_enable_search: bool = True  # Enable search functionality in HTML
    html_max_entries_per_page: int = 100  # Pagination for large datasets

    # Web Server Options (for dynamic blame history)
    server_port: int = 8000
    server_host: str = "localhost"
    max_browser_tabs: int = 20
    auto_open_browser: bool = True

    # Development/Testing
    dryrun: int = 0
    profile: int = 0  # Profiling level (0=off, 1=basic, 2=detailed)

    # Debug and Logging Options
    debug_show_main_event_loop: bool = False
    debug_multiprocessing: bool = False
    debug_git_commands: bool = False
    log_git_output: bool = False

    # GUI-specific
    gui_settings_full_path: bool = False
    col_percent: int = 75

    # Legacy Compatibility Settings
    legacy_mode: bool = False  # Enable legacy compatibility mode
    preserve_legacy_output_format: bool = False  # Preserve exact legacy output format

    def __post_init__(self):
        """Initialize empty lists for None values and validate settings."""
        # Basic file and extension settings
        if self.include_files is None:
            self.include_files = []
        if self.ex_files is None:
            self.ex_files = []
        if self.extensions is None:
            self.extensions = [
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
            ]
        if self.file_formats is None:
            self.file_formats = ["html"]

        # Basic exclusion settings
        if self.ex_authors is None:
            self.ex_authors = []
        if self.ex_emails is None:
            self.ex_emails = []
        if self.ex_revisions is None:
            self.ex_revisions = []
        if self.ex_messages is None:
            self.ex_messages = []

        # Advanced pattern-based exclusion settings
        if self.ex_author_patterns is None:
            self.ex_author_patterns = []
        if self.ex_email_patterns is None:
            self.ex_email_patterns = []
        if self.ex_message_patterns is None:
            self.ex_message_patterns = []
        if self.ex_file_patterns is None:
            self.ex_file_patterns = []

        # Validation of numeric settings
        if not self.n_files >= 0:
            raise ValueError("n_files must be a non-negative integer")
        if not self.depth >= 0:
            raise ValueError("depth must be a non-negative integer")
        if not self.max_thread_workers >= 1:
            raise ValueError("max_thread_workers must be at least 1")
        if not self.git_log_chunk_size >= 1:
            raise ValueError("git_log_chunk_size must be at least 1")
        if not self.blame_chunk_size >= 1:
            raise ValueError("blame_chunk_size must be at least 1")
        if not self.memory_limit_mb >= 64:
            raise ValueError("memory_limit_mb must be at least 64 MB")
        if not self.max_file_size_kb >= 1:
            raise ValueError("max_file_size_kb must be at least 1 KB")

        # Validation of choice settings
        valid_fix_options = ["prefix", "postfix", "nofix"]
        if self.fix not in valid_fix_options:
            raise ValueError(f"fix must be one of {valid_fix_options}")

        valid_view_options = ["auto", "dynamic-blame-history", "none"]
        if self.view not in valid_view_options:
            raise ValueError(f"view must be one of {valid_view_options}")

        valid_blame_exclusions = ["hide", "show", "remove"]
        if self.blame_exclusions not in valid_blame_exclusions:
            raise ValueError(
                f"blame_exclusions must be one of {valid_blame_exclusions}"
            )

        valid_date_formats = ["iso", "short", "relative"]
        if self.date_format not in valid_date_formats:
            raise ValueError(f"date_format must be one of {valid_date_formats}")

        valid_author_formats = ["name", "email", "both"]
        if self.author_display_format not in valid_author_formats:
            raise ValueError(
                f"author_display_format must be one of {valid_author_formats}"
            )

        # Ensure file_formats contains valid options
        valid_file_formats = ["html", "excel"]
        for fmt in self.file_formats:
            if fmt not in valid_file_formats:
                raise ValueError(
                    f"file_format '{fmt}' must be one of {valid_file_formats}"
                )

        # Set CPU-based defaults for core workers
        import os

        cpu_count = os.cpu_count() or 1
        if self.max_core_workers > cpu_count:
            self.max_core_workers = min(cpu_count, 16)

    def normalize_paths(self):
        """Normalize file paths for cross-platform compatibility."""

        # Normalize input paths
        self.input_fstrs = [str(Path(p).as_posix()) for p in self.input_fstrs]

        # Normalize file patterns
        self.ex_files = [str(Path(p).as_posix()) for p in self.ex_files]
        self.include_files = [str(Path(p).as_posix()) for p in self.include_files]
        self.ex_file_patterns = [str(Path(p).as_posix()) for p in self.ex_file_patterns]

        # Normalize subfolder path
        if self.subfolder:
            self.subfolder = str(Path(self.subfolder).as_posix())

        # Normalize ignore-revs file path
        if self.ignore_revs_file:
            self.ignore_revs_file = str(Path(self.ignore_revs_file).as_posix())

    def get_effective_extensions(self) -> list[str]:
        """Get the effective list of file extensions to analyze."""
        if not self.extensions:
            return [
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
            ]
        return self.extensions

    def get_all_exclusion_patterns(self) -> dict[str, list[str]]:
        """Get all exclusion patterns organized by type."""
        return {
            "authors": self.ex_authors + self.ex_author_patterns,
            "emails": self.ex_emails + self.ex_email_patterns,
            "messages": self.ex_messages + self.ex_message_patterns,
            "files": self.ex_files + self.ex_file_patterns,
            "revisions": self.ex_revisions,
        }

    def is_performance_optimized(self) -> bool:
        """Check if performance optimization settings are enabled."""
        return (
            self.multithread
            and self.max_thread_workers > 1
            and self.git_log_chunk_size >= 50
            and self.enable_gc_optimization
        )

    def get_memory_settings(self) -> dict[str, int]:
        """Get memory-related settings."""
        return {
            "memory_limit_mb": self.memory_limit_mb,
            "max_file_size_kb": self.max_file_size_kb,
            "git_log_chunk_size": self.git_log_chunk_size,
            "blame_chunk_size": self.blame_chunk_size,
        }

    def configure_for_large_repository(self):
        """Configure settings optimized for large repositories."""
        self.multithread = True
        self.multicore = True
        self.max_thread_workers = min(8, self.max_core_workers)
        self.git_log_chunk_size = 200
        self.blame_chunk_size = 50
        self.memory_limit_mb = 2048
        self.enable_gc_optimization = True
        self.max_file_size_kb = 2048

    def configure_for_small_repository(self):
        """Configure settings optimized for small repositories."""
        self.multithread = False
        self.multicore = False
        self.max_thread_workers = 1
        self.git_log_chunk_size = 50
        self.blame_chunk_size = 10
        self.memory_limit_mb = 512
        self.enable_gc_optimization = False

    def to_legacy_format(self) -> dict:
        """Convert settings to legacy format for compatibility."""
        return {
            "input_fstrs": self.input_fstrs,
            "depth": self.depth,
            "subfolder": self.subfolder,
            "n_files": self.n_files,
            "include_files": self.include_files,
            "ex_files": self.ex_files,
            "extensions": self.extensions,
            "ex_authors": self.ex_authors,
            "ex_emails": self.ex_emails,
            "ex_revisions": self.ex_revisions,
            "ex_messages": self.ex_messages,
            "since": self.since,
            "until": self.until,
            "outfile_base": self.outfile_base,
            "fix": self.fix,
            "file_formats": self.file_formats,
            "view": self.view,
            "copy_move": self.copy_move,
            "scaled_percentages": self.scaled_percentages,
            "blame_exclusions": self.blame_exclusions,
            "blame_skip": self.blame_skip,
            "show_renames": self.show_renames,
            "deletions": self.deletions,
            "whitespace": self.whitespace,
            "empty_lines": self.empty_lines,
            "comments": self.comments,
            "multithread": self.multithread,
            "multicore": self.multicore,
            "verbosity": self.verbosity,
            "dryrun": self.dryrun,
            "gui_settings_full_path": self.gui_settings_full_path,
            "col_percent": self.col_percent,
            "profile": self.profile,
        }
