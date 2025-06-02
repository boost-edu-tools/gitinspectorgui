#!/usr/bin/env python3
"""
Test script to simulate the exact HTTP request that Tauri makes to the FastAPI server.
This will help identify if the issue is in the HTTP communication layer.
"""

import requests
import json
import time

def test_tauri_http_request():
    """Test the exact HTTP request that Tauri makes"""
    
    # This is the exact payload structure that Tauri sends
    payload = {
        "input_fstrs": ["/Users/dvbeek/1-repos/gitlab/gitinspectorgui"],  # Absolute path to git repo
        "depth": 5,
        "n_files": 5,
        "include_files": [],
        "ex_files": [],
        "extensions": ["c", "cc", "cif", "cpp", "glsl", "h", "hh", "hpp", "java", "js", "py", "rb", "sql", "ts"],
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
    
    print("Testing Tauri-style HTTP request to FastAPI server...")
    print("=" * 60)
    
    # Test with different timeout values to see what happens
    timeout_values = [5, 10, 30, 60]
    
    for timeout in timeout_values:
        print(f"\nTesting with {timeout}s timeout:")
        start_time = time.time()
        
        try:
            response = requests.post(
                "http://127.0.0.1:8080/api/execute_analysis",
                json=payload,
                timeout=timeout,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "tauri-test"
                }
            )
            
            duration = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                print(f"  ✅ SUCCESS in {duration:.3f}s")
                print(f"     Status: {response.status_code}")
                print(f"     Success: {result.get('success', 'unknown')}")
                print(f"     Repositories: {len(result.get('repositories', []))}")
                if result.get('repositories'):
                    repo = result['repositories'][0]
                    print(f"     Authors: {len(repo.get('authors', []))}")
                    print(f"     Files: {len(repo.get('files', []))}")
                break
            else:
                print(f"  ❌ HTTP {response.status_code} in {duration:.3f}s")
                print(f"     Response: {response.text[:200]}...")
                
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            print(f"  ⏰ TIMEOUT after {duration:.3f}s (expected {timeout}s)")
            
        except requests.exceptions.ConnectionError as e:
            duration = time.time() - start_time
            print(f"  🔌 CONNECTION ERROR after {duration:.3f}s: {e}")
            
        except Exception as e:
            duration = time.time() - start_time
            print(f"  ❌ ERROR after {duration:.3f}s: {e}")

def test_server_health():
    """Test if the FastAPI server is responding"""
    print("Testing FastAPI server health...")
    
    try:
        response = requests.get("http://127.0.0.1:8080/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Server is healthy")
            print(f"   Status: {health_data.get('status')}")
            print(f"   Version: {health_data.get('version')}")
            return True
        else:
            print(f"❌ Server returned {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False

if __name__ == "__main__":
    print("Tauri HTTP Client Test")
    print("=" * 60)
    
    # First test server health
    if test_server_health():
        print()
        test_tauri_http_request()
    else:
        print("\n❌ FastAPI server is not running or not accessible")
        print("Please start the server with: cd python && python -m gigui.http_server")