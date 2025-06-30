"""Statistics Engine for GitInspectorGUI.

This module contains the core statistical data structures and calculation algorithms
for git repository analysis. It provides sophisticated metrics including stability
calculations, age analysis, and comprehensive data aggregation.

Migrated from gitinspectorgui-old/src/gigui/data.py with enhanced type safety
and compatibility with the new architecture.

Key Features:
- Advanced age calculation algorithms (timestamp_to_age)
- Stability metrics calculation
- Percentage calculations for insertions, deletions, and lines
- Commit group aggregation
- Statistical data structures for persons and files
- Performance-optimized data operations
"""

import time
from dataclasses import dataclass
from logging import getLogger
from math import floor
from pathlib import Path

from gigui.core.person_manager import Person
from gigui.typedefs import (
    SHA,
    AgeString,
    Author,
    FileStr,
    PercentageValue,
    StabilityMetric,
    UnixTimestamp,
)

# Time calculation constants
SECONDS_IN_DAY = 60 * 60 * 24
DAYS_IN_MONTH = 30.44
DAYS_IN_YEAR = 365.25

logger = getLogger(__name__)

NOW = int(time.time())  # current time as Unix timestamp in seconds since epoch


@dataclass
class CommitGroup:
    """Groups commits by author and file name for aggregated analysis.

    A CommitGroup holds the sum of commit data for commits that share the same
    person author and file name. This enables efficient statistical calculations
    across related commits.

    Attributes:
        fstr: File path string
        author: Author name
        insertions: Total lines inserted
        deletions: Total lines deleted
        date_sum: Sum of Unix timestamps for age calculations
        shas: Set of commit SHAs in this group

    """

    fstr: FileStr
    author: Author
    insertions: int
    deletions: int
    date_sum: UnixTimestamp
    shas: set[SHA]


class Stat:
    """Core statistical data container with advanced metrics calculations.

    This class provides sophisticated statistical analysis capabilities including:
    - Stability metrics (percentage of inserted lines still present)
    - Age calculations based on weighted timestamps
    - Percentage calculations for various metrics
    - Commit aggregation and data merging

    The stability metric indicates code quality by measuring what percentage
    of inserted lines are still present in the current codebase.
    """

    def __init__(self) -> None:
        """Initialize empty statistical data container."""
        self.shas: set[SHA] = set()  # Used to calculate number of commits as len(shas)
        self.insertions: int = 0
        self.deletions: int = 0
        self.date_sum: UnixTimestamp = 0  # Sum of Unix timestamps in seconds
        self.blame_line_count: int = 0
        self.percent_insertions: PercentageValue = 0.0
        self.percent_deletions: PercentageValue = 0.0
        self.percent_lines: PercentageValue = 0.0

    @property
    def stability(self) -> StabilityMetric:
        """Calculate stability metric as percentage of inserted lines still present.

        Stability indicates code quality - higher values mean more of the
        inserted code is still present in the current codebase.

        Returns:
            Stability percentage (0-100) or empty string if no data

        """
        return (
            min(100, round(100 * self.blame_line_count / self.insertions))
            if self.insertions and self.blame_line_count
            else ""
        )

    @property
    def age(self) -> AgeString:
        """Calculate weighted average age of commits.

        Uses insertion-weighted timestamps to provide meaningful age
        calculations that reflect the actual contribution timeline.

        Returns:
            Formatted age string (e.g., "1:02:15" for 1 year, 2 months, 15 days)

        """
        return (
            self.timestamp_to_age(round(self.date_sum / self.insertions))
            if self.insertions > 0
            else ""
        )

    @property
    def commit_count(self) -> int:
        """Get the number of unique commits in this statistic."""
        return len(self.shas)

    def __repr__(self) -> str:
        """Detailed string representation for debugging."""
        s = ""
        s += f"  insertions = {self.insertions}\n"
        s += f"  deletions = {self.deletions}\n"
        s += f"  commits = {self.commit_count}\n"
        s += f"  stability = {self.stability}\n"
        s += f"  age = {self.age}\n"
        return s

    def __str__(self) -> str:
        """String representation."""
        return self.__repr__()

    def add(self, other: "Stat") -> None:
        """Merge another Stat object into this one.

        Combines all statistical data including SHAs, insertions, deletions,
        timestamps, and blame line counts.

        Args:
            other: Another Stat object to merge

        """
        self.shas = self.shas | other.shas
        self.insertions = self.insertions + other.insertions
        self.deletions = self.deletions + other.deletions
        self.date_sum = self.date_sum + other.date_sum
        self.blame_line_count = self.blame_line_count + other.blame_line_count

    def add_commit_group(self, commit_group: CommitGroup) -> None:
        """Add data from a CommitGroup to this statistic.

        Efficiently incorporates commit group data into the running statistics.

        Args:
            commit_group: CommitGroup containing aggregated commit data

        """
        self.shas |= commit_group.shas
        self.insertions += commit_group.insertions
        self.deletions += commit_group.deletions
        self.date_sum += commit_group.date_sum

    @staticmethod
    def timestamp_to_age(time_stamp: UnixTimestamp) -> AgeString:
        """Convert Unix timestamp to human-readable age string.

        Implements sophisticated age calculation that provides meaningful
        time representations in years:months:days format.

        Args:
            time_stamp: Unix timestamp in seconds since epoch

        Returns:
            Formatted age string (e.g., "1:02:15" or "02:15" if less than a year)

        """
        seconds: int = NOW - time_stamp
        days: float = seconds / SECONDS_IN_DAY
        years: int = floor(days / DAYS_IN_YEAR)
        remaining_days: float = days - years * DAYS_IN_YEAR
        months: int = floor(remaining_days / DAYS_IN_MONTH)
        remaining_days = round(remaining_days - months * DAYS_IN_MONTH)

        if years:
            return f"{years}:{months:02}:{remaining_days:02}"
        return f"{months:02}:{remaining_days:02}"


class PersonStat:
    """Statistical data container for a specific person/author.

    Combines person identity information with their statistical contributions
    to provide comprehensive author analysis.

    Attributes:
        person: Person object with identity information
        stat: Stat object with statistical data

    """

    def __init__(self, person: Person):
        """Initialize person statistics.

        Args:
            person: Person object containing identity information

        """
        self.person: Person = person
        self.stat: Stat = Stat()

    def __repr__(self) -> str:
        """Detailed string representation for debugging."""
        s = f"person stat: {self.person.authors_str}\n"
        s += f"{self.stat!r}\n"
        return s

    def __str__(self) -> str:
        """String representation."""
        return self.__repr__()


class FileStat:
    """Statistical data container for a specific file with rename tracking.

    Provides comprehensive file analysis including rename history tracking
    and statistical aggregation across all file versions.

    Class Attributes:
        show_renames: Global setting for displaying file rename information
    """

    show_renames: bool = False

    def __init__(self, fstr: FileStr):
        """Initialize file statistics.

        Args:
            fstr: Primary file path string

        """
        self.fstr: FileStr = fstr
        self.names: list[FileStr] = []  # Track file renames
        self.stat: Stat = Stat()

    def __repr__(self) -> str:
        """Detailed string representation for debugging."""
        s = f"FileStat: {self.names_str()}\n"
        s += f"{self.stat!r}\n"
        return s

    def __str__(self) -> str:
        """String representation."""
        return self.__repr__()

    def add_name(self, name: FileStr) -> None:
        """Add a file name to the rename history.

        Tracks all names this file has had throughout its history,
        enabling comprehensive rename analysis.

        Args:
            name: File name to add to history

        """
        if name not in self.names:
            self.names.append(name)

    def add_commit_group(self, commit_group: CommitGroup) -> None:
        """Add commit group data to this file's statistics.

        Incorporates commit data and updates the file name history.

        Args:
            commit_group: CommitGroup containing file-specific commit data

        """
        assert commit_group.fstr != ""
        self.add_name(commit_group.fstr)
        self.stat.add_commit_group(commit_group)

    def names_str(self) -> str:
        """Get formatted string representation of file names.

        Provides intelligent file name display based on rename settings
        and file history.

        Returns:
            Formatted file name string showing renames if enabled

        """
        names = self.names
        if self.fstr == "*":
            return "*"
        if len(names) == 0:
            return self.fstr + ": no commits"
        if not self.show_renames:
            return self.fstr
        if self.fstr in names:
            return " + ".join(names)
        return self.fstr + ": " + " + ".join(names)

    def relative_names_str(self, subfolder: str) -> str:
        """Get relative file names string for a specific subfolder.

        Provides subfolder-relative file paths for better display
        in hierarchical repository views.

        Args:
            subfolder: Subfolder path to make names relative to

        Returns:
            Formatted relative file name string

        """
        if self.fstr == "*":
            return "*"

        names = []
        for name in self.names:
            names.append(get_relative_fstr(name, subfolder))

        fstr = get_relative_fstr(self.fstr, subfolder)
        if len(names) == 0:
            return fstr + ": no commits"
        if not self.show_renames:
            return fstr
        if fstr in names:
            return " + ".join(names)
        return fstr + ": " + " + ".join(names)


@dataclass
class IniRepo:
    """Initial repository configuration for analysis.

    Contains the basic information needed to initialize repository analysis,
    including location and analysis parameters.

    Attributes:
        name: Repository name
        location: Path to repository location
        args: Analysis arguments and settings (if available)

    """

    name: str
    location: Path
    args: object | None = None  # Args type not yet migrated


def get_relative_fstr(fstr: str, subfolder: str) -> str:
    """Get relative file path string for a specific subfolder.

    Utility function for converting absolute file paths to relative paths
    within a specific subfolder context.

    Args:
        fstr: File path string
        subfolder: Subfolder to make path relative to

    Returns:
        Relative file path string

    """
    if len(subfolder):
        if fstr.startswith(subfolder):
            relative_fstr = fstr[len(subfolder) :]
            if relative_fstr.startswith("/"):
                return relative_fstr[1:]
            return relative_fstr
        return "/" + fstr
    return fstr
