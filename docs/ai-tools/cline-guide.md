# Cline Development Guide

## Overview

Cline is in most cases the best tool for direct coding that do not require Roo Code's Architect mode.

## Current Status and Capabilities

### What Cline Excels At

-   **Direct code generation and modification** with user approval
-   **Reliable file operations** across project directories
-   **Single-agent workflow** for straightforward tasks

## Command Execution Issues (macOS)

### Confirmed Problem

**Issue:** Commands using shell operators hang indefinitely on macOS

**Affected operators:**

-   `&&` (AND operator)
-   `;` (command separator)
-   `|` (pipe operator)
-   `||` (OR operator)

**Working commands:**

-   Simple commands (`pwd`, `ls -la`, `echo "test"`)
-   File operations and directory changes
-   Command substitution (`$()`, backticks)
-   Background processes (`&`)

**Status:** Known issue in GitHub repository with multiple community reports

### Technical Analysis

**Root cause appears to be in Cline's command execution engine:**

1. **Process Management:** Improper handling of shell subprocess for compound commands
2. **Output Buffering:** Shell waiting for all parts of compound command before flushing output
3. **Exit Code Detection:** Failure to detect when compound commands finish execution
4. **Shell Parsing:** Command parsing logic not properly handling shell operators

### Impact on Development

This significantly limits Cline's usefulness for:

-   Build scripts that chain commands
-   Conditional command execution
-   Data processing pipelines
-   Complex development workflows

### Current Workarounds

1. **Break compound commands into individual steps**

    ```bash
    # Instead of: echo "test1" && echo "test2"
    # Use separate commands:
    echo "test1"
    echo "test2"
    ```

2. **Use explicit shell scripts** for complex operations

    ```bash
    # Create script.sh with compound commands
    # Execute: bash script.sh
    ```

3. **Leverage command substitution** where possible

    ```bash
    # Use: echo $(date)
    # Instead of: date | cat
    ```

4. **Monitor for VSCode authentication prompts**
    - Git commands may show input prompts at top of VSCode window
    - Not actual hanging - waiting for user authentication

### Community Solutions

When commands do hang:

-   Toggle Plan/Act mode to re-enable "Resume Task"
-   Exit all terminal windows and restart VS Code
-   Restore from checkpoints when commands fail
-   Use explicit shell scripts for complex command sequences
