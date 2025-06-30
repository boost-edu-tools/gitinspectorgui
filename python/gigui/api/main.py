# Allow print statements: (Updated for clean author names)
# Lines 272, 282, 292, 300: Required for JSON output to stdout (API responses)
# Lines 263, 276, 286: Required for usage messages to stderr
# Lines 155, 165, 295: Error messages to stderr
"""API module for GitInspectorGUI backend.

This module provides a JSON API interface for the Tauri frontend to communicate
with the Python backend for git repository analysis using the sophisticated
legacy analysis engine.

PHASE 4 COMPLETION: This API now uses the Legacy Engine Wrapper to provide
sophisticated analysis while maintaining the existing API contract for the frontend.
"""

import json
import logging
import sys
import time
from dataclasses import asdict, dataclass
from math import floor
from pathlib import Path

from gigui.api.types import (
    AnalysisResult,
    Settings,
)
from gigui.typedefs import SHA, Author, Email, FileStr

# Configure logging for API operations
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("gitinspector_api.log", mode="a"),
    ],
)
logger = logging.getLogger(__name__)

# Constants for time calculations
NOW = int(time.time())
SECONDS_IN_DAY = 86400
DAYS_IN_YEAR = 365.25
DAYS_IN_MONTH = 30.44


# Import at module level
from gigui.core.legacy_engine import LegacyEngineWrapper


@dataclass
class CommitGroup:
    """A CommitGroup holds the sum of commit data for commits that share the same person author and file name."""

    fstr: FileStr
    author: Author
    insertions: int
    deletions: int
    date_sum: int
    shas: set[SHA]


class Stat:
    """Statistics for commits, insertions, deletions, and blame data."""

    def __init__(self) -> None:
        self.shas: set[SHA] = (
            set()
        )  # Use to calculate the number of commits as len(shas)
        self.insertions: int = 0
        self.deletions: int = 0
        self.date_sum: int = 0  # Sum of Unix timestamps in seconds
        self.blame_line_count: int = 0
        self.percent_insertions: float = 0
        self.percent_deletions: float = 0
        self.percent_lines: float = 0

    @property
    def stability(self) -> int | str:
        """Calculate stability as percentage of blame lines vs insertions."""
        return (
            min(100, round(100 * self.blame_line_count / self.insertions))
            if self.insertions and self.blame_line_count
            else ""
        )

    @property
    def age(self) -> str:
        """Calculate average age of commits."""
        return (
            self.timestamp_to_age(round(self.date_sum / self.insertions))
            if self.insertions > 0
            else ""
        )

    def add(self, other: "Stat"):
        """Add another Stat object to this one."""
        self.shas = self.shas | other.shas
        self.insertions = self.insertions + other.insertions
        self.deletions = self.deletions + other.deletions
        self.date_sum = self.date_sum + other.date_sum
        self.blame_line_count = self.blame_line_count + other.blame_line_count

    def add_commit_group(self, commit_group: CommitGroup):
        """Add a CommitGroup to this Stat."""
        self.shas |= commit_group.shas
        self.insertions += commit_group.insertions
        self.deletions += commit_group.deletions
        self.date_sum += commit_group.date_sum

    @staticmethod
    def timestamp_to_age(time_stamp: int) -> str:
        """Convert Unix timestamp to human-readable age string."""
        seconds: int = NOW - time_stamp
        days: float = seconds / SECONDS_IN_DAY
        years: int = floor(days / DAYS_IN_YEAR)
        remaining_days: float = days - years * DAYS_IN_YEAR
        months: int = floor(remaining_days / DAYS_IN_MONTH)
        remaining_days = round(remaining_days - months * DAYS_IN_MONTH)
        if years:
            return f"{years}:{months:02}:{remaining_days:02}"
        return f"{months:02}:{remaining_days:02}"


class Person:
    """Represents a person (author) with multiple possible names and emails."""

    # Class-level settings that can be configured from Settings
    show_renames: bool = False
    ex_author_patterns: list[str] = []
    ex_email_patterns: list[str] = []

    @classmethod
    def configure_from_settings(cls, settings: "Settings"):
        """Configure Person class filtering from Settings object."""
        cls.show_renames = settings.show_renames
        cls.ex_author_patterns = settings.ex_author_patterns + settings.ex_authors
        cls.ex_email_patterns = settings.ex_email_patterns + settings.ex_emails

    def __init__(self, author: Author, email: Email):
        self.authors: set[Author] = {author}
        self.emails: set[Email] = {email}
        self.author: Author = self.get_author()

        # If any of the filters match, this will be set to True
        # so that the person will be excluded from the output.
        self.filter_matched: bool = False

        self.match_author_filter(author)
        self.match_email_filter(email)

    def match_author_filter(self, author: str):
        """Check if author matches exclusion patterns."""
        self.find_filter_match(self.ex_author_patterns, author)

    def match_email_filter(self, email: str):
        """Check if email matches exclusion patterns."""
        self.find_filter_match(self.ex_email_patterns, email)

    def find_filter_match(self, patterns: list[str], author_or_email: str):
        """Check if author or email matches any exclusion pattern.

        Supports both exact string matches and glob patterns.
        """
        import re
        from fnmatch import fnmatchcase

        if self.filter_matched or author_or_email == "*":
            return

        for pattern in patterns:
            if not pattern:  # Skip empty patterns
                continue

            # Check for exact match first (case-insensitive)
            if pattern.lower() == author_or_email.lower():
                self.filter_matched = True
                return

            # Check for glob pattern match
            if fnmatchcase(author_or_email.lower(), pattern.lower()):
                self.filter_matched = True
                return

            # Check for regex pattern (if pattern contains regex metacharacters)
            if any(char in pattern for char in r"[]{}()+*?^$|\."):
                try:
                    if re.search(pattern, author_or_email, re.IGNORECASE):
                        self.filter_matched = True
                        return
                except re.error:
                    # If regex is invalid, fall back to literal string comparison
                    continue

    def merge(self, other: "Person") -> "Person":
        """Merge another person with this one."""
        self.authors |= other.authors
        if self.emails == {""}:
            self.emails = other.emails
        else:
            self.emails |= other.emails
        self.filter_matched = self.filter_matched or other.filter_matched
        self.author = self.get_author()
        return self

    def get_author(self) -> Author:
        """Get the best author name from available authors."""
        # Prefer authors with spaces (first and last name)
        nice_authors = {author for author in self.authors if " " in author}
        if nice_authors:
            return sorted(nice_authors)[0]
        return sorted(self.authors)[0] if self.authors else ""

    @property
    def authors_str(self) -> str:
        """Get formatted string of all author names."""
        return ", ".join(sorted(self.authors))

    @property
    def emails_str(self) -> str:
        """Get formatted string of all email addresses."""
        return ", ".join(sorted(self.emails))

    def __hash__(self) -> int:
        """Required for manipulating Person objects in a set."""
        return hash((frozenset(self.authors), frozenset(self.emails)))

    def __repr__(self):
        return f"Person({self.author}, {list(self.emails)[0] if self.emails else ''})"


class GitRepository:
    """DEPRECATED: Simple Git repository wrapper for basic operations.

    This class is maintained for backward compatibility but is no longer used
    in the main analysis workflow. The Legacy Engine Wrapper now handles all
    sophisticated git repository analysis.
    """

    def __init__(self, path: str):
        self.path = Path(path)
        self.name = self.path.name
        logger.warning(
            "GitRepository class is deprecated. Use Legacy Engine Wrapper instead."
        )

    def is_git_repository(self) -> bool:
        """Check if the path is a git repository."""
        return (self.path / ".git").exists() or (self.path / ".git").is_file()

    def get_tracked_files(self) -> list[FileStr]:
        """DEPRECATED: Get list of tracked files in the repository."""
        logger.warning(
            "get_tracked_files is deprecated. Use Legacy Engine Wrapper for analysis."
        )
        import subprocess

        try:
            if not self.is_git_repository():
                return []

            result = subprocess.run(
                ["git", "ls-files"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )

            if result.returncode == 0:
                files = [f.strip() for f in result.stdout.split("\n") if f.strip()]
                return files[:50]  # Limit to first 50 files for demo
            return []

        except (
            subprocess.TimeoutExpired,
            subprocess.SubprocessError,
            FileNotFoundError,
        ):
            return []

    def get_commit_count(self) -> int:
        """DEPRECATED: Get total number of commits in the repository."""
        logger.warning(
            "get_commit_count is deprecated. Use Legacy Engine Wrapper for analysis."
        )
        import subprocess

        try:
            if not self.is_git_repository():
                return 0

            result = subprocess.run(
                ["git", "rev-list", "--count", "HEAD"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
            )

            if result.returncode == 0:
                return int(result.stdout.strip())
            return 0

        except (
            subprocess.TimeoutExpired,
            subprocess.SubprocessError,
            FileNotFoundError,
            ValueError,
        ):
            return 0

    def get_authors(self) -> list[str]:
        """DEPRECATED: Get list of authors who have committed to this repository."""
        logger.warning(
            "get_authors is deprecated. Use Legacy Engine Wrapper for analysis."
        )
        import subprocess

        try:
            if not self.is_git_repository():
                return []

            result = subprocess.run(
                ["git", "log", "--format=%an <%ae>"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )

            if result.returncode == 0:
                authors = list(
                    set(
                        line.strip()
                        for line in result.stdout.split("\n")
                        if line.strip()
                    )
                )
                return authors[:10]  # Limit to first 10 authors for demo
            return []

        except (
            subprocess.TimeoutExpired,
            subprocess.SubprocessError,
            FileNotFoundError,
        ):
            return []

    def get_author_stats(self) -> dict[str, dict]:
        """DEPRECATED: Get detailed statistics for each author."""
        logger.warning(
            "get_author_stats is deprecated. Use Legacy Engine Wrapper for analysis."
        )
        import subprocess

        try:
            if not self.is_git_repository():
                return {}

            # Get commit stats per author
            result = subprocess.run(
                ["git", "log", "--format=%an <%ae>|%H|%ct", "--numstat"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
            )

            if result.returncode != 0:
                return {}

            author_stats = {}
            current_author = None
            current_commit = None
            current_timestamp = None

            for line in result.stdout.split("\n"):
                line = line.strip()
                if not line:
                    continue

                if "|" in line and len(line.split("|")) == 3:
                    # Author line: "Name <email>|commit_hash|timestamp"
                    parts = line.split("|")
                    current_author = parts[0]
                    current_commit = parts[1]
                    current_timestamp = int(parts[2])

                    if current_author not in author_stats:
                        author_stats[current_author] = {
                            "commits": set(),
                            "insertions": 0,
                            "deletions": 0,
                            "files": set(),
                            "timestamps": [],
                        }

                    author_stats[current_author]["commits"].add(current_commit)
                    author_stats[current_author]["timestamps"].append(current_timestamp)

                elif current_author and "\t" in line:
                    # Stat line: "insertions\tdeletions\tfilename"
                    parts = line.split("\t")
                    if len(parts) >= 3:
                        try:
                            insertions = int(parts[0]) if parts[0] != "-" else 0
                            deletions = int(parts[1]) if parts[1] != "-" else 0
                            filename = parts[2]

                            author_stats[current_author]["insertions"] += insertions
                            author_stats[current_author]["deletions"] += deletions
                            author_stats[current_author]["files"].add(filename)
                        except ValueError:
                            continue

            # Convert sets to counts and calculate percentages
            total_commits = sum(
                len(stats["commits"]) for stats in author_stats.values()
            )

            for author, stats in author_stats.items():
                stats["commit_count"] = len(stats["commits"])
                stats["file_count"] = len(stats["files"])
                stats["percentage"] = (
                    (stats["commit_count"] / total_commits * 100)
                    if total_commits > 0
                    else 0
                )

                # Calculate age from oldest commit
                if stats["timestamps"]:
                    oldest_timestamp = min(stats["timestamps"])
                    stats["age"] = Stat.timestamp_to_age(oldest_timestamp)
                else:
                    stats["age"] = "0:00:00"

            return author_stats

        except (
            subprocess.TimeoutExpired,
            subprocess.SubprocessError,
            FileNotFoundError,
            ValueError,
        ):
            return {}


class GitInspectorAPI:
    """Main API class for git repository analysis.

    PHASE 4 COMPLETION: This API class now integrates with the sophisticated
    legacy analysis engine while maintaining the existing API contract for
    the frontend. All analysis operations are delegated to the Legacy Engine
    Wrapper for enhanced performance and capabilities.
    """

    def __init__(self, engine=None):
        """Initialize the API with legacy engine integration."""
        self.settings_file = Path.home() / ".gitinspectorgui" / "settings.json"
        self.settings_file.parent.mkdir(exist_ok=True)

        # Initialize performance tracking
        self._api_start_time = time.time()
        self._analysis_count = 0

        # Use dependency injection for the engine
        self.engine = engine or LegacyEngineWrapper()

        logger.info(
            "GitInspectorAPI initialized with Legacy Engine Wrapper integration"
        )
        logger.info(
            f"Legacy Engine capabilities: {len(self.engine.get_engine_info()['capabilities'])} features"
        )

    def get_settings(self) -> Settings:
        """Load settings from file or return defaults with enhanced error handling."""
        logger.debug("Loading settings from file")

        if self.settings_file.exists():
            try:
                with self.settings_file.open(encoding="utf-8") as f:
                    data = json.load(f)

                settings = Settings(**data)
                logger.info(
                    f"Settings loaded successfully: {len(settings.input_fstrs)} repositories configured"
                )
                return settings

            except (json.JSONDecodeError, OSError, TypeError) as e:
                logger.error(f"Error loading settings: {e}")
                print(f"Error loading settings: {e}", file=sys.stderr)

        logger.info("Using default settings")
        return Settings(input_fstrs=[])

    def save_settings(self, settings: Settings) -> None:
        """Save settings to file with enhanced validation and error handling."""
        logger.debug("Saving settings to file")

        try:
            # Validate settings before saving
            is_valid, error_msg = self.engine.validate_settings(settings)
            if not is_valid:
                logger.warning(f"Saving potentially invalid settings: {error_msg}")

            # Normalize paths before saving
            settings.normalize_paths()

            with self.settings_file.open("w", encoding="utf-8") as f:
                json.dump(asdict(settings), f, indent=2)

            logger.info(
                f"Settings saved successfully: {len(settings.input_fstrs)} repositories configured"
            )

        except OSError as e:
            logger.error(f"Error saving settings: {e}")
            print(f"Error saving settings: {e}", file=sys.stderr)
            raise

    def execute_analysis(self, settings: Settings) -> AnalysisResult:
        """Execute git repository analysis using the sophisticated legacy engine.

        PHASE 4 COMPLETION: This method now uses the Legacy Engine Wrapper to provide
        sophisticated analysis while maintaining the existing API contract for the frontend.

        The legacy engine provides:
        - Advanced person identity merging
        - Sophisticated statistics calculation
        - Comprehensive blame analysis
        - Performance-optimized git operations
        - Pattern-based filtering
        - Memory management
        - Multi-threading support

        Args:
            settings: Enhanced GUI settings object

        Returns:
            AnalysisResult compatible with current GUI frontend

        """
        # Configure logging level based on debug settings
        if getattr(settings, "debug_logging", False):
            logger.setLevel(logging.DEBUG)
            logger.debug("Debug logging enabled for analysis")
        else:
            logger.setLevel(logging.INFO)

        start_time = time.time()
        logger.info("=== API ANALYSIS EXECUTION STARTED ===")
        logger.info("API executing analysis using Legacy Engine Wrapper")

        # Log detailed settings for debugging
        logger.debug("Analysis settings received:")
        logger.debug(f"  - Repositories: {settings.input_fstrs}")
        logger.debug(f"  - Debug logging: {getattr(settings, 'debug_logging', False)}")
        logger.debug(
            f"  - Debug API calls: {getattr(settings, 'debug_api_calls', False)}"
        )
        logger.debug(
            f"  - Debug analysis flow: {getattr(settings, 'debug_analysis_flow', False)}"
        )
        logger.debug(f"  - Verbosity: {settings.verbosity}")
        logger.debug(f"  - Extensions: {settings.extensions}")
        logger.debug(f"  - Multithread: {settings.multithread}")

        try:
            # Validate settings before delegating to legacy engine
            logger.debug("Validating settings with legacy engine")
            is_valid, error_msg = self.engine.validate_settings(settings)
            if not is_valid:
                logger.error(f"Settings validation failed: {error_msg}")
                return AnalysisResult(
                    repositories=[],
                    success=False,
                    error=f"Settings validation failed: {error_msg}",
                )
            logger.debug("Settings validation passed")

            # Configure Person class with enhanced filtering settings (for backward compatibility)
            logger.debug("Configuring Person class with settings")
            Person.configure_from_settings(settings)

            # Fix working directory issue: resolve relative paths correctly
            # When server runs from python/ directory, "." refers to python/, not project root
            # We need to resolve paths relative to the project root, not current working directory
            import os
            from pathlib import Path

            logger.debug("Resolving repository paths")

            # Find the project root (directory containing .git)
            current_dir = Path.cwd()
            project_root = current_dir

            # Search upward for .git directory
            while project_root != project_root.parent:
                if (project_root / ".git").exists():
                    break
                project_root = project_root.parent
            else:
                # If no .git found, check if current directory has .git
                if not (current_dir / ".git").exists():
                    # Try using the parent of python directory if we're in python/
                    if current_dir.name == "python":
                        project_root = current_dir.parent
                    else:
                        project_root = current_dir

            logger.info(f"Resolved project root: {project_root}")
            logger.info(f"Current working directory: {current_dir}")

            # Resolve input paths relative to project root
            resolved_paths = []
            for path_str in settings.input_fstrs:
                if path_str == ".":
                    # "." should refer to project root, not current working directory
                    resolved_path = str(project_root)
                elif not os.path.isabs(path_str):
                    # Relative paths should be relative to project root
                    resolved_path = str(project_root / path_str)
                else:
                    # Absolute paths remain unchanged
                    resolved_path = path_str

                resolved_paths.append(resolved_path)
                logger.info(f"Resolved path: {path_str} -> {resolved_path}")

                # Validate that the resolved path exists and is a git repository
                resolved_path_obj = Path(resolved_path)
                if not resolved_path_obj.exists():
                    logger.error(f"Repository path does not exist: {resolved_path}")
                elif (
                    not (resolved_path_obj / ".git").exists()
                    and not (resolved_path_obj / ".git").is_file()
                ):
                    logger.warning(f"Path is not a git repository: {resolved_path}")
                else:
                    logger.debug(f"Repository path validated: {resolved_path}")

            # Update settings with resolved paths
            settings.input_fstrs = resolved_paths
            logger.debug(f"Updated settings with {len(resolved_paths)} resolved paths")

            # Normalize paths for cross-platform compatibility
            logger.debug("Normalizing paths for cross-platform compatibility")
            settings.normalize_paths()

            # Delegate to the sophisticated legacy engine
            logger.info("=== DELEGATING TO LEGACY ENGINE WRAPPER ===")
            logger.debug("Calling legacy_engine.execute_analysis()")

            result = self.engine.execute_analysis(settings)

            analysis_time = time.time() - start_time
            logger.info(
                f"Legacy engine analysis completed in {analysis_time:.2f} seconds"
            )

            # Update analysis count for performance tracking
            self._analysis_count += 1

            # Log detailed results for debugging
            logger.debug("=== ANALYSIS RESULTS SUMMARY ===")
            logger.debug(f"Success: {result.success}")
            logger.debug(f"Error: {result.error}")
            logger.debug(
                f"Repository count: {len(result.repositories) if result.repositories else 0}"
            )

            if result.repositories:
                for i, repo in enumerate(result.repositories):
                    logger.debug(f"Repository {i + 1}:")
                    logger.debug(f"  - Name: {repo.name}")
                    logger.debug(f"  - Path: {repo.path}")
                    logger.debug(
                        f"  - Authors: {len(repo.authors) if repo.authors else 0}"
                    )
                    logger.debug(f"  - Files: {len(repo.files) if repo.files else 0}")
                    logger.debug(
                        f"  - Blame entries: {len(repo.blame_data) if repo.blame_data else 0}"
                    )
            else:
                logger.warning("No repositories in result!")

            # Log completion status
            if result.success and result.repositories:
                logger.info(
                    f"Analysis completed successfully: {len(result.repositories)} repositories processed"
                )
            else:
                logger.warning(f"Analysis completed with issues: {result.error}")
                if not result.repositories:
                    logger.error("CRITICAL: Analysis returned zero repositories!")

            logger.info("=== API ANALYSIS EXECUTION COMPLETED ===")
            return result

        except Exception as e:
            analysis_time = time.time() - start_time
            logger.error(
                f"API analysis execution failed after {analysis_time:.2f} seconds: {e}"
            )
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Exception details: {e!s}")

            # Log stack trace for debugging
            import traceback

            logger.error(f"Stack trace:\n{traceback.format_exc()}")

            return AnalysisResult(
                repositories=[],
                success=False,
                error=f"API analysis execution failed: {e}",
            )

    def get_engine_info(self) -> dict:
        """Get information about the analysis engine capabilities.

        Returns:
            Dictionary with engine information and capabilities

        """
        engine_info = self.engine.get_engine_info()
        engine_info["api_integration"] = {
            "version": "4.0.0",
            "integration_complete": True,
            "legacy_engine_active": True,
            "api_uptime_seconds": time.time() - self._api_start_time,
            "analyses_performed": self._analysis_count,
        }
        return engine_info

    def validate_settings(self, settings: Settings) -> tuple[bool, str]:
        """Validate settings for analysis compatibility.

        Args:
            settings: Settings to validate

        Returns:
            Tuple of (is_valid, error_message)

        """
        return self.engine.validate_settings(settings)

    def get_performance_stats(self) -> dict:
        """Get API performance statistics.

        Returns:
            Dictionary with performance metrics

        """
        uptime = time.time() - self._api_start_time
        return {
            "api_uptime_seconds": uptime,
            "analyses_performed": self._analysis_count,
            "average_analyses_per_hour": (self._analysis_count / uptime * 3600)
            if uptime > 0
            else 0,
            "legacy_engine_active": True,
            "settings_file": str(self.settings_file),
            "settings_file_exists": self.settings_file.exists(),
        }


def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) < 2:
        print("Usage: python api.py <command> [args...]", file=sys.stderr)
        sys.exit(1)

    api = GitInspectorAPI()
    command = sys.argv[1]

    try:
        if command == "get_settings":
            settings = api.get_settings()
            print(json.dumps(asdict(settings)))

        elif command == "save_settings":
            if len(sys.argv) < 3:
                print(
                    "Usage: python api.py save_settings <settings_json>",
                    file=sys.stderr,
                )
                sys.exit(1)

            settings_data = json.loads(sys.argv[2])

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
            }

            # Apply defaults for missing fields
            for key, default_value in defaults.items():
                if key not in settings_data or settings_data[key] is None:
                    settings_data[key] = default_value

            settings = Settings(**settings_data)
            api.save_settings(settings)
            print(json.dumps({"success": True}))

        elif command == "execute_analysis":
            if len(sys.argv) < 3:
                print(
                    "Usage: python api.py execute_analysis <settings_json>",
                    file=sys.stderr,
                )
                sys.exit(1)

            settings_data = json.loads(sys.argv[2])

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
            }

            # Apply defaults for missing fields
            for key, default_value in defaults.items():
                if key not in settings_data or settings_data[key] is None:
                    settings_data[key] = default_value

            settings = Settings(**settings_data)
            result = api.execute_analysis(settings)
            print(json.dumps(asdict(result)))

        elif command == "get_engine_info":
            engine_info = api.get_engine_info()
            print(json.dumps(engine_info))

        elif command == "get_performance_stats":
            stats = api.get_performance_stats()
            print(json.dumps(stats))

        elif command == "health_check":
            try:
                engine_info = api.get_engine_info()
                health_status = {
                    "status": "healthy",
                    "version": "2.0.0-pyo3",
                    "backend": "PyO3",
                    "engine_active": True,
                }
                print(json.dumps(health_status))
            except Exception as e:
                error_result = {"status": "unhealthy", "error": str(e)}
                print(json.dumps(error_result))

        else:
            print(f"Unknown command: {command}", file=sys.stderr)
            sys.exit(1)

    except (json.JSONDecodeError, TypeError, ValueError, KeyError) as e:
        error_result = {
            "success": False,
            "error": f"Command error ({type(e).__name__}): {e}",
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
