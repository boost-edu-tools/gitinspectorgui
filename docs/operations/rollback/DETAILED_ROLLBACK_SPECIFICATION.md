# Detailed Rollback Specification

## Overview

This document specifies exactly what needs to be reverted to restore the original codebase state before implementing the HTTP architecture. All the changes listed below were temporary fixes to address stdout contamination issues.

## Files to Rollback

### 1. [`gitinspectorgui/python/gigui/api.py`](../python/gigui/api.py)

**Current State (Lines 28-42):**
```python
# Configure logging for API operations - disable all logging to keep stdout clean for JSON
import sys
import os

# Completely disable logging for sidecar operations to ensure clean JSON output
logging.basicConfig(level=logging.CRITICAL, stream=sys.stderr)

# Also disable the root logger to prevent any logging from appearing
root_logger = logging.getLogger()
root_logger.setLevel(logging.CRITICAL)

# Disable all existing handlers
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)
```

**Rollback Action:** 
- ✅ **RESTORE**: Normal logging configuration
- ✅ **RESTORE**: INFO/DEBUG level logging
- ✅ **RESTORE**: All logging handlers

**Expected Original State:**
```python
# Configure logging for API operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

### 2. [`gitinspectorgui/python/api.py`](../python/api.py)

**Current State (Lines 16-22, 48-66):**
```python
# CRITICAL: Disable all logging before importing old gigui modules to prevent stdout contamination
# The old gigui modules automatically set up logging which interferes with JSON output
root_logger = logging.getLogger()
root_logger.setLevel(logging.CRITICAL)
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

# ... later in file ...

# Completely disable logging for sidecar operations to ensure clean JSON output
logging.basicConfig(level=logging.CRITICAL, stream=sys.stderr)

# Also disable the root logger to prevent any logging from appearing
root_logger = logging.getLogger()
root_logger.setLevel(logging.CRITICAL)

# Disable all existing handlers
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)
```

**Current State (Line 214):**
```python
output_json = json.dumps(all_results)  # Removed indent=4 to prevent JSON parsing errors in Tauri
```

**Rollback Actions:**
- ✅ **RESTORE**: Normal logging configuration
- ✅ **RESTORE**: `indent=4` in json.dumps() call
- ✅ **REMOVE**: All logging suppression code

**Expected Original State:**
```python
# Normal logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ... later in file ...

output_json = json.dumps(all_results, indent=4)  # Restore indented JSON
```

### 3. [`gitinspectorgui/python/gigui/cli.py`](../python/gigui/cli.py)

**Current State (Lines 176-183):**
```python
# Output results - DISABLED for API sidecar to prevent JSON contamination
# The CLI output was interfering with the API JSON responses
if args.output_format == "json":
    from dataclasses import asdict
    # print(json.dumps(asdict(result), indent=2))  # DISABLED - causes JSON parsing errors in Tauri
    pass
else:
    format_table_output(result)
```

**Rollback Action:**
- ✅ **RESTORE**: JSON output with indentation
- ✅ **REMOVE**: Disabling comments

**Expected Original State:**
```python
# Output results
if args.output_format == "json":
    from dataclasses import asdict
    print(json.dumps(asdict(result), indent=2))
else:
    format_table_output(result)
```

### 4. [`gitinspectorgui/python/gigui/repo_base.py`](../python/gigui/repo_base.py)

**Current State (Lines 969-976):**
```python
def log_dot(self) -> None:
    """Log a dot for progress indication - DISABLED to prevent JSON contamination."""
    # print(".", end="", flush=True)  # DISABLED
    pass

def log_space(self, i: int) -> None:
    """Log spaces for formatting - DISABLED to prevent JSON contamination."""
    # print(" " * i, end="", flush=True)  # DISABLED
    pass
```

**Rollback Action:**
- ✅ **RESTORE**: Progress indication functionality
- ✅ **REMOVE**: Disabling comments

**Expected Original State:**
```python
def log_dot(self) -> None:
    """Log a dot for progress indication."""
    print(".", end="", flush=True)

def log_space(self, i: int) -> None:
    """Log spaces for formatting."""
    print(" " * i, end="", flush=True)
```

### 5. [`gitinspectorgui/src-tauri/tauri.conf.dev.json`](../src-tauri/tauri.conf.dev.json)

**Current State (Lines 60-62):**
```json
"externalBin": [
  "bin/gitinspector-api-sidecar"
],
```

**Rollback Action:**
- ✅ **RESTORE**: Development configuration to use Python script

**Expected Original State:**
```json
"externalBin": [
  "../python/dev_api.py"
],
```

## Verification Steps After Rollback

### 1. Confirm Original Issue Returns
After rollback, we should be able to reproduce the original error:
```
Failed to parse sidecar response: expected value at line 1 column 9
```

### 2. Verify Logging Output
The stdout should contain mixed content like:
```
INFO: Starting analysis...
DEBUG: Processing repository...
{"repositories": [
  {
    "name": "test-repo",
    ...
  }
]}
```

### 3. Verify Progress Indicators
During analysis, we should see progress output:
```
        ......................
```

### 4. Verify CLI JSON Output
Running CLI with `--output-format json` should produce indented JSON:
```json
{
  "repositories": [
    {
      "name": "test-repo",
      "path": "/path/to/repo"
    }
  ]
}
```

## Rollback Benefits

1. **Clean Baseline**: Start HTTP implementation from original codebase
2. **True Comparison**: Demonstrate real improvement after HTTP migration
3. **Proper Logging**: All logging functionality will work correctly in HTTP mode
4. **Code Quality**: Remove temporary workarounds and hacks
5. **Documentation**: Clear "before and after" for architectural change

## Post-Rollback Commit Message

```
Rollback temporary stdout contamination fixes

This commit reverts all temporary fixes that were applied to address
stdout contamination issues in the sidecar-based IPC architecture:

- Restore normal logging configuration in api.py and gigui/api.py
- Re-enable JSON indentation in CLI and API output
- Restore progress indicators (log_dot, log_space) in repo_base.py
- Revert Tauri dev config to use Python script instead of binary

These changes prepare for implementing the HTTP-based API server
architecture which will properly separate data transport from logging.

The original stdout contamination issue will return temporarily but
will be permanently resolved by the HTTP architecture migration.
```

## Risk Assessment

**Low Risk Rollback:**
- All changes are well-documented
- Original functionality is preserved
- Easy to re-apply fixes if needed
- No data loss or corruption risk

**Expected Temporary Issues:**
- ❌ JSON parsing errors will return
- ❌ Stdout contamination will occur
- ❌ Application may be temporarily unusable

**Mitigation:**
- Rollback can be done quickly
- HTTP implementation will permanently fix issues
- Clear documentation of what was changed

## Next Steps After Rollback

1. **Commit Clean State**: Commit the rollback to git
2. **Document Original Issue**: Capture logs/screenshots of contamination
3. **Begin HTTP Implementation**: Start Phase 1 of HTTP architecture
4. **Validate Improvement**: Compare before/after HTTP implementation

This rollback ensures we implement the HTTP architecture properly and can demonstrate its true value compared to the original fragile system.