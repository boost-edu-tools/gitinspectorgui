"""
Type definitions for GitInspectorGUI.

This module contains type aliases used throughout the application,
migrated from the original gitinspectorgui-old codebase.
"""

from typing import Any, Dict, List, Set, Tuple, Union
from dataclasses import dataclass, field

# Basic types
type Author = str
type Email = str
type FileStr = str
type FilePattern = str
type Row = list[str | int | float]
type BrowserID = str

# Git-related types
type OID = str  # Object ID = long commit SHA, 40 chars
type SHA = str  # short commit SHA, often 7 chars
type Rev = OID | SHA  # long or short commit SHA

# Output types
type HtmlStr = str
type BlameStr = str  # Output of git blame command

# Data structure types
type RowsBools = tuple[list[Row], list[bool]]

# Excel formatting types
type FormatSpec = dict[str, str | int | float]

# Complex data structure types for analysis
type AuthorToFileStatDict = dict[Author, dict[FileStr, Any]]  # FileStat objects
type FileToAuthorStatDict = dict[FileStr, dict[Author, Any]]  # FileStat objects
type AuthorToPersonStatDict = dict[Author, Any]  # PersonStat objects
type FileToFileStatDict = dict[FileStr, Any]  # FileStat objects
type SHAToAuthorDict = dict[SHA, Author]
type AuthorToNumberDict = dict[Author, int]
type FileToSHAsDict = dict[FileStr, list[SHA]]

# Blame history types
type FileRenameToFileToAuthorToSHAsDict = dict[FileStr, dict[FileStr, dict[Author, list[SHA]]]]
type SHAToAuthorNumberDict = dict[SHA, int]

# Repository data types
type CommitGroupsDict = dict[FileStr, list[Any]]  # CommitGroup objects
type BlamesDict = dict[FileStr, list[Any]]  # Blame objects
type LineCountDict = dict[FileStr, int]

# Settings and configuration types
type SettingsDict = dict[str, Any]
type ValidationResult = tuple[bool, str]  # (is_valid, error_message)

# Analysis result types
type StatisticsData = dict[str, Union[int, float, str]]
type AnalysisResults = dict[str, Union[StatisticsData, list[Row], HtmlStr]]

# Time and date types
type UnixTimestamp = int  # Unix timestamp in seconds since epoch
type AgeString = str  # Formatted age string like "1:02:15" (years:months:days)

# Filter and pattern types
type AuthorPatterns = list[str]  # List of author filter patterns
type EmailPatterns = list[str]  # List of email filter patterns
type FileExtensions = list[str]  # List of allowed file extensions

# Queue and processing types
type TaskQueue = Any  # Queue[IniRepo] - for task processing
type ProcessingResult = tuple[bool, str]  # (success, message)

# HTML and web server types
type LocalHostData = dict[str, Any]  # Data for localhost server
type BrowserIDToDataDict = dict[BrowserID, Any]  # Browser ID to data mapping

# Excel and output formatting types
type ExcelFormat = Any  # Excel format object
type ColorFormats = list[Any]  # List of color format objects
type ChartData = dict[str, Any]  # Chart configuration data

# Git repository types
type GitRepoPath = str  # Path to git repository
type CommitData = dict[str, Any]  # Commit information
type BlameLineData = dict[str, Any]  # Blame line information

# Advanced analysis types
type StabilityMetric = Union[int, str]  # Stability percentage or empty string
type PercentageValue = float  # Percentage value (0.0 to 100.0)
type AuthorColorMapping = dict[Author, str]  # Author to color mapping
type FileRenameHistory = dict[FileStr, list[FileStr]]  # File rename tracking

# Forward declarations for complex classes (to be imported when needed)
# These represent the main data classes from the legacy system:
# - CommitGroup: Groups commits by author and file
# - Stat: Statistical data for commits (insertions, deletions, etc.)
# - PersonStat: Statistics for a specific person/author
# - FileStat: Statistics for a specific file
# - Blame: Blame information for a line of code
# - Person: Represents a person with multiple author names/emails
# - IniRepo: Initial repository configuration
# - Args: Command line arguments and settings
# - Settings: Application settings
# - RepoData: Repository analysis data
# - PersonsDB: Database of persons/authors


# Core dataclass definitions migrated from legacy system
@dataclass
class CommitGroup:
    """Groups commits by author and file name."""

    fstr: FileStr
    author: Author
    insertions: int
    deletions: int
    date_sum: int
    shas: Set[SHA] = field(default_factory=set)


@dataclass
class SHADateNr:
    """SHA with date and number for sorting."""

    sha: SHA
    date: int
    nr: int


@dataclass
class IniRepo:
    """Initial repository configuration."""

    name: str
    location: str


@dataclass
class LineData:
    """Data for a single line in blame output."""

    line: str = ""
    is_comment: bool = False
    is_empty: bool = False


@dataclass
class Blame:
    """Blame information for a line of code."""

    author: Author = ""
    email: Email = ""
    sha: SHA = ""
    date: int = 0
    line_data: LineData = field(default_factory=lambda: LineData())


@dataclass
class CommentMarker:
    """Comment markers for different file types."""

    start: str | None = None
    end: str | None = None
    line: str | None = None


@dataclass
class LocalHostData:
    """Data for localhost server configuration."""

    name: str
    html: HtmlStr
    browser_id: BrowserID


@dataclass
class RunnerQueues:
    """Queues for task processing."""

    task: TaskQueue
    result: TaskQueue
