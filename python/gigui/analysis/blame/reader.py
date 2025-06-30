"""Blame Reader for GitInspectorGUI.

This module provides the BlameReader class for parsing git blame porcelain output
and converting it into structured Blame and LineData objects.
"""

import copy
import re
from copy import deepcopy
from datetime import datetime
from pathlib import Path

from gigui.analysis.blame.models import Blame, LineData
from gigui.core.repository import RepoBase
from gigui.typedefs import OID, BlameStr, FileStr


class BlameReader:
    """Parser for git blame porcelain output.

    Processes the raw output from 'git blame --porcelain' command and converts
    it into structured Blame and LineData objects with proper comment detection.

    Attributes:
        lines: Raw blame output lines
        fstr: Current file string being processed
        oid2blame: Cache of OID to Blame mappings
        repo: Repository object for lookups

    """

    def __init__(self, lines: list[BlameStr], repo: RepoBase) -> None:
        """Initialize blame reader with raw output and repository.

        Args:
            lines: Raw git blame output lines
            repo: Repository object for SHA/OID lookups

        """
        self.lines: list[BlameStr] = lines
        self.fstr: FileStr = ""
        self.oid2blame: dict[OID, Blame] = {}  # Cache for blame objects
        self.repo: RepoBase = repo

    def process_lines(self, root_fstr: FileStr) -> list[Blame]:
        """Process raw blame lines into structured Blame objects.

        Parses the git blame porcelain output and creates Blame objects
        with associated LineData. Also performs comment detection on
        all lines after parsing.

        Args:
            root_fstr: Root file string for comment detection

        Returns:
            List of Blame objects with complete line data

        """
        blames: list[Blame] = []
        i: int = 0

        # Parse blame data
        while i < len(self.lines):
            blame, i = self.get_next_blame(i)
            blames.append(blame)

        # Perform comment detection on all lines
        code_lines = [bl.line for b in blames for bl in b.line_datas]
        comment_lines = self._detect_comments(code_lines, root_fstr)

        # Update line data with comment information
        i = 0
        for b in blames:
            for bl in b.line_datas:
                bl.is_comment = comment_lines[i] if i < len(comment_lines) else False
                i += 1

        return blames

    def _detect_comments(self, lines: list[str], fstr: FileStr) -> list[bool]:
        """Detect which lines are comments based on file extension.

        Args:
            lines: List of code lines
            fstr: File string for extension detection

        Returns:
            List of boolean values indicating comment status

        """
        # Simple comment detection based on file extension
        # This is a simplified version - in a full implementation,
        # you would import and use the full comment detection logic
        extension = Path(fstr).suffix.lower()
        comment_lines = []

        for line in lines:
            stripped = line.strip()
            is_comment = False

            # Basic comment detection for common languages
            if extension in [".py"]:
                is_comment = stripped.startswith("#")
            elif extension in [".js", ".ts", ".java", ".c", ".cpp", ".h"]:
                is_comment = stripped.startswith(("//", "/*"))
            elif extension in [".html", ".xml"]:
                is_comment = stripped.startswith("<!--")
            elif extension in [".css"]:
                is_comment = stripped.startswith("/*")
            elif extension in [".sql"]:
                is_comment = stripped.startswith("--")
            elif extension in [".rb"]:
                is_comment = stripped.startswith("#")

            comment_lines.append(is_comment)

        return comment_lines

    def get_next_blame(self, i: int) -> tuple[Blame, int]:
        """Parse the next blame entry from the output.

        Args:
            i: Current line index

        Returns:
            Tuple of (Blame object, next line index)

        Raises:
            ValueError: If line format is unexpected

        """
        line: BlameStr = self.lines[i]

        # Check for blame line format (40-char hex SHA followed by space)
        if re.match(r"^[a-f0-9]{40} ", line):
            parts: list[str] = line.split()
            oid = parts[0]
            line_nr = int(parts[1])
            line_count = int(parts[3])

            # Use cached blame or create new one
            if oid in self.oid2blame:
                b, i = self.get_additional_blame(oid, line_nr, line_count, i + 1)
            else:
                b, i = self.get_new_blame(oid, line_nr, line_count, i + 1)
                # Cache the blame object (without line data)
                self.oid2blame[oid] = copy.deepcopy(b)
                self.oid2blame[oid].line_datas = []
        else:
            msg = f"Unexpected line format: {line}"
            raise ValueError(msg)

        return b, i

    def get_new_blame(
        self, oid: OID, line_nr: int, line_count: int, i: int
    ) -> tuple[Blame, int]:
        """Parse a new blame entry with full metadata.

        Args:
            oid: Object ID (full SHA)
            line_nr: Starting line number
            line_count: Number of lines for this blame
            i: Current line index

        Returns:
            Tuple of (Blame object, next line index)

        """
        b: Blame = Blame()
        b.oid = oid
        b.sha = self.repo.oid2sha[b.oid]
        b.commit_nr = self.repo.sha2nr[self.repo.oid2sha[b.oid]]

        # Parse metadata lines
        line: BlameStr = self.lines[i]
        while not line.startswith("filename "):
            if line.startswith("author "):
                b.author = line[len("author ") :]
            elif line.startswith("author-mail "):
                b.email = line[len("author-mail ") :].strip("<>")
            elif line.startswith("author-time "):
                b.date = datetime.fromtimestamp(int(line[len("author-time ") :]))
            elif line.startswith("summary "):
                b.message = line[len("summary ") :]
            i += 1
            line = self.lines[i]

        # Get filename
        self.fstr = line[len("filename ") :]
        i += 1

        # Parse line data
        d = LineData()
        d.line_nr = line_nr
        d.fstr = self.fstr
        d, i = self.parse_line(d, i)
        b.line_datas.append(d)

        # Parse additional lines for this blame
        for _ in range(line_count - 1):
            d, i = self.get_blame_oid_line(oid, i)
            b.line_datas.append(d)

        return b, i

    def get_additional_blame(
        self, oid: OID, line_nr: int, line_count: int, i: int
    ) -> tuple[Blame, int]:
        """Parse additional blame lines for an already-seen OID.

        Args:
            oid: Object ID (already seen)
            line_nr: Starting line number
            line_count: Number of lines for this blame
            i: Current line index

        Returns:
            Tuple of (Blame object, next line index)

        """
        b: Blame = deepcopy(self.oid2blame[oid])
        line_datas: list[LineData] = []

        # Skip optional previous line
        if self.lines[i].startswith("previous "):
            i += 1

        # Update filename if present
        if self.lines[i].startswith("filename "):
            self.fstr = self.lines[i][len("filename ") :]
            i += 1

        # Parse first line
        d = LineData()
        d.line_nr = line_nr
        d.fstr = self.fstr
        d, i = self.parse_line(d, i)
        line_datas.append(d)

        # Parse additional lines
        for _ in range(line_count - 1):
            d, i = self.get_blame_oid_line(oid, i)
            line_datas.append(d)

        b.line_datas = line_datas
        return b, i

    def get_blame_oid_line(self, oid: OID, i: int) -> tuple[LineData, int]:
        """Parse a blame line that references an existing OID.

        Args:
            oid: Expected OID
            i: Current line index

        Returns:
            Tuple of (LineData object, next line index)

        Raises:
            AssertionError: If OID doesn't match expected value

        """
        line: BlameStr = self.lines[i]
        d: LineData = LineData()

        parts: list[str] = line.split()
        assert parts[0] == oid, f"Read {parts[0]} instead of {oid} in {line}"

        d.line_nr = int(parts[1])
        d.fstr = self.fstr

        # Next line should contain the actual code (prefixed with tab)
        line = self.lines[i + 1]
        assert line.startswith("\t"), f"Expected starting tab, got {line}"
        d.line = line[1:]  # Remove tab prefix

        return d, i + 2

    def parse_line(self, d: LineData, i: int) -> tuple[LineData, int]:
        """Parse a code line from blame output.

        Args:
            d: LineData object to populate
            i: Current line index

        Returns:
            Tuple of (updated LineData, next line index)

        Raises:
            AssertionError: If line doesn't start with tab

        """
        line: BlameStr = self.lines[i]
        assert line.startswith("\t"), f"Expected starting tab, got {line}"

        d.line = line[1:]  # Remove tab prefix
        d.fstr = self.fstr

        return d, i + 1
