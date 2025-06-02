#!/usr/bin/env python3
"""
Timeout diagnosis script for GitInspectorGUI.
Tests each component in isolation to identify the bottleneck.
"""

import time
import json
import requests
import subprocess
import sys
from pathlib import Path

def test_direct_python_api(repo_path: str):
    """Test the Python API directly (bypass FastAPI)"""
    print("=== Testing Direct Python API ===")
    start_time = time.time()
    
    try:
        # Get the directory where this script is located
        script_dir = Path(__file__).parent
        api_script = script_dir / "gigui" / "api.py"
        
        cmd = [
            sys.executable, str(api_script), "execute_analysis",
            json.dumps({"input_fstrs": [repo_path], "depth": 5})
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        duration = time.time() - start_time
        print(f"✅ Direct Python API: {duration:.2f}s")
        print(f"Return code: {result.returncode}")
        if result.stdout:
            print(f"Output length: {len(result.stdout)} chars")
        if result.stderr:
            print(f"Stderr: {result.stderr[:200]}...")
        return True, duration
        
    except subprocess.TimeoutExpired:
        duration = time.time() - start_time
        print(f"❌ Direct Python API: TIMEOUT after {duration:.2f}s")
        return False, duration
    except Exception as e:
        duration = time.time() - start_time
        print(f"❌ Direct Python API: ERROR after {duration:.2f}s - {e}")
        return False, duration

def test_fastapi_server(repo_path: str, server_url: str = "http://127.0.0.1:8080"):
    """Test the FastAPI server directly (bypass Tauri)"""
    print("=== Testing FastAPI Server ===")
    start_time = time.time()
    
    try:
        # Test health endpoint first
        health_response = requests.get(f"{server_url}/health", timeout=5)
        print(f"Health check: {health_response.status_code}")
        
        # Test analysis endpoint
        payload = {
            "input_fstrs": [repo_path],
            "depth": 5,
            "n_files": 5,
            "include_files": [],
            "ex_files": [],
            "extensions": ["py", "js", "ts"],
            "ex_authors": [],
            "ex_emails": [],
            "ex_revisions": [],
            "ex_messages": [],
            "since": "",
            "until": "",
            "outfile_base": "gitinspect",
            "fix": "prefix",
            "file_formats": ["html"],
            "view": "auto",
            "copy_move": 1,
            "scaled_percentages": False,
            "blame_exclusions": "hide",
            "blame_skip": False,
            "show_renames": False,
            "deletions": False,
            "whitespace": False,
            "empty_lines": False,
            "comments": False,
            "multithread": True,
            "multicore": False,
            "verbosity": 0,
            "dryrun": 0,
            "gui_settings_full_path": False,
            "col_percent": 75,
            "subfolder": ""
        }
        
        response = requests.post(
            f"{server_url}/api/execute_analysis",
            json=payload,
            timeout=60
        )
        
        duration = time.time() - start_time
        print(f"✅ FastAPI Server: {duration:.2f}s")
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success', 'unknown')}")
            print(f"Repositories: {len(result.get('repositories', []))}")
        else:
            print(f"Error response: {response.text[:200]}...")
        return True, duration
        
    except requests.exceptions.Timeout:
        duration = time.time() - start_time
        print(f"❌ FastAPI Server: TIMEOUT after {duration:.2f}s")
        return False, duration
    except Exception as e:
        duration = time.time() - start_time
        print(f"❌ FastAPI Server: ERROR after {duration:.2f}s - {e}")
        return False, duration

def test_git_operations(repo_path: str):
    """Test basic git operations on the repository"""
    print("=== Testing Git Operations ===")
    start_time = time.time()
    
    try:
        repo_path_obj = Path(repo_path)
        if not repo_path_obj.exists():
            print(f"❌ Repository path does not exist: {repo_path}")
            return False, 0
        
        if not (repo_path_obj / ".git").exists():
            print(f"❌ Not a git repository: {repo_path}")
            return False, 0
        
        # Test git log
        result = subprocess.run(
            ["git", "log", "--oneline", "-n", "10"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            commit_count = len(result.stdout.strip().split('\n'))
            print(f"✅ Git log: {commit_count} recent commits")
        else:
            print(f"❌ Git log failed: {result.stderr}")
            return False, time.time() - start_time
        
        # Test git ls-files
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            file_count = len(result.stdout.strip().split('\n'))
            print(f"✅ Git ls-files: {file_count} tracked files")
        else:
            print(f"❌ Git ls-files failed: {result.stderr}")
            return False, time.time() - start_time
        
        duration = time.time() - start_time
        print(f"✅ Git Operations: {duration:.2f}s")
        return True, duration
        
    except subprocess.TimeoutExpired:
        duration = time.time() - start_time
        print(f"❌ Git Operations: TIMEOUT after {duration:.2f}s")
        return False, duration
    except Exception as e:
        duration = time.time() - start_time
        print(f"❌ Git Operations: ERROR after {duration:.2f}s - {e}")
        return False, duration

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_timeout_diagnosis.py <repo_path>")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    print(f"Diagnosing timeout issue with repository: {repo_path}")
    print("=" * 60)
    
    # Test 1: Basic git operations
    git_success, git_duration = test_git_operations(repo_path)
    
    # Test 2: Direct Python API
    python_success, python_duration = test_direct_python_api(repo_path)
    
    # Test 3: FastAPI server (if running)
    fastapi_success, fastapi_duration = test_fastapi_server(repo_path)
    
    # Summary
    print("\n" + "=" * 60)
    print("DIAGNOSIS SUMMARY")
    print("=" * 60)
    print(f"Git Operations:  {'✅' if git_success else '❌'} {git_duration:.2f}s")
    print(f"Python API:      {'✅' if python_success else '❌'} {python_duration:.2f}s")
    print(f"FastAPI Server:  {'✅' if fastapi_success else '❌'} {fastapi_duration:.2f}s")
    
    # Recommendations
    print("\nRECOMMENDATIONS:")
    if not git_success:
        print("🔍 Issue is with basic git operations - check repository integrity")
    elif not python_success:
        print("🔍 Issue is with Python analysis engine - check RepoData/legacy engine")
    elif not fastapi_success:
        print("🔍 Issue is with FastAPI server - check HTTP handling/serialization")
    else:
        print("🔍 All components work individually - issue may be with Tauri integration")

if __name__ == "__main__":
    main()