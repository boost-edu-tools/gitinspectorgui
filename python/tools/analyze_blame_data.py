#!/usr/bin/env python3
"""
Analyze blame data structure to verify commit information correctness
"""

import sys
import os
from pathlib import Path
from collections import Counter
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gigui.api import GitInspectorAPI


def analyze_blame_data(repo_path):
    """Analyze blame data structure and commit distribution"""
    print(f"Analyzing blame data for repository: {repo_path}")
    print("=" * 60)

    # Initialize API
    api = GitInspectorAPI()

    # Create settings object
    from gigui.api_types import Settings

    settings = Settings(input_fstrs=[repo_path])

    # Execute analysis
    result = api.execute_analysis(settings)

    if not result.success:
        print("❌ Analysis failed")
        return

    repositories = result.repositories
    if not repositories:
        print("❌ No repositories in result")
        return

    repo = repositories[0]
    blame_data = repo.blame_data

    print(f"📊 Total blame entries: {len(blame_data)}")
    print()

    if not blame_data:
        print("❌ No blame data found")
        return

    # Analyze commit distribution
    commit_counter = Counter()
    date_counter = Counter()
    file_counter = Counter()

    print("🔍 First 10 blame entries:")
    for i, entry in enumerate(blame_data[:10]):
        commit = entry.commit
        date = entry.date
        file_path = entry.file
        line = entry.line_number

        print(
            f"  {i + 1:2d}. Commit: {commit[:12]}... Date: {date} File: {file_path} Line: {line}"
        )

        commit_counter[commit] += 1
        date_counter[date] += 1
        file_counter[file_path] += 1

    print()
    print("🔍 Last 10 blame entries:")
    for i, entry in enumerate(blame_data[-10:], len(blame_data) - 10):
        commit = entry.commit
        date = entry.date
        file_path = entry.file
        line = entry.line_number

        print(
            f"  {i + 1:2d}. Commit: {commit[:12]}... Date: {date} File: {file_path} Line: {line}"
        )

        commit_counter[commit] += 1
        date_counter[date] += 1
        file_counter[file_path] += 1

    print()
    print("📈 Commit distribution (top 10):")
    for commit, count in commit_counter.most_common(10):
        print(f"  {commit[:12]}...: {count} lines")

    print()
    print("📅 Date distribution (top 10):")
    for date, count in date_counter.most_common(10):
        print(f"  {date}: {count} lines")

    print()
    print("📁 File distribution (top 10):")
    for file_path, count in file_counter.most_common(10):
        print(f"  {file_path}: {count} lines")

    # Check for patterns
    print()
    print("🔍 Data quality checks:")

    # Check for fake commits
    fake_commits = [
        commit
        for commit in commit_counter.keys()
        if commit.startswith("legacy_commit_")
    ]
    if fake_commits:
        print(f"  ❌ Found {len(fake_commits)} fake commits: {fake_commits[:5]}...")
    else:
        print("  ✅ No fake commits found")

    # Check for today's date
    today = datetime.now().strftime("%Y-%m-%d")
    today_count = date_counter.get(today, 0)
    if today_count > 0:
        print(f"  ⚠️  Found {today_count} entries with today's date ({today})")
    else:
        print(f"  ✅ No entries with today's date ({today})")

    # Check commit SHA format
    valid_shas = sum(
        1
        for commit in commit_counter.keys()
        if len(commit) >= 7 and all(c in "0123456789abcdef" for c in commit.lower())
    )
    print(f"  📝 Valid SHA format: {valid_shas}/{len(commit_counter)} commits")

    print()
    print("🎯 Sample middle entries (around position 370):")
    middle_start = max(0, len(blame_data) // 2 - 5)
    middle_end = min(len(blame_data), middle_start + 10)

    for i in range(middle_start, middle_end):
        entry = blame_data[i]
        commit = entry.commit
        date = entry.date
        file_path = entry.file
        line = entry.line_number

        print(
            f"  {i + 1:3d}. Commit: {commit[:12]}... Date: {date} File: {file_path} Line: {line}"
        )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze_blame_data.py <repository_path>")
        sys.exit(1)

    repo_path = sys.argv[1]
    if not os.path.exists(repo_path):
        print(f"Error: Repository path does not exist: {repo_path}")
        sys.exit(1)

    analyze_blame_data(repo_path)
