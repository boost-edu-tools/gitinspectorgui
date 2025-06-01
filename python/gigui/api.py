"""
API module for GitInspectorGUI backend.

This module provides a JSON API interface for the Tauri frontend to communicate
with the Python backend for git repository analysis.
"""

import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class Settings:
    """Settings for git repository analysis."""
    # Repository and Input Settings
    input_fstrs: List[str]
    depth: int = 5
    subfolder: str = ""
    
    # File Analysis Settings
    n_files: int = 5
    include_files: List[str] = None
    ex_files: List[str] = None
    extensions: List[str] = None
    
    # Author and Commit Filtering
    ex_authors: List[str] = None
    ex_emails: List[str] = None
    ex_revisions: List[str] = None
    ex_messages: List[str] = None
    since: str = ""
    until: str = ""
    
    # Output and Format Settings
    outfile_base: str = "gitinspect"
    fix: str = "prefix"
    file_formats: List[str] = None
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
    authors: List[AuthorStat]
    files: List[FileStat]
    blame_data: List[BlameEntry]


@dataclass
class AnalysisResult:
    """Complete analysis results."""
    repositories: List[RepositoryResult]
    success: bool
    error: Optional[str] = None


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
                with open(self.settings_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return Settings(**data)
            except Exception as e:
                print(f"Error loading settings: {e}", file=sys.stderr)
        
        return Settings(input_fstrs=[])

    def save_settings(self, settings: Settings) -> None:
        """Save settings to file."""
        try:
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                json.dump(asdict(settings), f, indent=2)
        except Exception as e:
            print(f"Error saving settings: {e}", file=sys.stderr)
            raise

    def execute_analysis(self, settings: Settings) -> AnalysisResult:
        """Execute git repository analysis."""
        try:
            # For now, return mock data for the proof of concept
            # TODO: Integrate with actual git analysis logic from original gigui
            
            mock_repositories = []
            
            for i, repo_path in enumerate(settings.input_fstrs):
                repo_name = Path(repo_path).name or f"repo-{i+1}"
                
                # Mock data for demonstration
                authors = [
                    AuthorStat(
                        name="John Doe",
                        email="john@example.com",
                        commits=42,
                        insertions=1250,
                        deletions=340,
                        files=15,
                        percentage=65.5
                    ),
                    AuthorStat(
                        name="Jane Smith",
                        email="jane@example.com",
                        commits=28,
                        insertions=890,
                        deletions=210,
                        files=12,
                        percentage=34.5
                    )
                ]
                
                files = [
                    FileStat(
                        name="main.py",
                        path="src/main.py",
                        lines=245,
                        commits=18,
                        authors=2,
                        percentage=25.3
                    ),
                    FileStat(
                        name="utils.py",
                        path="src/utils.py",
                        lines=156,
                        commits=12,
                        authors=2,
                        percentage=16.1
                    )
                ]
                
                blame_data = [
                    BlameEntry(
                        file="src/main.py",
                        line_number=1,
                        author="John Doe",
                        commit="abc123",
                        date="2024-01-15",
                        content="#!/usr/bin/env python3"
                    ),
                    BlameEntry(
                        file="src/main.py",
                        line_number=2,
                        author="Jane Smith",
                        commit="def456",
                        date="2024-01-16",
                        content="import sys"
                    )
                ]
                
                mock_repositories.append(RepositoryResult(
                    name=repo_name,
                    path=repo_path,
                    authors=authors,
                    files=files,
                    blame_data=blame_data
                ))
            
            return AnalysisResult(
                repositories=mock_repositories,
                success=True
            )
            
        except Exception as e:
            return AnalysisResult(
                repositories=[],
                success=False,
                error=str(e)
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
    
    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()