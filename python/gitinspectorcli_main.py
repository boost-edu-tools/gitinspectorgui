#!/usr/bin/env python3
"""
Standalone entry point for GitInspectorCLI.

This module provides a standalone CLI entry point that can be packaged
as an executable using PyInstaller without relative import issues.
"""

import argparse
import json
import sys
from pathlib import Path

# Add the current directory to Python path for imports
sys.path.insert(0, str(Path(__file__).parent))

from gigui.api.main import GitInspectorAPI
from gigui.api.types import Settings


def create_parser() -> argparse.ArgumentParser:
    """Create the command-line argument parser."""
    parser = argparse.ArgumentParser(
        description="GitInspectorCLI - Modern git repository analysis tool"
    )

    parser.add_argument("repositories", nargs="*", help="Repository paths to analyze")

    parser.add_argument(
        "--depth",
        type=int,
        default=3,
        help="Maximum directory depth to search for repositories (default: 3)",
    )

    parser.add_argument(
        "--n-files",
        type=int,
        default=100,
        help="Maximum number of files to analyze per repository (default: 100)",
    )

    parser.add_argument(
        "--include-files",
        nargs="*",
        default=[],
        help="File patterns to include in analysis",
    )

    parser.add_argument(
        "--exclude-files",
        nargs="*",
        default=[],
        help="File patterns to exclude from analysis",
    )

    parser.add_argument(
        "--exclude-authors",
        nargs="*",
        default=[],
        help="Author patterns to exclude from analysis",
    )

    parser.add_argument(
        "--exclude-emails",
        nargs="*",
        default=[],
        help="Email patterns to exclude from analysis",
    )

    parser.add_argument(
        "--copy-move",
        type=int,
        choices=[0, 1, 2, 3],
        default=0,
        help="Copy/move detection: 0=None, 1=Copy, 2=Move, 3=Both (default: 0)",
    )

    parser.add_argument(
        "--scaled-percentages",
        action="store_true",
        help="Use scaled percentages in output",
    )

    parser.add_argument(
        "--blame-exclusions", action="store_true", help="Enable blame exclusions"
    )

    parser.add_argument(
        "--dynamic-blame-history",
        action="store_true",
        help="Enable dynamic blame history",
    )

    parser.add_argument(
        "--dry-run", action="store_true", help="Perform a dry run (preview only)"
    )

    parser.add_argument(
        "--output-format",
        choices=["json", "table"],
        default="table",
        help="Output format (default: table)",
    )

    parser.add_argument("--version", action="version", version="GitInspectorCLI 0.5.0")

    return parser


def format_table_output(result):
    """Format analysis result as a table."""
    if not result.success:
        print(f"Error: {result.error}", file=sys.stderr)
        return

    for repo in result.repositories:
        print(f"\n=== Repository: {repo.name} ===")
        print(f"Path: {repo.path}")

        # Authors table
        print(f"\n--- Authors ({len(repo.authors)}) ---")
        if repo.authors:
            print(f"{'Name':<20} {'Email':<25} {'Commits':<8} {'Files':<6} {'%':<6}")
            print("-" * 70)
            for author in repo.authors:
                print(
                    f"{author.name:<20} {author.email:<25} {author.commits:<8} {author.files:<6} {author.percentage:<6.1f}"
                )

        # Files table
        print(f"\n--- Files ({len(repo.files)}) ---")
        if repo.files:
            print(f"{'Name':<25} {'Lines':<8} {'Commits':<8} {'Authors':<8} {'%':<6}")
            print("-" * 60)
            for file in repo.files:
                print(
                    f"{file.name:<25} {file.lines:<8} {file.commits:<8} {file.authors:<8} {file.percentage:<6.1f}"
                )


def main():
    """Main CLI entry point."""
    parser = create_parser()
    args = parser.parse_args()

    # Create settings from command-line arguments
    settings = Settings(
        input_fstrs=args.repositories,
        depth=args.depth,
        n_files=args.n_files,
        include_files=args.include_files,
        ex_files=args.exclude_files,
        ex_authors=args.exclude_authors,
        ex_emails=args.exclude_emails,
        ex_revisions=[],
        ex_messages=[],
        copy_move=args.copy_move,
        scaled_percentages=args.scaled_percentages,
        blame_exclusions="show" if args.blame_exclusions else "hide",
        view="dynamic-blame-history" if args.dynamic_blame_history else "auto",
        dryrun=1 if args.dry_run else 0,
    )

    if not settings.input_fstrs:
        print("Error: No repositories specified", file=sys.stderr)
        parser.print_help()
        sys.exit(1)

    # Execute analysis
    api = GitInspectorAPI()
    result = api.execute_analysis(settings)

    # Output results
    if args.output_format == "json":
        from dataclasses import asdict

        print(json.dumps(asdict(result), indent=2))
    else:
        format_table_output(result)

    if not result.success:
        sys.exit(1)


if __name__ == "__main__":
    main()
