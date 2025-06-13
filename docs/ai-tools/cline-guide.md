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

#### **When Cline UI Hangs (Common Issue on macOS)**

**Cline UI hanging is a known issue.** If Cline becomes unresponsive or stops processing:

1. **Click "Plan"** button in the Cline interface
2. **Click "Act"** button immediately after
3. **Look for and click "Approve"** button that should appear
4. Cline should resume normal operation

> **💡 Quick Fix:** Plan → Act → Approve sequence resolves most hanging issues

#### Other Recovery Options

-   Restart VSCode if commands hang
-   Use checkpoints for rollback
-   Monitor for authentication prompts

## Related

-   **[AI Tools Overview](overview.md)** - Complete AI development ecosystem guide
-   **[Roo Code Guide](roo-code-guide.md)** - Multi-agent workflows
