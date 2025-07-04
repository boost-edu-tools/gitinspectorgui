"""Legacy Engine Wrapper for GitInspectorGUI.

This module provides the bridge between the current API and the sophisticated legacy
analysis engine, enabling seamless integration of all migrated components from Phases 1-3
while maintaining the existing API contract for the frontend.

Key Features:
- Settings translation from current Settings to legacy Args format
- Result format conversion from legacy analysis to current GUI format
- Comprehensive error handling and graceful degradation
- Performance monitoring and logging
- Integration with all migrated legacy components
- Backward compatibility preservation

Classes:
    LegacyEngineWrapper: Main bridge between current API and legacy analysis
    SettingsTranslator: Converts GUI Settings to legacy Args format
    ResultConverter: Converts legacy RepoData to GUI AnalysisResult format
    PerformanceMonitor: Tracks analysis performance and resource usage
"""

import contextlib
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import psutil

from gigui.api.types import (
    AnalysisResult,
    AuthorStat,
    BlameEntry,
    FileStat,
    RepositoryResult,
    Settings,
)
from gigui.common import format_bytes, safe_divide, validate_file_path
from gigui.core.orchestrator import RepoData
from gigui.core.statistics import IniRepo
from gigui.performance_monitor import profiler

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance metrics for analysis operations."""

    start_time: float
    end_time: float
    memory_usage_mb: float
    repositories_processed: int
    total_commits: int
    total_files: int
    total_authors: int
    errors_encountered: int

    @property
    def duration_seconds(self) -> float:
        """Get analysis duration in seconds."""
        return self.end_time - self.start_time

    @property
    def commits_per_second(self) -> float:
        """Get commits processed per second."""
        return safe_divide(self.total_commits, self.duration_seconds, 0.0)


class SettingsTranslator:
    """Translates GUI Settings to legacy Args format.

    This class handles the conversion between the enhanced Settings dataclass
    and the legacy Args format expected by the sophisticated analysis engine.
    """

    @staticmethod
    def translate_to_legacy_args(settings: Settings) -> IniRepo:
        """Convert GUI Settings to legacy IniRepo format.

        Maps all enhanced settings to their legacy equivalents while preserving
        advanced configuration options and ensuring compatibility.

        Args:
            settings: Enhanced GUI settings object

        Returns:
            IniRepo object configured for legacy analysis engine

        Raises:
            ValueError: If settings validation fails
            TypeError: If settings contain invalid types

        """
        try:
            # Validate input settings
            if not settings.input_fstrs:
                msg = "No input repositories specified"
                raise ValueError(msg)

            # Create legacy Args-compatible dictionary
            legacy_args = {
                # Repository and Input Settings
                "input_fstrs": settings.input_fstrs,
                "depth": settings.depth,
                "subfolder": settings.subfolder,
                # File Analysis Settings
                "n_files": settings.n_files,
                "include_files": settings.include_files or [],
                "ex_files": settings.ex_files or [],
                "extensions": settings.extensions or [],
                # Author and Commit Filtering
                "ex_authors": settings.ex_authors or [],
                "ex_emails": settings.ex_emails or [],
                "ex_revisions": settings.ex_revisions or [],
                "ex_messages": settings.ex_messages or [],
                "since": settings.since,
                "until": settings.until,
                # Advanced Pattern-based Filtering
                "ex_author_patterns": settings.ex_author_patterns or [],
                "ex_email_patterns": settings.ex_email_patterns or [],
                "ex_message_patterns": settings.ex_message_patterns or [],
                "ex_file_patterns": settings.ex_file_patterns or [],
                # Output and Format Settings
                "outfile_base": settings.outfile_base,
                "fix": settings.fix,
                "file_formats": settings.file_formats or ["html"],
                "view": settings.view,
                # Analysis Options
                "copy_move": settings.copy_move,
                "scaled_percentages": settings.scaled_percentages,
                "blame_exclusions": settings.blame_exclusions,
                "blame_skip": settings.blame_skip,
                "show_renames": settings.show_renames,
                # Content Analysis
                "deletions": settings.deletions,
                "whitespace": settings.whitespace,
                "empty_lines": settings.empty_lines,
                "comments": settings.comments,
                # Performance Settings
                "multithread": settings.multithread,
                "multicore": settings.multicore,
                "verbosity": settings.verbosity,
                "max_thread_workers": settings.max_thread_workers,
                "git_log_chunk_size": settings.git_log_chunk_size,
                "blame_chunk_size": settings.blame_chunk_size,
                "max_core_workers": settings.max_core_workers,
                # Memory Management
                "memory_limit_mb": settings.memory_limit_mb,
                "enable_gc_optimization": settings.enable_gc_optimization,
                "max_file_size_kb": settings.max_file_size_kb,
                # Repository Analysis Controls
                "max_commit_count": settings.max_commit_count,
                "follow_renames": settings.follow_renames,
                "ignore_merge_commits": settings.ignore_merge_commits,
                # Ignore-revs File Support
                "ignore_revs_file": settings.ignore_revs_file,
                "enable_ignore_revs": settings.enable_ignore_revs,
                # Blame Analysis Configuration
                "blame_follow_moves": settings.blame_follow_moves,
                "blame_ignore_whitespace": settings.blame_ignore_whitespace,
                "blame_minimal_context": settings.blame_minimal_context,
                "blame_show_email": settings.blame_show_email,
                # Output Format Options
                "output_encoding": settings.output_encoding,
                "date_format": settings.date_format,
                "author_display_format": settings.author_display_format,
                "line_number_format": settings.line_number_format,
                # Excel-specific Options
                "excel_max_rows": settings.excel_max_rows,
                "excel_abbreviate_names": settings.excel_abbreviate_names,
                "excel_freeze_panes": settings.excel_freeze_panes,
                # HTML-specific Options
                "html_theme": settings.html_theme,
                "html_enable_search": settings.html_enable_search,
                "html_max_entries_per_page": settings.html_max_entries_per_page,
                # Web Server Options
                "server_port": settings.server_port,
                "server_host": settings.server_host,
                "max_browser_tabs": settings.max_browser_tabs,
                "auto_open_browser": settings.auto_open_browser,
                # Development/Testing
                "dryrun": settings.dryrun,
                "profile": settings.profile,
                # Debug and Logging
                "debug_show_main_event_loop": settings.debug_show_main_event_loop,
                "debug_multiprocessing": settings.debug_multiprocessing,
                "debug_git_commands": settings.debug_git_commands,
                "log_git_output": settings.log_git_output,
                # GUI-specific
                "gui_settings_full_path": settings.gui_settings_full_path,
                "col_percent": settings.col_percent,
                # Legacy Compatibility
                "legacy_mode": settings.legacy_mode,
                "preserve_legacy_output_format": settings.preserve_legacy_output_format,
            }

            # Create a simple args object from the dictionary
            class Args:
                def __init__(self, **kwargs) -> None:
                    for key, value in kwargs.items():
                        setattr(self, key, value)

            args_obj = Args(**legacy_args)

            # Create IniRepo with the first repository path
            primary_repo_path = settings.input_fstrs[0]
            repo_path = Path(primary_repo_path)
            ini_repo = IniRepo(name=repo_path.name, location=repo_path, args=args_obj)

            logger.info(f"Translated settings for repository: {primary_repo_path}")
            logger.debug(f"Legacy args created with {len(legacy_args)} parameters")

            return ini_repo

        except Exception as e:
            logger.exception(f"Settings translation failed: {e}")
            msg = f"Failed to translate settings to legacy format: {e}"
            raise ValueError(
                msg
            ) from e


class ResultConverter:
    """Converts legacy RepoData results to GUI AnalysisResult format.

    This class handles the conversion from the sophisticated legacy analysis
    results to the format expected by the current GUI frontend.
    """

    @staticmethod
    def convert_repo_data_to_analysis_result(
        repo_data_list: list[RepoData],
        settings: Settings,
        performance_metrics: PerformanceMetrics,
    ) -> AnalysisResult:
        """Convert legacy RepoData objects to GUI AnalysisResult format.

        Transforms the sophisticated legacy analysis results into the format
        expected by the current frontend while preserving all statistical data.

        Args:
            repo_data_list: List of RepoData objects from legacy analysis
            settings: Original settings used for analysis
            performance_metrics: Performance metrics from analysis

        Returns:
            AnalysisResult object compatible with current GUI

        Raises:
            ValueError: If conversion fails due to invalid data

        """
        try:
            repositories = []

            for repo_data in repo_data_list:
                # Convert authors from legacy format
                authors = ResultConverter._convert_authors(repo_data)

                # Convert files from legacy format
                files = ResultConverter._convert_files(repo_data)

                # Convert blame data from legacy format
                blame_data = ResultConverter._convert_blame_data(repo_data)

                # Create repository result
                repo_result = RepositoryResult(
                    name=repo_data.path.name,
                    path=str(repo_data.path),
                    authors=authors,
                    files=files,
                    blame_data=blame_data,
                )

                repositories.append(repo_result)

                logger.info(f"Converted repository: {repo_data.path.name}")
                logger.debug(
                    f"  Authors: {len(authors)}, Files: {len(files)}, Blame entries: {len(blame_data)}"
                )

            return AnalysisResult(repositories=repositories, success=True, error=None)

        except Exception as e:
            logger.exception(f"Result conversion failed: {e}")
            return AnalysisResult(
                repositories=[],
                success=False,
                error=f"Failed to convert legacy results: {e}",
            )

    @staticmethod
    def _convert_authors(repo_data: RepoData) -> list[AuthorStat]:
        """Convert legacy author statistics to GUI format."""
        authors = []

        try:
            # Get author statistics from legacy data
            for author, pstat in repo_data.author2pstat.items():
                if author == "*":  # Skip totals row
                    continue

                # Extract person information
                person = pstat.person
                stat = pstat.stat

                # Get primary email
                primary_email = (
                    next(iter(person.emails)) if person.emails else "unknown@example.com"
                )

                # Get file count for this author from author2fstr2fstat
                file_count = 0
                if author in repo_data.author2fstr2fstat:
                    # Count files (excluding "*" totals)
                    file_count = len(
                        [
                            f
                            for f in repo_data.author2fstr2fstat[author]
                            if f != "*"
                        ]
                    )

                # Create AuthorStat
                author_stat = AuthorStat(
                    name=person.author,
                    email=primary_email,
                    commits=len(stat.shas),
                    insertions=stat.insertions,
                    deletions=stat.deletions,
                    files=file_count,
                    percentage=round(stat.percent_insertions, 1),
                    age=stat.age,
                )

                authors.append(author_stat)

            # Sort by insertions (descending)
            authors.sort(key=lambda a: a.insertions, reverse=True)

            logger.debug(f"Converted {len(authors)} authors from legacy format")

        except Exception as e:
            logger.warning(f"Author conversion failed: {e}")
            # Return empty list on error
            authors = []

        return authors

    @staticmethod
    def _convert_files(repo_data: RepoData) -> list[FileStat]:
        """Convert legacy file statistics to GUI format."""
        files = []

        try:
            # Get file statistics from legacy data
            for fstr, fstat in repo_data.fstr2fstat.items():
                if fstr == "*":  # Skip totals row
                    continue

                # Calculate file metrics
                file_path = Path(fstr)

                file_stat = FileStat(
                    name=file_path.name,
                    path=str(fstr),
                    lines=fstat.stat.blame_line_count,
                    commits=len(fstat.stat.shas),
                    authors=len(repo_data.fstr2author2fstat.get(fstr, {})),
                    percentage=round(fstat.stat.percent_lines, 1),
                )

                files.append(file_stat)

            # Sort by lines (descending)
            files.sort(key=lambda f: f.lines, reverse=True)

            logger.debug(f"Converted {len(files)} files from legacy format")

        except Exception as e:
            logger.warning(f"File conversion failed: {e}")
            # Return empty list on error
            files = []

        return files

    @staticmethod
    def _convert_blame_data(repo_data: RepoData) -> list[BlameEntry]:
        """Convert legacy blame data to GUI format."""
        blame_data = []

        try:
            # Use real blame data from fstr2blames
            for fstr, blames in repo_data.fstr2blames.items():
                if fstr == "*":  # Skip totals row
                    continue

                # Convert each blame entry to GUI format
                for blame in blames:
                    for line_data in blame.line_datas:
                        blame_entry = BlameEntry(
                            file=str(fstr),
                            line_number=line_data.line_nr,
                            author=blame.author,
                            commit=blame.sha,  # Use real commit SHA
                            date=blame.date.strftime(
                                "%Y-%m-%d"
                            ),  # Use real commit date
                            content=line_data.line.strip(),  # Use real line content
                        )

                        blame_data.append(blame_entry)

            logger.debug(
                f"Converted {len(blame_data)} real blame entries from legacy format"
            )

        except Exception as e:
            logger.warning(f"Blame data conversion failed: {e}")
            # Return empty list on error
            blame_data = []

        return blame_data


class PerformanceMonitor:
    """Monitors analysis performance and resource usage.

    Tracks memory usage, processing time, and other performance metrics
    during legacy analysis engine execution.
    """

    def __init__(self) -> None:
        """Initialize performance monitoring."""
        self.start_time = 0.0
        self.end_time = 0.0
        self.initial_memory = 0.0
        self.peak_memory = 0.0

    def start_monitoring(self) -> None:
        """Start performance monitoring."""
        self.start_time = time.time()
        self.initial_memory = self._get_memory_usage()
        self.peak_memory = self.initial_memory
        logger.info("Performance monitoring started")

    def update_peak_memory(self) -> None:
        """Update peak memory usage."""
        current_memory = self._get_memory_usage()
        self.peak_memory = max(self.peak_memory, current_memory)

    def stop_monitoring(
        self,
        repositories_processed: int,
        total_commits: int,
        total_files: int,
        total_authors: int,
        errors: int,
    ) -> PerformanceMetrics:
        """Stop monitoring and return metrics."""
        self.end_time = time.time()
        self.update_peak_memory()

        metrics = PerformanceMetrics(
            start_time=self.start_time,
            end_time=self.end_time,
            memory_usage_mb=self.peak_memory,
            repositories_processed=repositories_processed,
            total_commits=total_commits,
            total_files=total_files,
            total_authors=total_authors,
            errors_encountered=errors,
        )

        logger.info(
            f"Performance monitoring completed: {metrics.duration_seconds:.2f}s, "
            f"{metrics.commits_per_second:.1f} commits/sec, "
            f"{format_bytes(int(metrics.memory_usage_mb * 1024 * 1024))} peak memory"
        )

        return metrics

    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024  # Convert to MB


class LegacyEngineWrapper:
    """Main bridge between current API and legacy analysis engine.

    This class orchestrates the complete integration workflow, handling
    settings translation, analysis execution, result conversion, and
    error management while maintaining backward compatibility.
    """

    def __init__(self) -> None:
        """Initialize the legacy engine wrapper."""
        self.settings_translator = SettingsTranslator()
        self.result_converter = ResultConverter()
        self.performance_monitor = PerformanceMonitor()

        logger.info("Legacy Engine Wrapper initialized")

    def execute_analysis(self, settings: Settings) -> AnalysisResult:
        """Execute repository analysis using the sophisticated legacy engine.

        This is the main entry point that coordinates the complete analysis
        workflow using all migrated legacy components.

        Args:
            settings: Enhanced GUI settings object

        Returns:
            AnalysisResult compatible with current GUI frontend

        """
        logger.info("Starting legacy engine analysis")
        self.performance_monitor.start_monitoring()

        with profiler.step("legacy_engine_total"):
            try:
                # Validate input settings
                if not settings.input_fstrs:
                    return AnalysisResult(
                        repositories=[],
                        success=False,
                        error="No input repositories specified",
                    )

                # Validate repository paths
                invalid_paths = []
                for repo_path in settings.input_fstrs:
                    is_valid, error_msg = validate_file_path(repo_path)
                    if not is_valid:
                        invalid_paths.append(f"{repo_path}: {error_msg}")

                if invalid_paths:
                    return AnalysisResult(
                        repositories=[],
                        success=False,
                        error=f"Invalid repository paths: {'; '.join(invalid_paths)}",
                    )

                # Process each repository
                repo_data_list = []
                total_commits = 0
                total_files = 0
                total_authors = 0
                errors = 0

                for repo_path in settings.input_fstrs:
                    try:
                        with profiler.step(f"repository_{Path(repo_path).name}"):
                            logger.info(f"Processing repository: {repo_path}")

                            # Translate settings to legacy format for current repository
                            with profiler.step("settings_translation"):
                                current_settings = Settings(**settings.__dict__)
                                current_settings.input_fstrs = [repo_path]
                                ini_repo = (
                                    self.settings_translator.translate_to_legacy_args(
                                        current_settings
                                    )
                                )

                            # Create and execute legacy analysis - THIS IS THE CRITICAL STEP
                            with profiler.step("repo_data_creation"):
                                logger.info(
                                    f"Creating RepoData for {repo_path} - this may take time..."
                                )
                                repo_data = RepoData(ini_repo)
                                logger.info(
                                    f"RepoData creation completed for {repo_path}"
                                )

                        # Update performance monitoring
                        self.performance_monitor.update_peak_memory()

                        # Collect statistics
                        repo_commits = sum(
                            len(stat.stat.shas)
                            for stat in repo_data.author2pstat.values()
                            if stat.person.author != "*"
                        )
                        repo_files = len(
                            [f for f in repo_data.fstr2fstat if f != "*"]
                        )
                        repo_authors = len(
                            [a for a in repo_data.author2pstat if a != "*"]
                        )

                        total_commits += repo_commits
                        total_files += repo_files
                        total_authors += repo_authors

                        repo_data_list.append(repo_data)

                        logger.info(
                            f"Repository processed: {repo_commits} commits, {repo_files} files, {repo_authors} authors"
                        )

                    except Exception as e:
                        logger.exception(f"Failed to process repository {repo_path}: {e}")
                        errors += 1

                        # Continue with other repositories on error
                        continue

                # Stop performance monitoring
                performance_metrics = self.performance_monitor.stop_monitoring(
                    repositories_processed=len(repo_data_list),
                    total_commits=total_commits,
                    total_files=total_files,
                    total_authors=total_authors,
                    errors=errors,
                )

                # Log performance summary
                profiler.log_summary()

                # Convert results to GUI format
                if repo_data_list:
                    result = self.result_converter.convert_repo_data_to_analysis_result(
                        repo_data_list, settings, performance_metrics
                    )

                    logger.info(
                        f"Legacy engine analysis completed successfully: "
                        f"{len(repo_data_list)} repositories, "
                        f"{total_commits} commits, "
                        f"{performance_metrics.duration_seconds:.2f}s"
                    )

                    return result
                return AnalysisResult(
                    repositories=[],
                    success=False,
                    error=f"No repositories could be processed. {errors} errors encountered.",
                )

            except Exception as e:
                logger.exception(f"Legacy engine analysis failed: {e}")

                # Stop monitoring on error
                with contextlib.suppress(Exception):
                    self.performance_monitor.stop_monitoring(0, 0, 0, 0, 1)

                # Log performance summary even on error
                profiler.log_summary()

                return AnalysisResult(
                    repositories=[],
                    success=False,
                    error=f"Legacy engine analysis failed: {e}",
                )

    def validate_settings(self, settings: Settings) -> tuple[bool, str]:
        """Validate settings for legacy engine compatibility.

        Args:
            settings: Settings to validate

        Returns:
            Tuple of (is_valid, error_message)

        """
        try:
            # Basic validation
            if not settings.input_fstrs:
                return False, "No input repositories specified"

            # Validate repository paths
            for repo_path in settings.input_fstrs:
                is_valid, error_msg = validate_file_path(repo_path)
                if not is_valid:
                    return False, f"Invalid repository path {repo_path}: {error_msg}"

            # Validate performance settings
            if settings.max_thread_workers < 1:
                return False, "max_thread_workers must be at least 1"

            if settings.memory_limit_mb < 64:
                return False, "memory_limit_mb must be at least 64 MB"

            # Test settings translation
            try:
                self.settings_translator.translate_to_legacy_args(settings)
            except Exception as e:
                return False, f"Settings translation failed: {e}"

            return True, ""

        except Exception as e:
            return False, f"Settings validation failed: {e}"

    def get_engine_info(self) -> dict[str, Any]:
        """Get information about the legacy engine capabilities.

        Returns:
            Dictionary with engine information and capabilities

        """
        return {
            "engine_name": "GitInspectorGUI Legacy Analysis Engine",
            "version": "4.0.0",
            "capabilities": [
                "Advanced person identity merging",
                "Sophisticated statistics calculation",
                "Comprehensive blame analysis",
                "Performance-optimized git operations",
                "Pattern-based filtering",
                "Memory management",
                "Multi-threading support",
                "Cross-platform compatibility",
            ],
            "supported_formats": ["html", "excel"],
            "supported_repositories": ["git"],
            "performance_features": [
                "Configurable threading",
                "Memory limits",
                "Chunked processing",
                "Garbage collection optimization",
            ],
            "filtering_features": [
                "Author patterns (glob/regex)",
                "Email patterns (glob/regex)",
                "Message patterns (glob/regex)",
                "File patterns (glob/regex)",
                "Ignore-revs file support",
                "Date range filtering",
            ],
        }


# Global instance for use by the API
legacy_engine = LegacyEngineWrapper()
