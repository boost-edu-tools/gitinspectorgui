#!/usr/bin/env python3
"""Quick diagnosis runner for GitInspectorGUI timeout issue."""

import subprocess
import sys
from pathlib import Path


def main() -> None:
    print("GitInspectorGUI Timeout Diagnosis")
    print("=" * 40)

    # Check if a test repository path is provided
    if len(sys.argv) > 1:
        repo_path = sys.argv[1]
    else:
        # Use current directory as test repository
        repo_path = str(Path.cwd())
        print(f"No repository specified, using current directory: {repo_path}")

    # Check if it's a git repository
    if not (Path(repo_path) / ".git").exists():
        print(f"❌ {repo_path} is not a git repository")
        print("Please provide a path to a git repository:")
        print("  python run_diagnosis.py /path/to/git/repo")
        sys.exit(1)

    print(f"Testing repository: {repo_path}")
    print()

    # Run the diagnosis script
    try:
        # Get the directory where this script is located
        script_dir = Path(__file__).parent
        diagnosis_script = script_dir / "test_timeout_diagnosis.py"

        result = subprocess.run(
            [sys.executable, str(diagnosis_script), repo_path], check=False
        )

        if result.returncode == 0:
            print("\n✅ Diagnosis completed successfully!")
        else:
            print(f"\n❌ Diagnosis failed with return code: {result.returncode}")

    except Exception as e:
        print(f"❌ Failed to run diagnosis: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
