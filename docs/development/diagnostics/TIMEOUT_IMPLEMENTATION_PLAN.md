# GitInspectorGUI Timeout Fix Implementation Plan

## Overview
This document provides a step-by-step implementation plan to diagnose and fix the 30-second timeout issue in the GitInspectorGUI FastAPI implementation.

## Phase 1: Immediate Diagnostic Implementation

### Step 1.1: Create Diagnostic Script
**File**: `python/test_timeout_diagnosis.py`
**Purpose**: Test each component in isolation to identify the timeout source

```python
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
        cmd = [
            sys.executable, "gigui/api.py", "execute_analysis",
            json.dumps({"input_fstrs": [repo_path], "depth": 5})
        ]
        
        result = subprocess.run(
            cmd, 
            cwd="python",
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
```

### Step 1.2: Create Performance Monitoring
**File**: `python/gigui/performance_monitor.py`
**Purpose**: Add detailed timing to the analysis process

```python
"""
Performance monitoring utilities for GitInspectorGUI analysis.
"""

import time
import psutil
import logging
from contextlib import contextmanager
from typing import Dict, Any, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class PerformanceStep:
    name: str
    start_time: float
    end_time: Optional[float] = None
    memory_before_mb: float = 0
    memory_after_mb: float = 0
    
    @property
    def duration_ms(self) -> float:
        if self.end_time is None:
            return 0
        return (self.end_time - self.start_time) * 1000
    
    @property
    def memory_delta_mb(self) -> float:
        return self.memory_after_mb - self.memory_before_mb

class PerformanceProfiler:
    """Detailed performance profiler for analysis operations."""
    
    def __init__(self):
        self.steps: Dict[str, PerformanceStep] = {}
        self.current_step: Optional[str] = None
        self.total_start_time = time.time()
    
    @contextmanager
    def step(self, name: str):
        """Context manager for timing analysis steps."""
        self.start_step(name)
        try:
            yield
        finally:
            self.end_step(name)
    
    def start_step(self, name: str):
        """Start timing a specific step."""
        if self.current_step:
            logger.warning(f"Starting step '{name}' while '{self.current_step}' is still active")
        
        memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
        self.steps[name] = PerformanceStep(
            name=name,
            start_time=time.time(),
            memory_before_mb=memory_mb
        )
        self.current_step = name
        logger.info(f"Started step: {name} (Memory: {memory_mb:.1f}MB)")
    
    def end_step(self, name: str):
        """End timing a specific step."""
        if name not in self.steps:
            logger.error(f"Cannot end step '{name}' - not started")
            return
        
        step = self.steps[name]
        step.end_time = time.time()
        step.memory_after_mb = psutil.Process().memory_info().rss / 1024 / 1024
        
        if self.current_step == name:
            self.current_step = None
        
        logger.info(f"Completed step: {name} ({step.duration_ms:.1f}ms, "
                   f"Memory: {step.memory_after_mb:.1f}MB, "
                   f"Delta: {step.memory_delta_mb:+.1f}MB)")
    
    def get_summary(self) -> Dict[str, Any]:
        """Get performance summary."""
        total_duration = time.time() - self.total_start_time
        
        summary = {
            "total_duration_ms": total_duration * 1000,
            "steps": {}
        }
        
        for name, step in self.steps.items():
            summary["steps"][name] = {
                "duration_ms": step.duration_ms,
                "memory_delta_mb": step.memory_delta_mb,
                "percentage_of_total": (step.duration_ms / (total_duration * 1000)) * 100 if total_duration > 0 else 0
            }
        
        return summary
    
    def log_summary(self):
        """Log performance summary."""
        summary = self.get_summary()
        logger.info("=== PERFORMANCE SUMMARY ===")
        logger.info(f"Total Duration: {summary['total_duration_ms']:.1f}ms")
        
        # Sort steps by duration
        sorted_steps = sorted(
            summary["steps"].items(),
            key=lambda x: x[1]["duration_ms"],
            reverse=True
        )
        
        for name, metrics in sorted_steps:
            logger.info(f"  {name}: {metrics['duration_ms']:.1f}ms "
                       f"({metrics['percentage_of_total']:.1f}%) "
                       f"[{metrics['memory_delta_mb']:+.1f}MB]")

# Global profiler instance
profiler = PerformanceProfiler()
```

### Step 1.3: Add Monitoring to RepoData
**File**: `python/gigui/repo_data_monitored.py`
**Purpose**: Wrapper around RepoData with detailed monitoring

```python
"""
Monitored version of RepoData for timeout diagnosis.
"""

from gigui.repo_data import RepoData as OriginalRepoData
from gigui.data import IniRepo
from gigui.performance_monitor import profiler
import logging

logger = logging.getLogger(__name__)

class MonitoredRepoData(OriginalRepoData):
    """RepoData with detailed performance monitoring."""
    
    def __init__(self, ini_repo: IniRepo) -> None:
        """Initialize with performance monitoring."""
        logger.info(f"Starting RepoData analysis for: {ini_repo.input_fstrs}")
        
        with profiler.step("repo_data_total"):
            with profiler.step("repo_data_super_init"):
                super().__init__(ini_repo)
            
            # Log completion
            profiler.log_summary()
            logger.info("RepoData analysis completed")
```

## Phase 2: Implementation Steps

### Step 2.1: Run Initial Diagnosis
```bash
# 1. Start FastAPI server in one terminal
cd python && python -m gigui.http_server

# 2. Run diagnosis in another terminal
cd python && python test_timeout_diagnosis.py /path/to/your/test/repo
```

### Step 2.2: Add Monitoring to Legacy Engine
**Modify**: `python/gigui/legacy_engine.py`
**Add**: Performance monitoring to execute_analysis method

### Step 2.3: Implement Progressive Timeout
**Modify**: `src-tauri/src/commands.rs`
**Add**: Better timeout handling and progress monitoring

### Step 2.4: Add Request Monitoring
**Modify**: `python/gigui/http_server.py`
**Add**: Request timing and progress logging

## Phase 3: Targeted Fixes

Based on Phase 1 diagnosis results, implement specific fixes:

### If Git Operations are Slow:
- Add git command timeouts
- Implement git operation caching
- Use git plumbing commands instead of porcelain

### If Python API is Slow:
- Profile RepoData.__init__ in detail
- Optimize memory allocation
- Add incremental processing

### If FastAPI is Slow:
- Add request streaming
- Implement async processing
- Add response compression

### If Tauri Integration is Slow:
- Implement request chunking
- Add client-side timeout handling
- Use WebSocket for long-running operations

## Success Metrics

1. **Diagnosis Complete**: Identify exact bottleneck within 1 hour
2. **Quick Fix**: Reduce timeout to < 10 seconds within 2 hours
3. **Optimal Performance**: Achieve < 2 seconds for test repo within 4 hours
4. **Robust Solution**: Handle various repository sizes gracefully

## Rollback Strategy

If fixes introduce regressions:
1. Revert to previous working state
2. Document lessons learned
3. Implement alternative approach (e.g., direct Tauri commands)

---
*Implementation Status: Ready to Execute*
*Next Action: Run Step 1.1 diagnostic script*