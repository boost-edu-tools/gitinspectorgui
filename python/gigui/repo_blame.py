"""
Blame Analysis Engine for GitInspectorGUI.

This module provides sophisticated blame analysis capabilities including line-by-line
attribution, historical blame tracking, and stability metrics calculation. It enables
detailed code ownership analysis and tracks how code evolves over time.

Migrated from gitinspectorgui-old/src/gigui/repo_blame.py with enhanced type safety,
performance optimizations, and compatibility with the new architecture.

Key Features:
- Line-by-line blame attribution with author tracking
- Historical blame tracking across commits
- Stability metrics calculation (percentage of lines still present)
- Performance optimizations for large files with threading support
- Comment detection and filtering
- Integration with repository base classes and person database
- Advanced blame data structures and processing
- Copy/move detection and whitespace handling
- Exclusion support for revisions and authors

Classes:
    LineData: Data for a single line in blame output
    Blame: Blame information for lines of code with metadata
    RepoBlameBase: Base class for blame operations
    RepoBlame: Main blame analysis with threading support
    RepoBlameHistory: Historical blame tracking and analysis
    BlameReader: Parser for git blame porcelain output
"""

import copy
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime
from logging import getLogger
from pathlib import Path
from typing import Optional

from git import Repo as GitRepo

from gigui.data import FileStat, IniRepo
from gigui.repo_base import RepoBase, BLAME_CHUNK_SIZE, MAX_THREAD_WORKERS
from gigui.typedefs import (
    OID,
    SHA,
    Author,
    BlameStr,
    Email,
    FileStr,
)

logger = getLogger(__name__)


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


class RepoBlameBase(RepoBase):
    """
    Base class for blame operations with core functionality.
    
    Provides the foundation for blame analysis including git blame command
    execution, option handling, and basic blame data management.
    
    Attributes:
        blame_authors: List of authors ordered by blame line count
        fstr2blames: Mapping of files to their blame data
        blame: Current blame object being processed
    """

    def __init__(self, ini_repo: IniRepo) -> None:
        """
        Initialize blame base with repository configuration.
        
        Args:
            ini_repo: Initial repository configuration
        """
        super().__init__(ini_repo)

        # List of blame authors, no filtering, ordered by highest blame line count
        self.blame_authors: list[Author] = []

        # Mapping of file strings to their blame data
        self.fstr2blames: dict[FileStr, list[Blame]] = {}
        
        # Current blame object being processed
        self.blame: Blame = Blame()

    def get_blames_for(
        self, fstr: FileStr, start_sha: SHA, i: int, i_max: int
    ) -> tuple[FileStr, list[Blame]]:
        """
        Get blame data for a specific file at a given commit.
        
        Executes git blame command and processes the output to create
        structured blame data with line-by-line attribution.
        
        Args:
            fstr: File string (path) to analyze
            start_sha: Starting commit SHA for blame analysis
            i: Current file index (for progress logging)
            i_max: Total number of files (for progress logging)
            
        Returns:
            Tuple of (file_string, list_of_blame_objects)
        """
        blame_lines: list[BlameStr]
        blames: list[Blame]
        
        # Get raw git blame output
        blame_lines, _ = self._get_git_blames_for(fstr, start_sha)
        
        # Log progress for non-verbose, single-threaded mode
        if self.args.verbosity == 0 and not self.args.multithread:
            self.log_dot()
            
        logger.info(" " * 8 + f"{i} of {i_max}: {self.name} {fstr}")
        
        # Process blame lines into structured data
        blames = BlameReader(blame_lines, self).process_lines(fstr)
        self.fstr2blames[fstr] = blames
        
        return fstr, blames

    def _get_git_blames_for(
        self, fstr: FileStr, start_sha: SHA
    ) -> tuple[list[BlameStr], FileStr]:
        """
        Execute git blame command with appropriate options.
        
        Builds the git blame command with copy/move detection, whitespace
        handling, and revision exclusions based on configuration.
        
        Args:
            fstr: File string to blame
            start_sha: Starting commit SHA
            
        Returns:
            Tuple of (blame_lines, file_string)
        """
        # Copy/move detection options
        copy_move_int2opts: dict[int, list[str]] = {
            0: [],
            1: ["-M"],
            2: ["-C"],
            3: ["-C", "-C"],
            4: ["-C", "-C", "-C"],
        }
        
        # Build blame options based on configuration
        blame_opts: list[str] = copy_move_int2opts.get(
            getattr(self.args, 'copy_move', 0), []
        )
        
        # Add whitespace handling
        if not getattr(self.args, 'whitespace', False):
            blame_opts.append("-w")
            
        # Add excluded revisions
        for rev in self.ex_shas:
            blame_opts.append(f"--ignore-rev={rev}")
            
        # Check for ignore revisions file
        working_dir = self.location
        ignore_revs_path = Path(working_dir) / "_git-blame-ignore-revs.txt"
        if ignore_revs_path.exists():
            blame_opts.append(f"--ignore-revs-file={str(ignore_revs_path)}")
            
        # Execute git blame command
        blame_str: BlameStr = self._run_git_blame(start_sha, fstr, blame_opts)
        return blame_str.splitlines(), fstr

    def _run_git_blame(
        self,
        start_sha: SHA,
        root_fstr: FileStr,
        blame_opts: list[str],
    ) -> BlameStr:
        """
        Execute the actual git blame command.
        
        Handles thread safety by creating separate GitRepo instances for
        multithreaded operations.
        
        Args:
            start_sha: Starting commit SHA
            root_fstr: Root file string
            blame_opts: List of git blame options
            
        Returns:
            Raw git blame output string
            
        Raises:
            ValueError: If file not found at specified commit
        """
        # Get file string for the specific SHA
        fstr = self.get_fstr_for_sha(root_fstr, start_sha)
        if not fstr:
            raise ValueError(
                f"File {root_fstr} not found at {start_sha}, "
                f"number {self.sha2nr[start_sha]}."
            )
            
        start_oid = self.sha2oid[start_sha]
        blame_str: BlameStr
        
        # Handle thread safety for multithreaded operations
        if getattr(self.args, 'multithread', False):
            # GitPython is not thread-safe, create new GitRepo instance
            git_repo = GitRepo(self.location)
            blame_str = git_repo.git.blame(
                start_oid, fstr, "--follow", "--porcelain", *blame_opts
            )  # type: ignore
            git_repo.close()
        else:
            blame_str = self.git_repo.git.blame(
                start_oid, fstr, "--follow", "--porcelain", *blame_opts
            )  # type: ignore
            
        return blame_str



class RepoBlame(RepoBlameBase):
    """
    Main blame analysis class with threading support and author management.
    
    Provides comprehensive blame analysis including multithreaded processing,
    author database integration, and statistical calculations for code attribution.
    """

    def run_blame(self) -> None:
        """
        Execute blame analysis for all files in the repository.
        
        Processes all files using either multithreaded or single-threaded approach
        based on configuration. Updates the person database with newly discovered
        authors and normalizes author names.
        """
        logger = getLogger(__name__)
        i_max: int = len(self.fstrs)
        i: int = 0
        chunk_size: int = BLAME_CHUNK_SIZE
        
        logger.info(" " * 8 + f"Blame: {self.name}: {i_max} files")
        
        # Multithreaded processing
        if getattr(self.args, 'multithread', False):
            with ThreadPoolExecutor(max_workers=MAX_THREAD_WORKERS) as thread_executor:
                for chunk_start in range(0, i_max, chunk_size):
                    chunk_end = min(chunk_start + chunk_size, i_max)
                    chunk_fstrs = self.fstrs[chunk_start:chunk_end]
                    
                    # Submit blame tasks for the chunk
                    futures = [
                        thread_executor.submit(
                            self.get_blames_for, fstr, self.head_sha, i + inc + 1, i_max
                        )
                        for inc, fstr in enumerate(chunk_fstrs)
                    ]
                    
                    # Collect results as they complete
                    for future in as_completed(futures):
                        fstr, blames = future.result()
                        self.fstr2blames[fstr] = blames
        else:
            # Single-threaded processing
            for fstr in self.fstrs:
                fstr, blames = self.get_blames_for(fstr, self.head_sha, i, i_max)
                self.fstr2blames[fstr] = blames
                i += 1

        # Update authors with person database normalization
        self._normalize_blame_authors()

    def _normalize_blame_authors(self) -> None:
        """
        Normalize blame authors using the person database.
        
        Updates all blame objects to use normalized author names from the
        person database, ensuring consistent author attribution across
        different email addresses and name variations.
        """
        # Create normalized version of fstr2blames
        fstr2blames: dict[FileStr, list[Blame]] = {}
        
        for fstr in self.fstrs:
            fstr2blames[fstr] = []
            for b in self.fstr2blames[fstr]:
                # Add author to person database if not present
                if b.author not in self.persons_db:
                    self.persons_db.add_person(b.author, b.email)
                    
                # Update author to normalized name
                b.author = self.persons_db[b.author].author
                fstr2blames[fstr].append(b)
                
        self.fstr2blames = fstr2blames

    def update_author2fstr2fstat(
        self, author2fstr2fstat: dict[Author, dict[FileStr, FileStat]]
    ) -> dict[Author, dict[FileStr, FileStat]]:
        """
        Update author statistics with blame line counts.
        
        Calculates line counts for each author, excluding comments and empty
        lines based on configuration. Updates the provided statistics dictionary
        with blame-based line counts.
        
        Args:
            author2fstr2fstat: Author to file statistics mapping
            
        Returns:
            Updated author to file statistics mapping
        """
        author2line_count: dict[Author, int] = {}
        target = author2fstr2fstat
        
        for fstr in self.fstrs:
            blames: list[Blame] = self.fstr2blames[fstr]
            
            for b in blames:
                # Skip commits outside date range
                if b.commit_nr not in self.sha_since_until_nrs:
                    continue
                    
                person = self.persons_db[b.author]
                author = person.author
                
                # Initialize author line count
                if author not in author2line_count:
                    author2line_count[author] = 0
                    
                # Calculate line counts with exclusions
                total_line_count = len(b.line_datas)
                
                # Subtract comment lines if not counting comments
                comment_lines_subtract = (
                    0
                    if getattr(self.args, 'comments', False)
                    else [bl.is_comment for bl in b.line_datas].count(True)
                )
                
                # Subtract empty lines if not counting empty lines
                empty_lines_subtract = (
                    0
                    if getattr(self.args, 'empty_lines', False)
                    else len([bl.line for bl in b.line_datas if not bl.line.strip()])
                )
                
                line_count = (
                    total_line_count - comment_lines_subtract - empty_lines_subtract
                )
                
                author2line_count[author] += line_count
                
                # Update statistics if author not filtered
                if not person.filter_matched:
                    if fstr not in target[author]:
                        target[author][fstr] = FileStat(fstr)
                    target[author][fstr].stat.blame_line_count += line_count
                    target[author]["*"].stat.blame_line_count += line_count
                    target["*"]["*"].stat.blame_line_count += line_count
                    
        return target

    def get_blame_shas_for_fstr(self, fstr: FileStr) -> list[SHA]:
        """
        Get sorted list of commit SHAs that modified a file.
        
        Analyzes blame data to find all commits that contributed to the current
        state of a file, filtered by date range and exclusions.
        
        Args:
            fstr: File string to analyze
            
        Returns:
            List of SHAs sorted by commit number (newest first)
        """
        shas: set[SHA] = set()
        blames: list[Blame] = self.fstr2blames[fstr]
        
        # Get first commit number where file was added
        first_sha_nr: int = self.fr2sha_nrs[fstr][-1]
        
        # Collect SHAs from blame data
        for b in blames:
            for d in b.line_datas:
                if self.line_data_ok(b, d):
                    sha_nr = self.sha2nr[b.sha]
                    if sha_nr >= first_sha_nr:
                        shas.add(b.sha)
                        
        # Always include head SHA
        shas.add(self.head_sha)
        
        # Sort by commit number (newest first)
        shas_sorted = sorted(shas, key=lambda x: self.sha2nr[x], reverse=True)
        return shas_sorted

    def line_data_ok(self, b: Blame, d: LineData) -> bool:
        """
        Check if a line data entry should be included in analysis.
        
        Applies filters for comments, empty lines, excluded authors,
        and date ranges to determine if a line should be counted.
        
        Args:
            b: Blame object containing the line
            d: LineData object to check
            
        Returns:
            True if line should be included, False otherwise
        """
        comment_ok: bool = getattr(self.args, 'comments', False) or not d.is_comment
        empty_ok: bool = getattr(self.args, 'empty_lines', False) or d.line.strip() != ""
        author_ok: bool = b.author not in getattr(self.args, 'ex_authors', [])
        date_ok: bool = b.commit_nr in self.sha_since_until_nrs
        
        return comment_ok and empty_ok and author_ok and date_ok


class RepoBlameHistory(RepoBlame):
    """
    Historical blame tracking and analysis.
    
    Extends RepoBlame to provide historical blame analysis capabilities,
    tracking how blame attribution changes over time and calculating
    stability metrics for code sections.
    
    Attributes:
        fr2f2shas: File rename to file to SHAs mapping
        fstr2sha2blames: File to SHA to blames mapping for history
    """

    def __init__(self, ini_repo: IniRepo) -> None:
        """
        Initialize blame history with repository configuration.
        
        Args:
            ini_repo: Initial repository configuration
        """
        super().__init__(ini_repo)

        # File rename history mappings
        self.fr2f2shas: dict[FileStr, dict[FileStr, list[SHA]]] = {}
        
        # Historical blame data: file -> SHA -> blames
        self.fstr2sha2blames: dict[FileStr, dict[SHA, list[Blame]]] = {}

    def generate_fr_blame_history(self, root_fstr: FileStr, sha: SHA) -> list[Blame]:
        """
        Generate blame history for a file at a specific commit.
        
        Creates blame data for a file at a historical commit, enabling
        analysis of how code attribution has changed over time.
        
        Args:
            root_fstr: Root file string
            sha: Commit SHA to analyze
            
        Returns:
            List of Blame objects for the file at the given commit
        """
        blame_lines: list[BlameStr]
        blame_lines, _ = self._get_git_blames_for(root_fstr, sha)
        blames: list[Blame] = BlameReader(blame_lines, self).process_lines(root_fstr)
        return blames

    def calculate_stability_metrics(self, fstr: FileStr) -> dict[SHA, float]:
        """
        Calculate stability metrics for a file across commits.
        
        Determines what percentage of lines from each historical commit
        are still present in the current version of the file.
        
        Args:
            fstr: File string to analyze
            
        Returns:
            Dictionary mapping SHAs to stability percentages
        """
        if fstr not in self.fstr2sha2blames:
            return {}
            
        stability_metrics: dict[SHA, float] = {}
        current_blames = self.fstr2blames.get(fstr, [])
        current_lines = {bl.line.strip() for b in current_blames for bl in b.line_datas}
        
        for sha, historical_blames in self.fstr2sha2blames[fstr].items():
            historical_lines = {
                bl.line.strip() for b in historical_blames for bl in b.line_datas
            }
            
            if not historical_lines:
                stability_metrics[sha] = 0.0
                continue
                
            # Calculate percentage of historical lines still present
            preserved_lines = current_lines.intersection(historical_lines)
            stability_percentage = (len(preserved_lines) / len(historical_lines)) * 100
            stability_metrics[sha] = stability_percentage
            
        return stability_metrics


class BlameReader:
    """
    Parser for git blame porcelain output.
    
    Processes the raw output from 'git blame --porcelain' command and converts
    it into structured Blame and LineData objects with proper comment detection.
    
    Attributes:
        lines: Raw blame output lines
        fstr: Current file string being processed
        oid2blame: Cache of OID to Blame mappings
        repo: Repository object for lookups
    """

    def __init__(self, lines: list[BlameStr], repo: RepoBase) -> None:
        """
        Initialize blame reader with raw output and repository.
        
        Args:
            lines: Raw git blame output lines
            repo: Repository object for SHA/OID lookups
        """
        self.lines: list[BlameStr] = lines
        self.fstr: FileStr = ""
        self.oid2blame: dict[OID, Blame] = {}  # Cache for blame objects
        self.repo: RepoBase = repo

    def process_lines(self, root_fstr: FileStr) -> list[Blame]:
        """
        Process raw blame lines into structured Blame objects.
        
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
        """
        Detect which lines are comments based on file extension.
        
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
            if extension in ['.py']:
                is_comment = stripped.startswith('#')
            elif extension in ['.js', '.ts', '.java', '.c', '.cpp', '.h']:
                is_comment = stripped.startswith('//') or stripped.startswith('/*')
            elif extension in ['.html', '.xml']:
                is_comment = stripped.startswith('<!--')
            elif extension in ['.css']:
                is_comment = stripped.startswith('/*')
            elif extension in ['.sql']:
                is_comment = stripped.startswith('--')
            elif extension in ['.rb']:
                is_comment = stripped.startswith('#')
                
            comment_lines.append(is_comment)
            
        return comment_lines

    def get_next_blame(self, i: int) -> tuple[Blame, int]:
        """
        Parse the next blame entry from the output.
        
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
            raise ValueError(f"Unexpected line format: {line}")
            
        return b, i

    def get_new_blame(
        self, oid: OID, line_nr: int, line_count: int, i: int
    ) -> tuple[Blame, int]:
        """
        Parse a new blame entry with full metadata.
        
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
        """
        Parse additional blame lines for an already-seen OID.
        
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
        """
        Parse a blame line that references an existing OID.
        
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
        """
        Parse a code line from blame output.
        
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