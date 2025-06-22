"""
Blame Analysis Data Models for GitInspectorGUI.

This module provides data structures for blame analysis including
line data and blame information with complete metadata.
"""

from dataclasses import dataclass, field
from datetime import datetime

from gigui.typedefs import OID, SHA, Author, Email, FileStr


@dataclass
class LineData:
    """
    Data for a single line in blame output.

    Represents a line of code with its content, file location, line number,
    and metadata about whether it's a comment or empty line.

    Attributes:
        line: The actual line content
        fstr: File string (path) where this line exists
        line_nr: Line number within the file (1-based)
        is_comment: Whether this line is a comment
    """

    line: str = ""
    fstr: FileStr = ""
    line_nr: int = 0  # line number in file fstr
    is_comment: bool = False


@dataclass
class Blame:
    """
    Blame information for lines of code with complete metadata.

    Represents blame data for one or more consecutive lines of code,
    including author information, commit details, and the actual line data.

    Attributes:
        author: Author name who last modified these lines
        email: Author email address
        date: Commit date as datetime object
        message: Commit message summary
        sha: Short commit SHA (7 characters)
        oid: Full commit OID (40 characters)
        commit_nr: Commit number for ordering (1 = initial commit)
        line_datas: List of LineData objects for the blamed lines
    """

    author: Author = ""
    email: Email = ""
    date: datetime = field(default_factory=lambda: datetime.fromtimestamp(0))
    message: str = ""
    sha: SHA = ""
    oid: OID = ""
    commit_nr: int = 0
    line_datas: list[LineData] = field(default_factory=list)
