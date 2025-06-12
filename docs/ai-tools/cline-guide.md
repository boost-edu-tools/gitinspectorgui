# Cline Development Guide

Direct coding assistance with VSCode integration.

## Capabilities

### Strengths

-   **Direct file operations** - Reliable code generation and modification
-   **Single-agent workflow** - Straightforward task execution
-   **File system access** - Full project directory operations
-   **User approval workflow** - Safe, controlled changes

### Best Use Cases

-   Code modifications and debugging
-   File creation and editing
-   Project structure changes
-   Direct development tasks

## macOS Command Issues

### Problem

Shell operators hang indefinitely on macOS systems.

**Affected operators:**

-   `&&` (AND)
-   `;` (separator)
-   `|` (pipe)
-   `||` (OR)

**Working commands:**

-   Simple commands (`pwd`, `ls`, `echo`)
-   File operations
-   Command substitution (`$()`)
-   Background processes (`&`)

### Workarounds

**1. Break compound commands:**

```bash
# Instead of: echo "test1" && echo "test2"
echo "test1"
echo "test2"
```

**2. Use shell scripts:**

```bash
# Create script.sh with compound commands
bash script.sh
```

**3. Command substitution:**

```bash
# Use: echo $(date)
# Instead of: date | cat
```

### Recovery

-   Toggle Plan/Act mode to resume
-   Restart VSCode if commands hang
-   Use checkpoints for rollback
-   Monitor for authentication prompts

## Typical Usage

1. **File modifications** - Direct code changes
2. **Debugging** - Error analysis and fixes
3. **Structure changes** - Project organization
4. **Testing** - Run and validate changes
