"""Git Operations Layer for GitInspectorGUI.

This module provides the core git repository operations layer with optimized
command execution, error handling, validation, and performance monitoring.
It serves as the foundation for all git repository analysis operations.

Migrated from gitinspectorgui-old/src/gigui/repo_base.py with enhanced
type safety and compatibility with the new architecture.

Key Features:
- Optimized git command execution with error handling
- Repository validation and initialization
- Performance monitoring and logging
- Git repository management and operations
- Base classes for repository operations
- Path handling and validation utilities
- Advanced commit processing and analysis
- File rename tracking and history management
"""

import copy
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime
from fnmatch import fnmatchcase
from logging import getLogger
from pathlib import Path
from typing import Any

from git import Commit as GitCommit
from git import Repo as GitRepo

from gigui.core.person_manager import PersonsDB
from gigui.core.statistics import CommitGroup, FileStat, IniRepo
from gigui.typedefs import (
    OID,
    SHA,
    CommitGroupsDict,
    FileStr,
    LineCountDict,
    Rev,
    SHAToAuthorDict,
    UnixTimestamp,
)

logger = getLogger(__name__)

# Constants for git operations
GIT_LOG_CHUNK_SIZE = 100  # Chunk size for git log operations
MAX_THREAD_WORKERS = 6  # Maximum number of thread workers
BLAME_CHUNK_SIZE = 20  # Chunk size for blame operations

# Time constants
SECONDS_IN_DAY = 60 * 60 * 24
DAYS_IN_MONTH = 30.44
DAYS_IN_YEAR = 365.25

# Default file extensions for analysis
DEFAULT_EXTENSIONS = [
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


@dataclass
class SHADateNr:
    """SHA with date and number for commit ordering.

    Used to order and number commits by date, starting at 1 for the
    initial commit. Provides efficient sorting and lookup capabilities.
    """

    sha: SHA
    date: UnixTimestamp
    nr: int


@dataclass
class Args:
    """Command-line arguments and configuration options.

    Simplified Args class for repository operations. Contains the essential
    configuration needed for git analysis operations.
    """

    # Core settings
    verbosity: int = 0
    multithread: bool = True
    multicore: bool = False

    # File filtering
    extensions: list[str] = None
    ex_files: list[str] = None
    include_files: list[str] = None
    n_files: int = 5
    subfolder: str = ""

    # Date filtering
    since: str = ""
    until: str = ""

    # Exclusions
    ex_revisions: list[str] = None
    ex_messages: list[str] = None
    ex_authors: list[str] = None
    ex_emails: list[str] = None

    # Processing options
    whitespace: bool = False
    view: str = "auto"

    # Blame-specific options
    copy_move: int = 0
    comments: bool = False
    empty_lines: bool = False

    def __post_init__(self):
        """Initialize default values for list fields."""
        if self.extensions is None:
            self.extensions = DEFAULT_EXTENSIONS.copy()
        if self.ex_files is None:
            self.ex_files = []
        if self.include_files is None:
            self.include_files = []
        if self.ex_revisions is None:
            self.ex_revisions = []
        if self.ex_messages is None:
            self.ex_messages = []
        if self.ex_authors is None:
            self.ex_authors = []
        if self.ex_emails is None:
            self.ex_emails = []


class Keys:
    """Key constants for view types and operations."""

    dynamic_blame_history = "dynamic-blame-history"


class RepoBase:
    """Base repository class providing git operations and analysis foundation.

    This class represents a git repository and provides comprehensive functionality
    to interact with and analyze git repositories. It includes optimized git command
    execution, error handling, validation, and performance monitoring.

    Key Features:
    - Git repository initialization and management
    - Optimized commit processing with threading support
    - File filtering and exclusion handling
    - Rename tracking and file history management
    - Performance monitoring and logging
    - Error handling and validation

    Attributes:
        name: Repository name
        location: File system path to repository
        args: Configuration arguments
        persons_db: Database of persons/authors
        git_repo: GitPython repository object

        # File management
        _fstrs: Private list of file strings (fallback)
        fstr2fstat: Mapping of files to their statistics
        fstr2line_count: Mapping of files to line counts
        fstr2commit_groups: Mapping of files to commit groups

        # Exclusions
        ex_revisions: Set of excluded revision patterns
        ex_shas: Set of excluded commit SHAs

        # Commit data
        sha_since_until_date_nrs: List of commits in date range
        sha_since_until_nrs: List of commit numbers in date range
        sha2author: Mapping of SHAs to authors
        sha2oid: Mapping of short SHAs to long SHAs
        oid2sha: Mapping of long SHAs to short SHAs
        sha2nr: Mapping of SHAs to commit numbers
        nr2sha: Mapping of commit numbers to SHAs

        # File rename tracking
        fr2sha2f: File rename history by SHA
        fr2sha_nr2f: File rename history by commit number
        fr2sha_nrs: Sorted commit numbers for file renames

        # Head commit information
        head_commit: Top-level git commit object
        head_oid: Top-level commit OID (long SHA)
        head_sha: Top-level commit SHA (short)

    """

    def __init__(self, ini_repo: IniRepo) -> None:
        """Initialize repository base with configuration.

        Args:
            ini_repo: Initial repository configuration

        """
        self.name: str = ini_repo.name
        self.location: Path = Path(ini_repo.location)
        self.args: Args = ini_repo.args if ini_repo.args else Args()
        self.persons_db: PersonsDB = PersonsDB()
        self.git_repo: GitRepo | None = None

        # File management
        self._fstrs: list[FileStr] = []
        self.fstr2fstat: dict[FileStr, FileStat] = {}
        self.fstr2line_count: LineCountDict = {}
        self.fstr2commit_groups: CommitGroupsDict = {}

        # Exclusions
        self.ex_revisions: set[Rev] = set(self.args.ex_revisions)
        self.ex_shas: set[SHA] = set()

        # Commit data
        self.sha_since_until_date_nrs: list[SHADateNr] = []
        self.sha_since_until_nrs: list[int] = []
        self.sha2author: SHAToAuthorDict = {}

        # SHA mappings (set in init_git_repo)
        self.sha2oid: dict[SHA, OID] = {}
        self.oid2sha: dict[OID, SHA] = {}
        self.sha2nr: dict[SHA, int] = {}
        self.nr2sha: dict[int, SHA] = {}

        # File rename tracking
        self.fr2sha2f: dict[FileStr, dict[SHA, FileStr]] = {}
        self.fr2sha_nr2f: dict[FileStr, dict[int, FileStr]] = {}
        self.fr2sha_nrs: dict[FileStr, list[int]] = {}

        # Head commit information (set in init_git_repo)
        self.head_commit: GitCommit | None = None
        self.head_oid: OID | None = None
        self.head_sha: SHA | None = None

    @property
    def fstrs(self) -> list[FileStr]:
        """Get filtered and sorted list of file strings.

        Returns the private _fstrs list before analysis, or a sorted list
        based on blame line count after analysis and blame run.

        Returns:
            List of file strings, sorted by relevance

        """
        if not self.fstr2fstat:  # analysis and blame run not yet executed
            return list(self._fstrs)
        # after analysis and blame run
        # fstr2fstat.keys() can be a subset of self._fstrs due to exclusions
        fstrs = [fstr for fstr in self.fstr2fstat if fstr != "*"]
        return sorted(
            fstrs,
            key=lambda x: self.fstr2fstat[x].stat.blame_line_count,
            reverse=True,
        )

    @property
    def star_fstrs(self) -> list[FileStr]:
        """Get file strings list with '*' (all files) as first element."""
        return ["*", *self.fstrs]

    def init_git_repo(self) -> None:
        """Initialize the git repository and build SHA mappings.

        This function initializes the GitPython repository object and builds
        comprehensive mappings between long SHAs, short SHAs, and commit numbers.
        It also determines the head commit based on the until parameter.

        Raises:
            Exception: If repository initialization fails

        """
        try:
            # Initialize git repository
            self.git_repo = GitRepo(self.location)

            # Build SHA mappings using git log
            self._build_sha_mappings()

            # Set head commit based on until parameter
            self._set_head_commit()

            logger.info(f"Initialized git repository: {self.name}")

        except Exception as e:
            logger.exception(f"Failed to initialize git repository {self.name}: {e}")
            raise

    def _build_sha_mappings(self) -> None:
        """Build mappings between long SHAs, short SHAs, and commit numbers."""
        if not self.git_repo:
            msg = "Git repository not initialized"
            raise RuntimeError(msg)

        # Use git log to get both long and short SHAs
        log_output = self.git_repo.git.log("--pretty=format:%H %h")
        lines = log_output.splitlines()

        # Set commit numbers (first line = highest number, initial commit = 1)
        nr = len(lines)
        for line in lines:
            if not line.strip():
                continue
            parts = line.split()
            if len(parts) >= 2:
                oid, sha = parts[0], parts[1]
                self.sha2oid[sha] = oid
                self.oid2sha[oid] = sha
                self.sha2nr[sha] = nr
                self.nr2sha[nr] = sha
                nr -= 1

    def _set_head_commit(self) -> None:
        """Set head commit based on until parameter."""
        if not self.git_repo:
            msg = "Git repository not initialized"
            raise RuntimeError(msg)

        # Set head_commit to the top-level commit at the date given by args.until
        if self.args.until:
            commits = list(self.git_repo.iter_commits(until=self.args.until))
            if commits:
                self.head_commit = commits[0]
            else:
                self.head_commit = self.git_repo.head.commit
        else:
            self.head_commit = self.git_repo.head.commit

        self.head_oid = self.head_commit.hexsha
        self.head_sha = self.oid2sha[self.head_oid]

    def run_base(self) -> None:
        """Execute base repository analysis operations.

        This method performs the core analysis steps:
        1. Get worktree files based on filters
        2. Set file line counts
        3. Process commits (first pass)
        4. Set file-to-commits mapping
        5. Build file rename tracking data
        """
        logger.info(f"Starting base analysis for repository: {self.name}")

        # Set list of top level files (based on until param and allowed extensions)
        self._fstrs = self._get_worktree_files()
        logger.info(f"Found {len(self._fstrs)} files for analysis")

        # Set line counts for files
        self._set_fdata_line_count()

        # Process commits (first pass)
        self._get_commits_first_pass()

        # Set file-to-commits mapping
        self._set_fstr2commits()

        # Build file rename tracking
        self._set_fr2sha2f()
        self._set_fr2sha_nr2f()
        self._set_fr2sha_nrs()

        logger.info(f"Completed base analysis for repository: {self.name}")

    def _convert_to_timestamp(self, date_str: str) -> UnixTimestamp:
        """Convert date string to Unix timestamp.

        Args:
            date_str: Date string in format "YYYY-MM-DD HH:MM:SS"

        Returns:
            Unix timestamp in seconds

        """
        dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        return int(dt.timestamp())

    def _get_worktree_files(self) -> list[FileStr]:
        """Get list of files for analysis based on filters and configuration.

        Returns files that:
        - Satisfy the required extensions
        - Do not match exclude file patterns
        - Are in the specified subfolder
        - Match include file patterns (if specified)

        Returns:
            List of file strings for analysis

        """
        sorted_files: list[FileStr] = self._get_sorted_worktree_files()
        files_set: set[FileStr] = set(sorted_files)

        # Create file-to-sort-number mapping
        file2nr: dict[FileStr, int] = {}
        for nr, file in enumerate(sorted_files):
            file2nr[file] = nr

        # Handle include_files pattern matching
        if not self.args.include_files and self.args.n_files != 0:
            return sorted_files[: self.args.n_files]
        # Filter files matching include patterns
        include_file_paths: list[Path] = [
            Path(self.args.subfolder) / fstr for fstr in self.args.include_files
        ]
        include_files: list[FileStr] = [str(path) for path in include_file_paths]

        if not self.head_commit:
            return []

        matches = [
            blob.path  # type: ignore
            for blob in self.head_commit.tree.traverse()
            if (
                blob.type == "blob"  # type: ignore
                and any(
                    fnmatchcase(blob.path.lower(), pattern.lower())  # type: ignore
                    for pattern in include_files
                )
                and blob.path in files_set  # type: ignore
            )
        ]
        files = sorted(matches, key=lambda match: file2nr.get(match, 0))

        if self.args.n_files == 0:
            return files
        return files[: self.args.n_files]

    def _get_sorted_worktree_files(self) -> list[FileStr]:
        """Get files in worktree, reverse sorted by file size.

        Returns files that:
        - Match required file extensions
        - Are not excluded by patterns
        - Are in the specified subfolder

        Returns:
            List of file strings sorted by size (largest first)

        """

        def _get_worktree_files_sizes() -> list[tuple[FileStr, int]]:
            """Get files with their sizes from the worktree."""

            def _get_subfolder_blobs() -> list:
                """Get blobs that are in the specified subfolder."""
                if not self.head_commit:
                    return []

                return [
                    blob
                    for blob in self.head_commit.tree.traverse()
                    if (
                        (blob.type == "blob")  # type: ignore
                        and fnmatchcase(
                            blob.path.lower(),  # type: ignore
                            f"{self.args.subfolder}*".lower(),
                        )
                    )
                ]

            blobs: list = _get_subfolder_blobs()
            if not blobs:
                logger.warning(f"No files found in subfolder {self.args.subfolder}")
                return []

            return [
                (blob.path, blob.size)  # type: ignore
                for blob in blobs
                if (
                    # Include files with correct extensions and not excluded
                    (
                        "*" in self.args.extensions
                        or (blob.path.split(".")[-1] in self.args.extensions)
                    )
                    and not self._matches_ex_file(blob.path)
                )
            ]

        sorted_files_sizes = sorted(
            _get_worktree_files_sizes(), key=lambda x: x[1], reverse=True
        )
        return [file_size[0] for file_size in sorted_files_sizes]

    def _matches_ex_file(self, fstr: FileStr) -> bool:
        """Check if file should be excluded based on exclusion patterns.

        Args:
            fstr: File string to check

        Returns:
            True if file should be excluded

        """
        return any(
            fnmatchcase(fstr.lower(), pattern.lower()) for pattern in self.args.ex_files
        )

    def _set_fdata_line_count(self) -> None:
        """Set line counts for all files in the analysis."""
        self.fstr2line_count["*"] = 0

        if not self.head_commit:
            return

        for blob in self.head_commit.tree.traverse():
            if (
                blob.type == "blob"  # type: ignore
                and blob.path in self.fstrs  # type: ignore
                and blob.path not in self.fstr2line_count  # type: ignore
            ):
                try:
                    # Count lines in blob
                    content = blob.data_stream.read().decode("utf-8")  # type: ignore
                    line_count: int = len(content.split("\n"))
                    self.fstr2line_count[blob.path] = line_count  # type: ignore
                    self.fstr2line_count["*"] += line_count
                except (UnicodeDecodeError, Exception) as e:
                    logger.warning(f"Could not read file {blob.path}: {e}")  # type: ignore
                    self.fstr2line_count[blob.path] = 0  # type: ignore

    def _get_commits_first_pass(self) -> None:
        """Process commits in the specified date range (first pass).

        This method:
        1. Retrieves commit information using git log
        2. Filters out excluded commits
        3. Builds author database
        4. Creates SHA-date-number mappings
        """
        sha_date_nrs: list[SHADateNr] = []
        ex_shas: set[SHA] = set()

        # Build git log arguments
        args = self._get_since_until_args()
        if self.head_oid:
            args += [
                f"{self.head_oid}",
                "--pretty=format:%h%n%ct%n%s%n%aN%n%aE%n",
            ]
        else:
            logger.error("Head OID not set")
            return

        if not self.git_repo:
            logger.error("Git repository not initialized")
            return

        try:
            lines_str: str = self.git_repo.git.log(*args)
        except Exception as e:
            logger.exception(f"Git log command failed: {e}")
            return

        lines = lines_str.splitlines()
        i: int = 0

        while i < len(lines) - 4:
            line = lines[i]
            if not line:
                i += 1
                continue

            sha = line
            oid = self.sha2oid.get(sha)
            if not oid:
                i += 5
                continue

            # Check for excluded revisions
            if any(oid.startswith(rev) for rev in self.ex_revisions):
                ex_shas.add(sha)
                i += 5
                continue

            timestamp = int(lines[i + 1])
            message = lines[i + 2]

            # Check for excluded messages
            if any(
                fnmatchcase(message.lower(), pattern.lower())
                for pattern in self.args.ex_messages
            ):
                ex_shas.add(sha)
                i += 5
                continue

            author = lines[i + 3]
            email = lines[i + 4]

            # Add person to database
            self.persons_db.add_person(author, email)
            self.sha2author[sha] = author

            # Create SHA-date-number entry
            sha_date_nr = SHADateNr(sha, timestamp, self.sha2nr.get(sha, 0))
            sha_date_nrs.append(sha_date_nr)

            i += 5

        # Sort by date and store results
        sha_date_nrs.sort(key=lambda x: x.date)
        self.sha_since_until_date_nrs = sha_date_nrs
        self.sha_since_until_nrs = [sha_date_nr.nr for sha_date_nr in sha_date_nrs]
        self.ex_shas = ex_shas

    def _get_since_until_args(self) -> list[str]:
        """Get git log arguments for date filtering.

        Returns:
            List of git log arguments for since/until dates

        """
        since = self.args.since
        until = self.args.until

        if since and until:
            return [f"--since={since}", f"--until={until}"]
        if since:
            return [f"--since={since}"]
        if until:
            return [f"--until={until}"]
        return []

    def _set_fstr2commits(self) -> None:
        """Set file-to-commits mapping with threading support.

        This method processes git log for each file to build commit groups.
        It supports both single-threaded and multi-threaded execution.
        """

        def reduce_commits() -> None:
            """Remove duplicate commits from the end of commit lists."""
            fstrs = copy.deepcopy(self.fstrs)
            fstrs.sort(key=lambda x: len(self.fstr2commit_groups.get(x, [])))

            while fstrs:
                fstr1 = fstrs.pop()
                commit_groups1 = self.fstr2commit_groups.get(fstr1, [])
                if not commit_groups1:
                    continue

                for fstr2 in fstrs:
                    commit_groups2 = self.fstr2commit_groups.get(fstr2, [])
                    i = -1
                    while (
                        commit_groups2
                        and abs(i) <= len(commit_groups1)
                        and commit_groups1[i] == commit_groups2[-1]
                    ):
                        commit_groups2.pop()
                        i -= 1

        i_max: int = len(self.fstrs)
        i: int = 0
        chunk_size: int = GIT_LOG_CHUNK_SIZE
        prefix: str = " " * 8

        logger.info(f"{prefix}Git log: {self.name}: {i_max} files")

        if self.args.multithread:
            self.log_space(8)
            with ThreadPoolExecutor(max_workers=MAX_THREAD_WORKERS) as thread_executor:
                for chunk_start in range(0, i_max, chunk_size):
                    chunk_end = min(chunk_start + chunk_size, i_max)
                    chunk_fstrs = self.fstrs[chunk_start:chunk_end]

                    futures = [
                        thread_executor.submit(self._get_commit_lines_for, fstr)
                        for fstr in chunk_fstrs
                    ]

                    for future in as_completed(futures):
                        try:
                            lines_str, fstr = future.result()
                            i += 1

                            if self.args.verbosity == 0:
                                self.log_dot()
                            else:
                                logger.info(
                                    f"{prefix}log {i} of {i_max}: {self.name}: {fstr}"
                                    if self.args.multicore
                                    else f"{fstr}"
                                )

                            self.fstr2commit_groups[fstr] = (
                                self._process_commit_lines_for(lines_str, fstr)
                            )
                        except Exception as e:
                            logger.exception(f"Error processing file {fstr}: {e}")
        else:
            # Single-threaded processing
            self.log_space(8)
            for fstr in self.fstrs:
                try:
                    lines_str, fstr = self._get_commit_lines_for(fstr)
                    i += 1

                    if self.args.verbosity == 0 and not self.args.multicore:
                        self.log_dot()
                    else:
                        logger.info(f"{prefix}{i} of {i_max}: {self.name} {fstr}")

                    self.fstr2commit_groups[fstr] = self._process_commit_lines_for(
                        lines_str, fstr
                    )
                except Exception as e:
                    logger.exception(f"Error processing file {fstr}: {e}")

        self.log_space(2)
        reduce_commits()

    def _get_commit_lines_for(self, fstr: FileStr) -> tuple[str, FileStr]:
        """Get git log output for a specific file.

        Args:
            fstr: File string to get commits for

        Returns:
            Tuple of (git log output, file string)

        """

        def git_log_args() -> list[str]:
            """Build git log arguments for file analysis."""
            args = self._get_since_until_args()
            if not self.args.whitespace:
                args.append("-w")
            args += [
                f"{self.head_oid}",
                "--follow",
                "--numstat",  # insertions \t deletions \t file_name
                "--pretty=format:%n%h%n%ct%n%aN",
                "--",  # Separate revisions from files
                str(fstr),
            ]
            return args

        lines_str: str = ""

        if self.args.multithread:
            # Use separate git repo instance for thread safety
            try:
                git_repo = GitRepo(self.location)
                lines_str = git_repo.git.log(*git_log_args())
                git_repo.close()
            except Exception as e:
                logger.exception(f"Git log failed for file {fstr}: {e}")
        elif self.git_repo:
            try:
                lines_str = self.git_repo.git.log(*git_log_args())
            except Exception as e:
                logger.exception(f"Git log failed for file {fstr}: {e}")

        return lines_str, fstr

    def _process_commit_lines_for(
        self, lines_str: str, fstr_root: FileStr
    ) -> list[CommitGroup]:
        """Process git log output lines for a file into commit groups.

        Args:
            lines_str: Git log output
            fstr_root: Root file string

        Returns:
            List of commit groups for the file

        """
        commit_groups: list[CommitGroup] = []
        lines: list[str] = lines_str.strip().splitlines()

        # Regex patterns for file renames
        rename_pattern = re.compile(r"^(.*)\{(.*) => (.*)\}(.*)$")
        simple_rename_pattern = re.compile(r"^(.*) => (.*)$")

        i: int = 0
        while i < len(lines):
            line = lines[i]
            if not line:
                i += 1
                continue

            sha = line
            if sha in self.ex_shas:
                logger.debug(f"Excluding commit {sha}")
                i += 4
                continue

            if i + 3 >= len(lines):
                break

            timestamp = int(lines[i + 1])
            author = lines[i + 2]

            # Check if person is filtered
            person = self.persons_db[author]
            if person.filter_matched:
                i += 4
                continue

            if i + 3 >= len(lines):
                break

            stat_line = lines[i + 3]
            if not stat_line:
                i += 4
                continue

            # Parse stat line (insertions \t deletions \t filename)
            parts = stat_line.split("\t")
            if len(parts) != 3:
                logger.warning(f"Invalid stat line: {stat_line}")
                i += 4
                continue

            try:
                insertions = int(parts[0])
                deletions = int(parts[1])
                file_name = parts[2]
            except ValueError as e:
                logger.warning(f"Error parsing stat line {stat_line}: {e}")
                i += 4
                continue

            # Handle file renames
            fstr = file_name
            match = rename_pattern.match(file_name)
            if match:
                prefix = match.group(1)
                new_part = match.group(3)
                suffix = match.group(4)
                fstr = f"{prefix}{new_part}{suffix}".replace("//", "/")
            else:
                match = simple_rename_pattern.match(file_name)
                if match:
                    fstr = match.group(2)

            # Merge with previous commit group if same file and author
            if (
                len(commit_groups) > 0
                and fstr == commit_groups[-1].fstr
                and author == commit_groups[-1].author
            ):
                commit_groups[-1].date_sum += timestamp * insertions
                commit_groups[-1].shas.add(sha)
                commit_groups[-1].insertions += insertions
                commit_groups[-1].deletions += deletions
            else:
                # Create new commit group
                commit_group = CommitGroup(
                    fstr=fstr,
                    author=author,
                    insertions=insertions,
                    deletions=deletions,
                    date_sum=timestamp * insertions,
                    shas={sha},
                )
                commit_groups.append(commit_group)

            i += 4

        return commit_groups

    def dynamic_blame_history_selected(self) -> bool:
        """Check if dynamic blame history view is selected."""
        return self.args.view == Keys.dynamic_blame_history

    def _set_fr2sha2f(self) -> None:
        """Set file rename mapping by SHA."""
        for fstr in self.fstrs:
            self.fr2sha2f[fstr] = self._get_sha2f_for_fstr(fstr)

    def _set_fr2sha_nr2f(self) -> None:
        """Set file rename mapping by commit number."""
        for fstr in self.fstrs:
            if fstr not in self.fr2sha_nr2f:
                self.fr2sha_nr2f[fstr] = {}
            for sha, new_fstr in self.fr2sha2f[fstr].items():
                sha_nr = self.sha2nr.get(sha, 0)
                self.fr2sha_nr2f[fstr][sha_nr] = new_fstr

    def _set_fr2sha_nrs(self) -> None:
        """Set sorted commit numbers for file renames."""
        for fstr in self.fstrs:
            nrs = sorted(self.fr2sha_nr2f[fstr].keys(), reverse=True)
            self.fr2sha_nrs[fstr] = nrs

    def _get_sha2f_for_fstr(self, root_fstr: FileStr) -> dict[SHA, FileStr]:
        """Get SHA-to-filename mapping for file rename tracking.

        Args:
            root_fstr: Root file string to track renames for

        Returns:
            Dictionary mapping SHAs to file names at those commits

        """
        sha2f: dict[SHA, FileStr] = {}

        if not self.git_repo:
            return sha2f

        try:
            lines: list[str] = self.git_repo.git.log(
                "--pretty=format:%h", "--follow", "--name-status", "--", root_fstr
            ).splitlines()
        except Exception as e:
            logger.exception(f"Git log failed for file rename tracking {root_fstr}: {e}")
            return sha2f

        i: int = 0
        while i < len(lines):
            line = lines[i]
            if not line:
                i += 1
                continue

            if i == len(lines) - 2:
                # Get the last element (file addition)
                sha = line.strip()
                if i + 1 < len(lines):
                    parts = lines[i + 1].split("\t")
                    if len(parts) >= 2:
                        new_fstr = parts[1]
                        sha2f[sha] = new_fstr.strip()
                break

            if "\t" not in line and i + 1 < len(lines) and lines[i + 1].startswith("R"):
                # Handle rename commit
                sha = line.strip()
                parts = lines[i + 1].split("\t")
                if len(parts) >= 3:
                    new_fstr = parts[2]
                    sha2f[sha] = new_fstr.strip()
                i += 2
            else:
                i += 2

        return sha2f

    def get_fstr_for_sha(self, root_fstr: FileStr, sha: SHA) -> FileStr:
        """Get file name for a specific SHA in the file's rename history.

        Args:
            root_fstr: Root file string
            sha: Commit SHA to get file name for

        Returns:
            File name at the specified commit, or empty string if not found

        """
        sha_nr: int = self.sha2nr.get(sha, 0)

        if root_fstr not in self.fr2sha_nr2f:
            return ""

        nrs: list[int] = sorted(self.fr2sha_nr2f[root_fstr].keys(), reverse=True)
        if not nrs:
            msg = f"No entries found for {root_fstr}."
            raise ValueError(msg)

        for nr in nrs:
            if nr <= sha_nr:
                return self.fr2sha_nr2f[root_fstr][nr]

        # sha_nr smaller than the smallest sha nr in the list
        return ""

    def log_dot(self) -> None:
        """Log a dot for progress indication."""
        print(".", end="", flush=True)

    def log_space(self, i: int) -> None:
        """Log spaces for formatting."""
        print(" " * i, end="", flush=True)

    def close(self) -> None:
        """Close the git repository to free resources."""
        if self.git_repo:
            self.git_repo.close()
            self.git_repo = None
            logger.debug(f"Closed git repository: {self.name}")

    def validate_repository(self) -> tuple[bool, str]:
        """Validate that the repository is a valid git repository.

        Returns:
            Tuple of (is_valid, error_message)

        """
        try:
            if not self.location.exists():
                return False, f"Repository path does not exist: {self.location}"

            if not self.location.is_dir():
                return False, f"Repository path is not a directory: {self.location}"

            # Check if it's a git repository
            git_dir = self.location / ".git"
            if not git_dir.exists():
                return (
                    False,
                    f"Not a git repository (no .git directory): {self.location}",
                )

            # Try to initialize git repo to validate
            try:
                test_repo = GitRepo(self.location)
                test_repo.close()
                return True, ""
            except Exception as e:
                return False, f"Invalid git repository: {e}"

        except Exception as e:
            return False, f"Repository validation failed: {e}"

    def get_repository_info(self) -> dict[str, Any]:
        """Get basic repository information.

        Returns:
            Dictionary with repository information

        """
        info = {
            "name": self.name,
            "location": str(self.location),
            "valid": False,
            "head_sha": None,
            "head_oid": None,
            "total_commits": 0,
            "total_files": len(self._fstrs),
        }

        try:
            if self.git_repo:
                info["valid"] = True
                info["head_sha"] = self.head_sha
                info["head_oid"] = self.head_oid
                info["total_commits"] = len(self.sha2nr)

        except Exception as e:
            logger.exception(f"Error getting repository info: {e}")

        return info
