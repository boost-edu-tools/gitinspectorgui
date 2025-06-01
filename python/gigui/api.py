# Allow print statements: (Updated for clean author names)
# Lines 272, 282, 292, 300: Required for JSON output to stdout (API responses)
# Lines 263, 276, 286: Required for usage messages to stderr
# Lines 155, 165, 295: Error messages to stderr
# ruff: noqa: T201
"""
API module for GitInspectorGUI backend.

This module provides a JSON API interface for the Tauri frontend to communicate
with the Python backend for git repository analysis.
"""

import json
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from math import floor

from .typedefs import Author, Email, FileStr, SHA, OID

# Constants for time calculations
NOW = int(time.time())
SECONDS_IN_DAY = 86400
DAYS_IN_YEAR = 365.25
DAYS_IN_MONTH = 30.44



@dataclass
class Settings:
    """Settings for git repository analysis."""
    # Repository and Input Settings
    input_fstrs: list[str]
    depth: int = 5
    subfolder: str = ""

    # File Analysis Settings
    n_files: int = 5
    include_files: list[str] = None
    ex_files: list[str] = None
    extensions: list[str] = None

    # Author and Commit Filtering
    ex_authors: list[str] = None
    ex_emails: list[str] = None
    ex_revisions: list[str] = None
    ex_messages: list[str] = None
    since: str = ""
    until: str = ""

    # Output and Format Settings
    outfile_base: str = "gitinspect"
    fix: str = "prefix"
    file_formats: list[str] = None
    view: str = "auto"

    # Analysis Options
    copy_move: int = 1
    scaled_percentages: bool = False
    blame_exclusions: str = "hide"
    blame_skip: bool = False
    show_renames: bool = False

    # Content Analysis
    deletions: bool = False
    whitespace: bool = False
    empty_lines: bool = False
    comments: bool = False

    # Performance Settings
    multithread: bool = True
    multicore: bool = False
    verbosity: int = 0

    # Development/Testing
    dryrun: int = 0

    # GUI-specific
    gui_settings_full_path: bool = False
    col_percent: int = 75

    def __post_init__(self):
        """Initialize empty lists for None values."""
        if self.include_files is None:
            self.include_files = []
        if self.ex_files is None:
            self.ex_files = []
        if self.extensions is None:
            self.extensions = ["c", "cc", "cif", "cpp", "glsl", "h", "hh", "hpp", "java", "js", "py", "rb", "sql", "ts"]
        if self.file_formats is None:
            self.file_formats = ["html"]
        if self.ex_authors is None:
            self.ex_authors = []
        if self.ex_emails is None:
            self.ex_emails = []
        if self.ex_revisions is None:
            self.ex_revisions = []
        if self.ex_messages is None:
            self.ex_messages = []


@dataclass
class AuthorStat:
    """Statistics for a single author."""
    name: str
    email: str
    commits: int
    insertions: int
    deletions: int
    files: int
    percentage: float
    age: str = ""  # New field for age information


@dataclass
class FileStat:
    """Statistics for a single file."""
    name: str
    path: str
    lines: int
    commits: int
    authors: int
    percentage: float


@dataclass
class BlameEntry:
    """A single blame entry."""
    file: str
    line_number: int
    author: str
    commit: str
    date: str
    content: str


@dataclass
class RepositoryResult:
    """Analysis results for a single repository."""
    name: str
    path: str
    authors: list[AuthorStat]
    files: list[FileStat]
    blame_data: list[BlameEntry]


@dataclass
class AnalysisResult:
    """Complete analysis results."""
    repositories: list[RepositoryResult]
    success: bool
    error: str | None = None


@dataclass
class CommitGroup:
    """A CommitGroup holds the sum of commit data for commits that share the same person author and file name."""
    fstr: FileStr
    author: Author
    insertions: int
    deletions: int
    date_sum: int
    shas: set[SHA]


class Stat:
    """Statistics for commits, insertions, deletions, and blame data."""
    
    def __init__(self) -> None:
        self.shas: set[SHA] = set()  # Use to calculate the number of commits as len(shas)
        self.insertions: int = 0
        self.deletions: int = 0
        self.date_sum: int = 0  # Sum of Unix timestamps in seconds
        self.blame_line_count: int = 0
        self.percent_insertions: float = 0
        self.percent_deletions: float = 0
        self.percent_lines: float = 0

    @property
    def stability(self) -> int | str:
        """Calculate stability as percentage of blame lines vs insertions."""
        return (
            min(100, round(100 * self.blame_line_count / self.insertions))
            if self.insertions and self.blame_line_count
            else ""
        )

    @property
    def age(self) -> str:
        """Calculate average age of commits."""
        return (
            self.timestamp_to_age(round(self.date_sum / self.insertions))
            if self.insertions > 0
            else ""
        )

    def add(self, other: "Stat"):
        """Add another Stat object to this one."""
        self.shas = self.shas | other.shas
        self.insertions = self.insertions + other.insertions
        self.deletions = self.deletions + other.deletions
        self.date_sum = self.date_sum + other.date_sum
        self.blame_line_count = self.blame_line_count + other.blame_line_count

    def add_commit_group(self, commit_group: CommitGroup):
        """Add a CommitGroup to this Stat."""
        self.shas |= commit_group.shas
        self.insertions += commit_group.insertions
        self.deletions += commit_group.deletions
        self.date_sum += commit_group.date_sum

    @staticmethod
    def timestamp_to_age(time_stamp: int) -> str:
        """Convert Unix timestamp to human-readable age string."""
        seconds: int = NOW - time_stamp
        days: float = seconds / SECONDS_IN_DAY
        years: int = floor(days / DAYS_IN_YEAR)
        remaining_days: float = days - years * DAYS_IN_YEAR
        months: int = floor(remaining_days / DAYS_IN_MONTH)
        remaining_days = round(remaining_days - months * DAYS_IN_MONTH)
        if years:
            return f"{years}:{months:02}:{remaining_days:02}"
        else:
            return f"{months:02}:{remaining_days:02}"


class Person:
    """Represents a person (author) with multiple possible names and emails."""
    
    show_renames: bool = False
    ex_author_patterns: list[str] = []
    ex_email_patterns: list[str] = []

    def __init__(self, author: Author, email: Email):
        self.authors: set[Author] = {author}
        self.emails: set[Email] = {email}
        self.author: Author = self.get_author()
        
        # If any of the filters match, this will be set to True
        # so that the person will be excluded from the output.
        self.filter_matched: bool = False
        
        self.match_author_filter(author)
        self.match_email_filter(email)

    def match_author_filter(self, author: str):
        """Check if author matches exclusion patterns."""
        self.find_filter_match(self.ex_author_patterns, author)

    def match_email_filter(self, email: str):
        """Check if email matches exclusion patterns."""
        self.find_filter_match(self.ex_email_patterns, email)

    def find_filter_match(self, patterns: list[str], author_or_email: str):
        """Check if author or email matches any exclusion pattern."""
        from fnmatch import fnmatchcase
        if (
            not self.filter_matched
            and not author_or_email == "*"
            and any(
                fnmatchcase(author_or_email.lower(), pattern.lower())
                for pattern in patterns
            )
        ):
            self.filter_matched = True

    def merge(self, other: "Person") -> "Person":
        """Merge another person with this one."""
        self.authors |= other.authors
        if self.emails == {""}:
            self.emails = other.emails
        else:
            self.emails |= other.emails
        self.filter_matched = self.filter_matched or other.filter_matched
        self.author = self.get_author()
        return self

    def get_author(self) -> Author:
        """Get the best author name from available authors."""
        # Prefer authors with spaces (first and last name)
        nice_authors = {author for author in self.authors if " " in author}
        if nice_authors:
            return sorted(nice_authors)[0]
        return sorted(self.authors)[0] if self.authors else ""

    @property
    def authors_str(self) -> str:
        """Get formatted string of all author names."""
        return ", ".join(sorted(self.authors))

    @property
    def emails_str(self) -> str:
        """Get formatted string of all email addresses."""
        return ", ".join(sorted(self.emails))

    def __hash__(self) -> int:
        """Required for manipulating Person objects in a set."""
        return hash((frozenset(self.authors), frozenset(self.emails)))

    def __repr__(self):
        return f"Person({self.author}, {list(self.emails)[0] if self.emails else ''})"


class GitRepository:
    """Simple Git repository wrapper for basic operations."""
    
    def __init__(self, path: str):
        self.path = Path(path)
        self.name = self.path.name
        
    def is_git_repository(self) -> bool:
        """Check if the path is a git repository."""
        return (self.path / ".git").exists() or (self.path / ".git").is_file()
    
    def get_tracked_files(self) -> list[FileStr]:
        """Get list of tracked files in the repository."""
        import subprocess
        try:
            if not self.is_git_repository():
                return []
                
            result = subprocess.run(
                ["git", "ls-files"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
                return files[:50]  # Limit to first 50 files for demo
            return []
            
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            return []
    
    def get_commit_count(self) -> int:
        """Get total number of commits in the repository."""
        import subprocess
        try:
            if not self.is_git_repository():
                return 0
                
            result = subprocess.run(
                ["git", "rev-list", "--count", "HEAD"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                return int(result.stdout.strip())
            return 0
            
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError, ValueError):
            return 0
    
    def get_authors(self) -> list[str]:
        """Get list of authors who have committed to this repository."""
        import subprocess
        try:
            if not self.is_git_repository():
                return []
                
            result = subprocess.run(
                ["git", "log", "--format=%an <%ae>"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                authors = list(set(line.strip() for line in result.stdout.split('\n') if line.strip()))
                return authors[:10]  # Limit to first 10 authors for demo
            return []
            
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            return []
    
    def get_author_stats(self) -> dict[str, dict]:
        """Get detailed statistics for each author."""
        import subprocess
        try:
            if not self.is_git_repository():
                return {}
                
            # Get commit stats per author
            result = subprocess.run(
                ["git", "log", "--format=%an <%ae>|%H|%ct", "--numstat"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return {}
            
            author_stats = {}
            current_author = None
            current_commit = None
            current_timestamp = None
            
            for line in result.stdout.split('\n'):
                line = line.strip()
                if not line:
                    continue
                    
                if '|' in line and len(line.split('|')) == 3:
                    # Author line: "Name <email>|commit_hash|timestamp"
                    parts = line.split('|')
                    current_author = parts[0]
                    current_commit = parts[1]
                    current_timestamp = int(parts[2])
                    
                    if current_author not in author_stats:
                        author_stats[current_author] = {
                            'commits': set(),
                            'insertions': 0,
                            'deletions': 0,
                            'files': set(),
                            'timestamps': []
                        }
                    
                    author_stats[current_author]['commits'].add(current_commit)
                    author_stats[current_author]['timestamps'].append(current_timestamp)
                    
                elif current_author and '\t' in line:
                    # Stat line: "insertions\tdeletions\tfilename"
                    parts = line.split('\t')
                    if len(parts) >= 3:
                        try:
                            insertions = int(parts[0]) if parts[0] != '-' else 0
                            deletions = int(parts[1]) if parts[1] != '-' else 0
                            filename = parts[2]
                            
                            author_stats[current_author]['insertions'] += insertions
                            author_stats[current_author]['deletions'] += deletions
                            author_stats[current_author]['files'].add(filename)
                        except ValueError:
                            continue
            
            # Convert sets to counts and calculate percentages
            total_commits = sum(len(stats['commits']) for stats in author_stats.values())
            
            for author, stats in author_stats.items():
                stats['commit_count'] = len(stats['commits'])
                stats['file_count'] = len(stats['files'])
                stats['percentage'] = (stats['commit_count'] / total_commits * 100) if total_commits > 0 else 0
                
                # Calculate age from oldest commit
                if stats['timestamps']:
                    oldest_timestamp = min(stats['timestamps'])
                    stats['age'] = Stat.timestamp_to_age(oldest_timestamp)
                else:
                    stats['age'] = "0:00:00"
            
            return author_stats
            
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError, ValueError):
            return {}


class GitInspectorAPI:
    """Main API class for git repository analysis."""

    def __init__(self):
        """Initialize the API."""
        self.settings_file = Path.home() / ".gitinspectorgui" / "settings.json"
        self.settings_file.parent.mkdir(exist_ok=True)

    def get_settings(self) -> Settings:
        """Load settings from file or return defaults."""
        if self.settings_file.exists():
            try:
                with self.settings_file.open(encoding="utf-8") as f:
                    data = json.load(f)
                return Settings(**data)
            except (json.JSONDecodeError, OSError, TypeError) as e:
                print(f"Error loading settings: {e}", file=sys.stderr)

        return Settings(input_fstrs=[])

    def save_settings(self, settings: Settings) -> None:
        """Save settings to file."""
        try:
            with self.settings_file.open("w", encoding="utf-8") as f:
                json.dump(asdict(settings), f, indent=2)
        except OSError as e:
            print(f"Error saving settings: {e}", file=sys.stderr)
            raise

    def execute_analysis(self, settings: Settings) -> AnalysisResult:
        """Execute git repository analysis."""
        try:
            # Step 3: Real Git Analysis with fallback to mock data
            repositories = []

            for i, repo_path in enumerate(settings.input_fstrs):
                repo_name = Path(repo_path).name or f"repo-{i+1}"
                
                # Try to analyze real git repository
                git_repo = GitRepository(repo_path)
                
                if git_repo.is_git_repository():
                    # Real git repository - get actual data
                    real_files = git_repo.get_tracked_files()
                    author_stats = git_repo.get_author_stats()
                    commit_count = git_repo.get_commit_count()
                    
                    # Convert real author stats to our format
                    authors = []
                    for author_email, stats in list(author_stats.items())[:5]:  # Limit to 5 authors
                        # Parse "Name <email>" format
                        if '<' in author_email and '>' in author_email:
                            name = author_email.split('<')[0].strip()
                            email = author_email.split('<')[1].split('>')[0].strip()
                        else:
                            name = author_email
                            email = "unknown@example.com"
                        
                        authors.append(AuthorStat(
                            name=name,
                            email=email,
                            commits=stats['commit_count'],
                            insertions=stats['insertions'],
                            deletions=stats['deletions'],
                            files=stats['file_count'],
                            percentage=round(stats['percentage'], 1),
                            age=stats['age']
                        ))
                    
                    # Convert real files to our format
                    files = []
                    for j, file_path in enumerate(real_files[:5]):  # Limit to 5 files
                        files.append(FileStat(
                            name=Path(file_path).name,
                            path=file_path,
                            lines=100 + j * 50,  # Estimated
                            commits=5 + j * 2,   # Estimated
                            authors=min(len(author_stats), 3),
                            percentage=round(20 - j * 2, 1)
                        ))
                    
                    # Create realistic blame data from real files
                    blame_data = []
                    for j, file_path in enumerate(real_files[:3]):
                        if j < len(authors):
                            blame_data.append(BlameEntry(
                                file=file_path,
                                line_number=j + 1,
                                author=authors[j].name.split(' (Real')[0],  # Clean name
                                commit=f"real_commit_{j}",
                                date="2024-12-01",
                                content=f"# Real file: {file_path}"
                            ))
                    
                    # Add development mode indicator
                    blame_data.append(BlameEntry(
                        file="DEVELOPMENT_MODE",
                        line_number=1,
                        author="GitInspectorGUI",
                        commit="dev_mode",
                        date="2024-12-31",
                        content=f"🚀 REAL GIT REPOSITORY DETECTED: {commit_count} commits, {len(real_files)} files"
                    ))
                    
                else:
                    # Fallback to enhanced mock data for non-git paths
                    alice_person = Person("Alice Developer", "alice@company.com")
                    alice_person.merge(Person("A. Developer", "alice.dev@company.com"))
                    
                    bob_person = Person("Bob Engineer", "bob@company.com")
                    bob_person.merge(Person("Robert Engineer", "bob.engineer@company.com"))
                    
                    charlie_person = Person("Charlie Contributor", "charlie@opensource.org")
                    
                    # Create stats for each person
                    alice_stat = Stat()
                    alice_stat.insertions = 4250
                    alice_stat.deletions = 890
                    alice_stat.shas = {f"sha{i}" for i in range(156)}
                    alice_stat.date_sum = NOW * 156 - (86400 * 30 * 156)
                    
                    bob_stat = Stat()
                    bob_stat.insertions = 2890
                    bob_stat.deletions = 567
                    bob_stat.shas = {f"sha{i+200}" for i in range(98)}
                    bob_stat.date_sum = NOW * 98 - (86400 * 60 * 98)
                    
                    charlie_stat = Stat()
                    charlie_stat.insertions = 1890
                    charlie_stat.deletions = 234
                    charlie_stat.shas = {f"sha{i+400}" for i in range(67)}
                    charlie_stat.date_sum = NOW * 67 - (86400 * 90 * 67)
                    
                    authors = [
                        AuthorStat(
                            name=f"{alice_person.author} (Mock Data, Emails: {alice_person.emails_str})",
                            email=list(alice_person.emails)[0],
                            commits=len(alice_stat.shas),
                            insertions=alice_stat.insertions,
                            deletions=alice_stat.deletions,
                            files=28,
                            percentage=45.2,
                            age=alice_stat.age
                        ),
                        AuthorStat(
                            name=f"{bob_person.author} (Mock Data, Emails: {bob_person.emails_str})",
                            email=list(bob_person.emails)[0],
                            commits=len(bob_stat.shas),
                            insertions=bob_stat.insertions,
                            deletions=bob_stat.deletions,
                            files=22,
                            percentage=32.1,
                            age=bob_stat.age
                        ),
                        AuthorStat(
                            name=f"{charlie_person.author} (Mock Data)",
                            email=charlie_person.emails_str,
                            commits=len(charlie_stat.shas),
                            insertions=charlie_stat.insertions,
                            deletions=charlie_stat.deletions,
                            files=15,
                            percentage=22.7,
                            age=charlie_stat.age
                        )
                    ]

                files = [
                    FileStat(
                        name="main.py",
                        path="src/main.py",
                        lines=487,
                        commits=45,
                        authors=3,
                        percentage=28.5
                    ),
                    FileStat(
                        name="utils.py",
                        path="src/utils.py",
                        lines=324,
                        commits=32,
                        authors=3,
                        percentage=19.2
                    ),
                    FileStat(
                        name="config.py",
                        path="src/config.py",
                        lines=156,
                        commits=18,
                        authors=2,
                        percentage=12.8
                    ),
                    FileStat(
                        name="api.py",
                        path="src/api.py",
                        lines=298,
                        commits=28,
                        authors=2,
                        percentage=15.3
                    ),
                    FileStat(
                        name="tests.py",
                        path="tests/tests.py",
                        lines=234,
                        commits=22,
                        authors=3,
                        percentage=14.1
                    )
                ]

                blame_data = [
                    BlameEntry(
                        file="src/main.py",
                        line_number=1,
                        author="Alice Developer",
                        commit="a1b2c3d",
                        date="2024-12-01",
                        content="#!/usr/bin/env python3"
                    ),
                    BlameEntry(
                        file="src/main.py",
                        line_number=2,
                        author="Alice Developer",
                        commit="a1b2c3d",
                        date="2024-12-01",
                        content="\"\"\"Main application entry point.\"\"\""
                    ),
                    BlameEntry(
                        file="src/main.py",
                        line_number=3,
                        author="Bob Engineer",
                        commit="e4f5g6h",
                        date="2024-12-15",
                        content="import sys"
                    ),
                    BlameEntry(
                        file="src/utils.py",
                        line_number=1,
                        author="Charlie Contributor",
                        commit="i7j8k9l",
                        date="2024-11-20",
                        content="def calculate_statistics(data):"
                    ),
                    BlameEntry(
                        file="src/api.py",
                        line_number=1,
                        author="Alice Developer",
                        commit="m1n2o3p",
                        date="2024-12-20",
                        content="# Development Mode Active - Changes Visible Immediately!"
                    ),
                    BlameEntry(
                        file="src/config.py",
                        line_number=1,
                        author="Bob Engineer",
                        commit="q4r5s6t",
                        date="2024-12-10",
                        content="CONFIG = {'debug': True, 'dev_mode': True}"
                    )
                ]

                repositories.append(RepositoryResult(
                    name=repo_name,
                    path=repo_path,
                    authors=authors,
                    files=files,
                    blame_data=blame_data
                ))

            return AnalysisResult(
                repositories=repositories,
                success=True
            )

        except (TypeError, ValueError, AttributeError, KeyError, IndexError) as e:
            return AnalysisResult(
                repositories=[],
                success=False,
                error=f"Analysis error ({type(e).__name__}): {e}"
            )


def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) < 2:
        print("Usage: python api.py <command> [args...]", file=sys.stderr)
        sys.exit(1)

    api = GitInspectorAPI()
    command = sys.argv[1]

    try:
        if command == "get_settings":
            settings = api.get_settings()
            print(json.dumps(asdict(settings)))

        elif command == "save_settings":
            if len(sys.argv) < 3:
                print("Usage: python api.py save_settings <settings_json>", file=sys.stderr)
                sys.exit(1)

            settings_data = json.loads(sys.argv[2])
            settings = Settings(**settings_data)
            api.save_settings(settings)
            print(json.dumps({"success": True}))

        elif command == "execute_analysis":
            if len(sys.argv) < 3:
                print("Usage: python api.py execute_analysis <settings_json>", file=sys.stderr)
                sys.exit(1)

            settings_data = json.loads(sys.argv[2])
            settings = Settings(**settings_data)
            result = api.execute_analysis(settings)
            print(json.dumps(asdict(result)))

        else:
            print(f"Unknown command: {command}", file=sys.stderr)
            sys.exit(1)

    except (json.JSONDecodeError, TypeError, ValueError, KeyError) as e:
        error_result = {"success": False, "error": f"Command error ({type(e).__name__}): {e}"}
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
