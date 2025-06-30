"""Blame Analysis Base Class for GitInspectorGUI.

This module provides the base class for blame operations with core functionality
including git blame command execution and basic blame data management.
"""

from pathlib import Path

from git import Repo as GitRepo

from gigui.analysis.blame.models import Blame
from gigui.core.repository import RepoBase
from gigui.typedefs import SHA, Author, BlameStr, FileStr


class RepoBlameBase(RepoBase):
    """Base class for blame operations with core functionality.

    Provides the foundation for blame analysis including git blame command
    execution, option handling, and basic blame data management.

    Attributes:
        blame_authors: List of authors ordered by blame line count
        fstr2blames: Mapping of files to their blame data
        blame: Current blame object being processed

    """

    def __init__(self, ini_repo) -> None:
        """Initialize blame base with repository configuration.

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
        """Get blame data for a specific file at a given commit.

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
        from gigui.analysis.blame.reader import BlameReader

        blame_lines: list[BlameStr]
        blames: list[Blame]

        # Get raw git blame output
        blame_lines, _ = self._get_git_blames_for(fstr, start_sha)

        # Log progress for non-verbose, single-threaded mode
        if self.args.verbosity == 0 and not self.args.multithread:
            self.log_dot()

        from logging import getLogger

        logger = getLogger(__name__)
        logger.info(" " * 8 + f"{i} of {i_max}: {self.name} {fstr}")

        # Process blame lines into structured data
        blames = BlameReader(blame_lines, self).process_lines(fstr)
        self.fstr2blames[fstr] = blames

        return fstr, blames

    def _get_git_blames_for(
        self, fstr: FileStr, start_sha: SHA
    ) -> tuple[list[BlameStr], FileStr]:
        """Execute git blame command with appropriate options.

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
            getattr(self.args, "copy_move", 0), []
        )

        # Add whitespace handling
        if not getattr(self.args, "whitespace", False):
            blame_opts.append("-w")

        # Add excluded revisions
        for rev in self.ex_shas:
            blame_opts.append(f"--ignore-rev={rev}")

        # Check for ignore revisions file
        working_dir = self.location
        ignore_revs_path = Path(working_dir) / "_git-blame-ignore-revs.txt"
        if ignore_revs_path.exists():
            blame_opts.append(f"--ignore-revs-file={ignore_revs_path!s}")

        # Execute git blame command
        blame_str: BlameStr = self._run_git_blame(start_sha, fstr, blame_opts)
        return blame_str.splitlines(), fstr

    def _run_git_blame(
        self,
        start_sha: SHA,
        root_fstr: FileStr,
        blame_opts: list[str],
    ) -> BlameStr:
        """Execute the actual git blame command.

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
            msg = f"File {root_fstr} not found at {start_sha}, number {self.sha2nr[start_sha]}."
            raise ValueError(
                msg
            )

        start_oid = self.sha2oid[start_sha]
        blame_str: BlameStr

        # Handle thread safety for multithreaded operations
        if getattr(self.args, "multithread", False):
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
