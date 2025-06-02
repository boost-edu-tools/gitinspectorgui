"""
Main Analysis Orchestrator for GitInspectorGUI.

This module provides the central coordination engine for complete repository analysis.
The RepoData class orchestrates all analysis components, manages statistics table generation,
calculates percentages, and produces comprehensive final results.

Migrated from gitinspectorgui-old/src/gigui/repo_data.py with enhanced type safety,
performance optimizations, and compatibility with the new architecture.

Key Features:
- Complete analysis workflow orchestration
- Statistics table generation (author2fstr2fstat, fstr2fstat, etc.)
- Percentage calculations for insertions, deletions, and lines
- Result aggregation and final data preparation
- Integration with blame analysis and repository base classes
- Performance monitoring and progress tracking
- Advanced data structure management and conversion

Classes:
    RepoData: Main analysis orchestrator coordinating complete workflow
    StatTables: Statistics table generation and management engine
"""

from logging import getLogger
from pathlib import Path
from typing import TypeVar

from gigui.data import CommitGroup, FileStat, IniRepo, Person, PersonStat
from gigui.person_data import PersonsDB
from gigui.repo_blame import RepoBlameHistory
from gigui.typedefs import SHA, Author, FileStr, PercentageValue

logger = getLogger(__name__)


def divide_to_percentage(dividend: int, divisor: int) -> PercentageValue:
    """
    Calculate percentage from dividend and divisor with proper handling of edge cases.
    
    Provides robust percentage calculation that handles zero divisors and
    returns NaN for invalid calculations.
    
    Args:
        dividend: Numerator value
        divisor: Denominator value
        
    Returns:
        Percentage value or NaN if calculation is invalid
    """
    if dividend and divisor:
        return round(dividend / divisor * 100)
    else:
        return float("NaN")


class RepoData(RepoBlameHistory):
    """
    Main Analysis Orchestrator coordinating complete repository analysis workflow.
    
    This class serves as the central coordinator for the entire analysis engine,
    managing the complete workflow from initial repository setup through final
    result generation. It orchestrates all analysis components and produces
    comprehensive statistics tables.
    
    Key Responsibilities:
    - Coordinate complete analysis workflow
    - Generate and manage all statistics tables
    - Calculate percentages and final metrics
    - Integrate blame analysis with repository data
    - Manage author and file statistics
    - Provide sorted and filtered result sets
    
    Attributes:
        path: Resolved repository path
        pathstr: String representation of repository path
        stat_tables: Statistics table generation engine
        author2fstr2fstat: Author to file to file statistics mapping
        fstr2author2fstat: File to author to file statistics mapping
        author2pstat: Author to person statistics mapping
        authors_included: Sorted list of included authors
        fr2f2a2shas: File rename to file to author to SHAs mapping
        fstr2shas: File to SHAs mapping for blame history
        author2nr: Author to number mapping (excluding "*")
        author_star2nr: Author to number mapping (including "*")
        sha2author_nr: SHA to author number mapping
    """
    
    def __init__(self, ini_repo: IniRepo) -> None:
        """
        Initialize the main analysis orchestrator.
        
        Sets up all data structures and executes comprehensive analysis
        workflow coordination.
        
        Args:
            ini_repo: Initial repository configuration
        """
        super().__init__(ini_repo)

        self.path = Path(ini_repo.location).resolve()
        self.pathstr = str(self.path)

        self.stat_tables = StatTables()

        # Core statistics tables
        self.author2fstr2fstat: dict[Author, dict[FileStr, FileStat]] = {}
        self.fstr2author2fstat: dict[FileStr, dict[Author, FileStat]] = {}
        self.author2pstat: dict[Author, PersonStat] = {}

        # Sorted list of non-excluded authors, valid only after self.run has been called
        self.authors_included: list[Author] = []

        # Advanced data structures for blame history and analysis
        self.fr2f2a2shas: dict[FileStr, dict[FileStr, dict[Author, list[SHA]]]] = {}

        # Valid only after self.run has been called for static or dynamic blame history formats
        self.fstr2shas: dict[FileStr, list[SHA]] = {}

        # Author numbering systems
        self.author2nr: dict[Author, int] = {}  # does not include "*" as author
        self.author_star2nr: dict[Author, int] = {}  # includes "*" as author

        # SHA to author number mapping
        self.sha2author_nr: dict[SHA, int] = {}
        
        # Execute the analysis workflow automatically
        self.run_analysis()

    def run_analysis(self) -> bool:
        """
        Execute the complete analysis workflow and generate comprehensive statistics.

        Orchestrates the entire analysis process from repository initialization
        through final data preparation. This is the main entry point for
        complete repository analysis.

        Returns:
            bool: True after successful execution, False if no stats have been found
        """
        try:
            if self.args.dryrun == 2:
                return True
            
            # Initialize repository and run base analysis
            self.init_git_repo()
            self.run_base()
            self.run_blame()
            
            # Execute core analysis workflow
            success = self._run_no_history()
            if not success:
                return False
            
            # Finalize data structures and prepare results
            self._set_final_data()
            return True
        finally:
            if self.args.dryrun <= 1:
                self.git_repo.close()

    def _run_no_history(self) -> bool:
        """
        Execute core analysis workflow without history processing.
        
        Generates all primary statistics tables and calculates percentages
        for comprehensive repository analysis.
        
        Returns:
            bool: True if analysis successful, False if no valid data found
        """
        if self.args.dryrun == 2:
            return True

        # Generate primary statistics table: author2fstr2fstat
        # This is the foundation for all other statistical calculations
        self.author2fstr2fstat = self.stat_tables.get_author2fstr2fstat(
            self.fstrs,
            self.fstr2commit_groups,
            self.persons_db,
        )
        
        # Check if we have valid data (more than just the "*" wildcard entry)
        if list(self.author2fstr2fstat.keys()) == ["*"]:
            return False

        # Update author2fstr2fstat with line counts for each author
        self.author2fstr2fstat = self.update_author2fstr2fstat(self.author2fstr2fstat)

        # Generate file statistics table
        self.fstr2fstat = self.stat_tables.get_fstr2fstat(
            self.author2fstr2fstat, self.fstr2commit_groups
        )

        # Validate file statistics
        if list(self.fstr2fstat.keys()) == ["*"]:
            return False

        # Generate inverted statistics table: file to author mapping
        self.fstr2author2fstat = self.stat_tables.get_fstr2author2fstat(
            self.author2fstr2fstat
        )

        # Generate person statistics table
        self.author2pstat = self.stat_tables.get_author2pstat(
            self.author2fstr2fstat, self.persons_db
        )

        # Calculate percentages for all statistics tables
        total_insertions = self.author2pstat["*"].stat.insertions
        total_lines = self.author2pstat["*"].stat.blame_line_count

        # Apply percentage calculations to all statistics tables
        self.stat_tables.calculate_percentages(
            self.fstr2fstat, total_insertions, total_lines
        )
        self.stat_tables.calculate_percentages(
            self.author2pstat, total_insertions, total_lines
        )
        
        # Calculate percentages for nested statistics tables
        for _, fstr2fstat in self.author2fstr2fstat.items():
            self.stat_tables.calculate_percentages(
                fstr2fstat, total_insertions, total_lines
            )
        for _, author2fstat in self.fstr2author2fstat.items():
            self.stat_tables.calculate_percentages(
                author2fstat, total_insertions, total_lines
            )
        
        return True

    def _set_final_data(self) -> None:
        """
        Finalize all data structures and prepare comprehensive results.
        
        Performs final data processing including author mapping updates,
        SHA organization, author sorting, and numbering system setup.
        This method prepares all data for final output generation.
        """
        # Update self.sha2author with new author definitions from person database
        sha2author: dict[SHA, Author] = {}
        for sha, author in self.sha2author.items():
            new_author = self.persons_db[author].author
            sha2author[sha] = new_author
        self.sha2author = sha2author

        # Process file rename and SHA mappings
        for fstr in self.fstrs:
            # Ensure every file has an entry in fr2f2shas for blame history calculation
            # This handles cases where no commit lines are found but the file exists
            if fstr not in self.fr2f2shas:
                self.fr2f2shas[fstr] = {}
                self.fr2f2shas[fstr][fstr] = []

            # Collect and sort all SHAs for this file
            shas_fr = set()
            for shas in self.fr2f2shas[fstr].values():
                shas_fr.update(shas)
            shas_fr_sorted = sorted(shas_fr, key=lambda x: self.sha2nr[x], reverse=True)
            self.fstr2shas[fstr] = shas_fr_sorted

        # Calculate sorted version of authors_included based on blame line count
        authors_included: list[Author] = self.persons_db.authors_included
        self.authors_included = sorted(
            authors_included,
            key=lambda x: self.author2pstat[x].stat.blame_line_count,
            reverse=True,
        )

        # Set up author numbering system (including "*" author)
        for i, author in enumerate(self.authors_included):
            self.author_star2nr[author] = i  # "*" author gets nr 0
        for author in self.persons_db.authors_excluded:
            self.author_star2nr[author] = 0

        # Set up author numbering system (excluding "*" author)
        self.author2nr = {k: v for k, v in self.author_star2nr.items() if k != "*"}

        # Map SHAs to author numbers
        for sha, author in self.sha2author.items():
            self.sha2author_nr[sha] = self.author2nr[author]

        # Filter authors to only those with actual file contributions
        authors_included_filtered: set = set()
        for author2fstat in self.fstr2author2fstat.values():
            authors = author2fstat.keys()
            authors_included_filtered.update(authors)

        # Final sort of included authors by blame line count
        self.authors_included = sorted(
            authors_included_filtered,
            key=lambda x: self.author2pstat[x].stat.blame_line_count,
            reverse=True,
        )

    @property
    def real_authors_included(self) -> list[Author]:
        """
        Get list of real authors (excluding the "*" wildcard author).
        
        Returns:
            List of actual author names without the special "*" entry
        """
        return [author for author in self.authors_included if not author == "*"]

    def fr2f2a2sha_set_to_list(
        self, source: dict[FileStr, dict[FileStr, dict[Author, set[SHA]]]]
    ) -> dict[FileStr, dict[FileStr, dict[Author, list[SHA]]]]:
        """
        Convert file rename to file to author to SHA sets into sorted lists.
        
        Transforms set-based SHA collections into sorted lists for consistent
        ordering and improved performance in downstream processing.
        
        Args:
            source: Source mapping with SHA sets
            
        Returns:
            Target mapping with sorted SHA lists
        """
        target: dict[FileStr, dict[FileStr, dict[Author, list[SHA]]]] = {}
        for fstr_root, fstr_root_dict in source.items():
            target[fstr_root] = {}
            for fstr, fstr_dict in fstr_root_dict.items():
                target[fstr_root][fstr] = {}
                for author, shas in fstr_dict.items():
                    person_author = self.persons_db[author].author
                    shas_sorted = sorted(
                        shas, key=lambda x: self.sha2nr[x], reverse=True
                    )
                    target[fstr_root][fstr][person_author] = shas_sorted
        return target

    def fr2f2sha_set_to_list(
        self, source: dict[FileStr, dict[FileStr, set[SHA]]]
    ) -> dict[FileStr, dict[FileStr, list[SHA]]]:
        """
        Convert file rename to file to SHA sets into sorted lists.
        
        Transforms set-based SHA collections into sorted lists for consistent
        ordering and improved performance.
        
        Args:
            source: Source mapping with SHA sets
            
        Returns:
            Target mapping with sorted SHA lists
        """
        target: dict[FileStr, dict[FileStr, list[SHA]]] = {}
        for fstr_root, fstr_root_dict in source.items():
            target[fstr_root] = {}
            for fstr, shas in fstr_root_dict.items():
                target[fstr_root][fstr] = sorted(
                    shas, key=lambda x: self.sha2nr[x], reverse=True
                )
        return target


class StatTables:
    """
    Statistics Table Generation and Management Engine.
    
    This class provides sophisticated algorithms for generating and managing
    all statistics tables used in repository analysis. It handles complex
    data transformations, aggregations, and percentage calculations.
    
    Key Features:
    - Author to file statistics table generation
    - File to statistics table generation
    - Inverted table generation (file to author mapping)
    - Person statistics aggregation
    - Percentage calculations for all metrics
    - Performance-optimized data processing
    """

    @staticmethod
    def get_author2fstr2fstat(
        fstrs: list[FileStr],
        fstr2commit_groups: dict[FileStr, list[CommitGroup]],
        persons_db: PersonsDB,
    ) -> dict[Author, dict[FileStr, FileStat]]:
        """
        Generate author to file to file statistics mapping.
        
        Creates the foundational statistics table that maps each author to
        their contributions across all files. This is the basis for all
        other statistical calculations.
        
        Args:
            fstrs: List of file strings to process
            fstr2commit_groups: Mapping of files to their commit groups
            persons_db: Person database for author resolution
            
        Returns:
            Comprehensive author to file to file statistics mapping
        """
        # Initialize with wildcard entries for totals
        target = {"*": {"*": FileStat("*")}}
        for author in persons_db.authors_included:
            target[author] = {"*": FileStat("*")}
        
        # Process commits from newest to oldest for accurate statistics
        for fstr in fstrs:
            for commit_group in fstr2commit_groups[fstr]:
                # Update global totals
                target["*"]["*"].stat.add_commit_group(commit_group)
                
                # Resolve author through person database
                author = persons_db[commit_group.author].author
                target[author]["*"].stat.add_commit_group(commit_group)
                
                # Create file-specific entry if needed
                if fstr not in target[author]:
                    target[author][fstr] = FileStat(fstr)
                target[author][fstr].add_commit_group(commit_group)
        
        return target

    @staticmethod
    def get_fstr2fstat(
        author2fstr2fstat: dict[Author, dict[FileStr, FileStat]],
        fstr2commit_group: dict[FileStr, list[CommitGroup]],
    ) -> dict[FileStr, FileStat]:
        """
        Generate file to file statistics mapping.
        
        Creates aggregated file statistics by combining contributions from
        all authors for each file. Includes rename tracking and comprehensive
        file history management.
        
        Args:
            author2fstr2fstat: Source author to file to file statistics mapping
            fstr2commit_group: File to commit groups mapping for name tracking
            
        Returns:
            Comprehensive file to file statistics mapping
        """
        source = author2fstr2fstat
        target: dict[FileStr, FileStat] = {}
        fstrs = set()
        
        # Aggregate statistics from all authors for each file
        for author, fstr2fstat in source.items():
            if author == "*":
                target["*"] = source["*"]["*"]
            else:
                for fstr, fstat in fstr2fstat.items():
                    if fstr != "*":
                        fstrs.add(fstr)
                        if fstr not in target:
                            target[fstr] = FileStat(fstr)
                        target[fstr].stat.add(fstat.stat)
        
        # Add file name history for rename tracking
        for fstr in fstrs:
            for commit_group in fstr2commit_group[fstr]:
                # Order of names must correspond to the order of the commits
                target[fstr].add_name(commit_group.fstr)
        
        return target

    @staticmethod
    def get_fstr2author2fstat(
        author2fstr2fstat: dict[Author, dict[FileStr, FileStat]],
    ) -> dict[FileStr, dict[Author, FileStat]]:
        """
        Generate inverted mapping: file to author to file statistics.
        
        Creates an inverted view of the author2fstr2fstat table for efficient
        file-centric analysis and reporting.
        
        Args:
            author2fstr2fstat: Source author to file to file statistics mapping
            
        Returns:
            Inverted file to author to file statistics mapping
        """
        source = author2fstr2fstat
        target: dict[FileStr, dict[Author, FileStat]] = {}
        
        for author, fstr2fstat in source.items():
            if author == "*":
                target["*"] = source["*"]
                continue
            
            for fstr, fstat in fstr2fstat.items():
                if fstr == "*":
                    continue
                
                # Initialize file entry with wildcard totals
                if fstr not in target:
                    target[fstr] = {"*": FileStat(fstr)}
                
                # Add author-specific statistics
                target[fstr][author] = fstat
                target[fstr]["*"].stat.add(fstat.stat)
                target[fstr]["*"].names = fstr2fstat[fstr].names
        
        return target

    @staticmethod
    def get_author2pstat(
        author2fstr2fstat: dict[Author, dict[FileStr, FileStat]], persons_db: PersonsDB
    ) -> dict[Author, PersonStat]:
        """
        Generate author to person statistics mapping.
        
        Creates comprehensive person statistics by aggregating all file
        contributions for each author. Combines identity information with
        statistical data.
        
        Args:
            author2fstr2fstat: Source author to file to file statistics mapping
            persons_db: Person database for identity resolution
            
        Returns:
            Comprehensive author to person statistics mapping
        """
        source = author2fstr2fstat
        target: dict[Author, PersonStat] = {}
        
        for author, fstr2fstat in source.items():
            if author == "*":
                # Handle wildcard totals
                target["*"] = PersonStat(Person("*", "*"))
                target["*"].stat = source["*"]["*"].stat
                continue
            
            # Create person statistics for real authors
            target[author] = PersonStat(persons_db[author])
            for fstr, fstat in fstr2fstat.items():
                if fstr == "*":
                    continue
                target[author].stat.add(fstat.stat)
        
        return target

    # Type variables for generic percentage calculation
    AuthorOrFileStr = TypeVar("AuthorOrFileStr", Author, FileStr)
    PersonStatOrFileStat = TypeVar("PersonStatOrFileStat", PersonStat, FileStat)

    @staticmethod
    def calculate_percentages(
        af2pf_stat: dict[AuthorOrFileStr, PersonStatOrFileStat],
        total_insertions: int,
        total_lines: int,
    ) -> None:
        """
        Calculate percentage values for insertions and lines across all statistics.
        
        Applies comprehensive percentage calculations to any statistics mapping,
        whether author-based or file-based. Updates the statistics objects in place
        with calculated percentage values.
        
        Args:
            af2pf_stat: Statistics mapping (author or file to statistics)
            total_insertions: Total insertions for percentage calculation
            total_lines: Total lines for percentage calculation
        """
        for af in af2pf_stat.keys():  # af is either an author or fstr
            af2pf_stat[af].stat.percent_insertions = divide_to_percentage(
                af2pf_stat[af].stat.insertions, total_insertions
            )
            af2pf_stat[af].stat.percent_lines = divide_to_percentage(
                af2pf_stat[af].stat.blame_line_count, total_lines
            )