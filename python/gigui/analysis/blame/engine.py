"""
Blame Analysis Engine for GitInspectorGUI.

This module provides the main blame analysis classes including
multithreaded processing and historical blame tracking.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from logging import getLogger

from gigui.analysis.blame.base import RepoBlameBase
from gigui.analysis.blame.models import Blame, LineData
from gigui.analysis.blame.reader import BlameReader
from gigui.core.repository import BLAME_CHUNK_SIZE, MAX_THREAD_WORKERS
from gigui.typedefs import SHA, Author, BlameStr, FileStr

logger = getLogger(__name__)


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
        i_max: int = len(self.fstrs)
        i: int = 0
        chunk_size: int = BLAME_CHUNK_SIZE

        logger.info(" " * 8 + f"Blame: {self.name}: {i_max} files")

        # Multithreaded processing
        if getattr(self.args, "multithread", False):
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
        self, author2fstr2fstat: dict[Author, dict[FileStr, any]]
    ) -> dict[Author, dict[FileStr, any]]:
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
                    if getattr(self.args, "comments", False)
                    else [bl.is_comment for bl in b.line_datas].count(True)
                )

                # Subtract empty lines if not counting empty lines
                empty_lines_subtract = (
                    0
                    if getattr(self.args, "empty_lines", False)
                    else len([bl.line for bl in b.line_datas if not bl.line.strip()])
                )

                line_count = total_line_count - comment_lines_subtract - empty_lines_subtract

                author2line_count[author] += line_count

                # Update statistics if author not filtered
                if not person.filter_matched:
                    if fstr not in target[author]:
                        from gigui.core.statistics import FileStat

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
        comment_ok: bool = getattr(self.args, "comments", False) or not d.is_comment
        empty_ok: bool = getattr(self.args, "empty_lines", False) or d.line.strip() != ""
        author_ok: bool = b.author not in getattr(self.args, "ex_authors", [])
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

    def __init__(self, ini_repo) -> None:
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
            historical_lines = {bl.line.strip() for b in historical_blames for bl in b.line_datas}

            if not historical_lines:
                stability_metrics[sha] = 0.0
                continue

            # Calculate percentage of historical lines still present
            preserved_lines = current_lines.intersection(historical_lines)
            stability_percentage = (len(preserved_lines) / len(historical_lines)) * 100
            stability_metrics[sha] = stability_percentage

        return stability_metrics
