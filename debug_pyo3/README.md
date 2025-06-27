# PyO3 Debug Infrastructure

**STATUS: PyO3 conversion completed successfully ✅**

This directory contains debugging tools that were used to solve PyO3 integration issues during the FastAPI to PyO3 conversion. The tools are kept temporarily for stability monitoring and future troubleshooting.

## 🎯 Purpose

These tools help diagnose and resolve PyO3 runtime issues, particularly:

-   Python environment configuration problems
-   Module import failures
-   Runtime hangs during startup
-   Build configuration issues

## 📁 Directory Structure

```
debug_pyo3/
├── README.md                    # This file
├── SOLUTION_SUMMARY.md          # Documents the successful solution
├── verify_env.py               # Python environment diagnostic script
├── test_gigui_import.rs        # Quick Rust test for gigui imports
├── minimal_tests/              # Basic PyO3 functionality tests
├── gigui_test/                 # Full integration tests (redundant)
└── temp_builds/                # Temporary build artifacts (ignored)
```

## 🔧 Tools Overview

### Essential Tools (Keep)

#### `verify_env.py`

**Purpose**: Diagnose Python environment issues
**When to use**:

-   Before building with PyO3
-   When users report import errors
-   After Python environment changes

**Usage**:

```bash
python debug_pyo3/verify_env.py
```

**Output**: JSON report of Python configuration, gigui availability, and environment status

#### `SOLUTION_SUMMARY.md`

**Purpose**: Documents the complete solution to PyO3 issues
**When to use**: Reference for future similar problems

#### `test_gigui_import.rs`

**Purpose**: Quick Rust test to verify gigui imports work in PyO3
**When to use**:

-   Regression testing after PyO3 updates
-   Validating environment setup

**Usage**:

```bash
cd debug_pyo3
rustc test_gigui_import.rs && ./test_gigui_import
```

### Testing Projects

#### `minimal_tests/`

**Purpose**: Basic PyO3 functionality validation
**When to use**:

-   Testing PyO3 upgrades
-   Isolating PyO3 vs. application issues
-   Platform compatibility testing

**Usage**:

```bash
cd debug_pyo3/minimal_tests
cargo run --release
```

#### `gigui_test/` (Redundant)

**Purpose**: Full integration testing
**Status**: Can be removed - redundant with minimal_tests
**Cleanup**: Remove in next cleanup phase

## 🚀 Common Use Cases

### 1. User Reports "Application Won't Start"

```bash
# Step 1: Check Python environment
python debug_pyo3/verify_env.py

# Step 2: Test basic PyO3 functionality
cd debug_pyo3/minimal_tests && cargo run

# Step 3: Check gigui imports specifically
cd debug_pyo3 && rustc test_gigui_import.rs && ./test_gigui_import
```

### 2. After PyO3 Version Upgrade

```bash
# Validate compatibility
cd debug_pyo3/minimal_tests
cargo clean && cargo run --release
```

### 3. Platform Compatibility Testing

```bash
# Run full test suite
python debug_pyo3/verify_env.py > platform_test.json
cd debug_pyo3/minimal_tests && cargo run 2>&1 | tee platform_test.log
```

## 📅 Cleanup Schedule

### Phase 1: Current (Keep for stability)

-   ✅ All tools available for regression testing
-   ✅ Support user issues during transition period
-   ✅ Validate PyO3 stability over 4-6 weeks

### Phase 2: Selective Cleanup (4-6 weeks)

-   🗑️ Remove `gigui_test/` (redundant)
-   🗑️ Remove `temp_builds/` (build artifacts)
-   ✅ Keep `verify_env.py`, `SOLUTION_SUMMARY.md`, `minimal_tests/`

### Phase 3: Final Cleanup (2-3 months)

-   🗑️ Remove most debug infrastructure
-   ✅ Move essential tools to `tools/debug/` or `scripts/`
-   ✅ Archive methodology in main documentation

## 🔍 Troubleshooting Quick Reference

### Common Issues and Solutions

| Issue                | Diagnostic                                 | Solution                        |
| -------------------- | ------------------------------------------ | ------------------------------- |
| App hangs on startup | `verify_env.py` shows gigui not importable | `cd python && uv sync`          |
| PyO3 build fails     | Check `VIRTUAL_ENV` in `verify_env.py`     | Activate virtual environment    |
| Import errors        | Run `minimal_tests`                        | Check Python path configuration |
| Platform issues      | Test on target platform                    | Validate Python/Rust versions   |

### Log Analysis

```bash
# Check for critical errors
grep -n "CRITICAL\|ERROR\|TIMEOUT" debug_pyo3/logs/*.log

# Find where hangs occur
grep -B5 -A5 "Step.*:" debug_pyo3/logs/*.log
```

## 📚 Related Documentation

-   `../runtime-tests.md` - Complete debugging methodology and results
-   `../pyo3.md` - PyO3 conversion plan and implementation
-   `SOLUTION_SUMMARY.md` - Specific solution details

## ⚠️ Important Notes

1. **Build Artifacts**: The `.gitignore` excludes `target/` directories to prevent repository bloat
2. **Environment Dependency**: Tools require the same Python environment as the main application
3. **Rust Version**: Ensure Rust version matches main project requirements
4. **Cleanup Reminder**: Review this infrastructure after 4-6 weeks of stable operation

---

_This debug infrastructure was created during the PyO3 conversion process and successfully resolved all runtime issues. It's maintained temporarily for stability monitoring and user support._
