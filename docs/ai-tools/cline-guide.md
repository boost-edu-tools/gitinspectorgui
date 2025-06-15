# Cline Development Guide

Direct coding assistance with VSCode integration for streamlined development workflows.

## Core Capabilities

### What Cline Excels At

-   **Direct file operations** - Reliable code generation, modification, and refactoring
-   **Single-agent workflow** - Straightforward task execution without complex coordination
-   **Full file system access** - Complete project directory operations and navigation
-   **User approval workflow** - Safe, controlled changes with explicit confirmation steps

### Best Use Cases

-   Code modifications and debugging
-   File creation and editing
-   Project structure changes
-   Direct development tasks
-   Build script automation
-   Documentation updates

## Common Issues & Troubleshooting

### UI Hanging and Recovery

**Cline UI hanging is a known issue**, especially on macOS systems. When Cline becomes unresponsive or stops processing, try these recovery methods in order:

#### Method 1: Simple Resume (Try First)

1. **Click "Plan"** button in the Cline interface
2. **Look for and click "Resume"** button that appears
3. Cline should resume normal operation

#### Method 2: Plan-Act-Approve Sequence

If the simple resume doesn't work:

1. **Click "Plan"** button in the Cline interface
2. **Click "Act"** button immediately after
3. **Look for and click "Approve"** button that should appear
4. Cline should resume normal operation

> **💡 Quick Recovery:** Try Plan → Resume first, then Plan → Act → Approve if needed

#### Method 3: Full Reset

If UI issues persist:

-   Restart VSCode completely
-   Use checkpoints for rollback if needed
-   Monitor for authentication prompts that may be hidden

### macOS Command Issues

**Shell operators hang indefinitely** on macOS systems, causing Cline to become unresponsive.

**Affected operators:**

-   `&&` (AND)
-   `;` (separator)
-   `|` (pipe)
-   `||` (OR)

**Breaking commands doesn't work:**

```bash
# Instead of: cd scripts && ./dev-mode.sh
# do not use
cd scripts
./dev-mode.sh
```

This fails because Cline executes each command in a new shell instance. The directory change from `cd` is lost when the next command runs.

**Solutions:**

**Use direct path execution:**

```bash
# Instead of: cd scripts && ./dev-mode.sh
./scripts/dev-mode.sh
```

**Use shell scripts for complex operations:**

```bash
# Create script.sh with compound commands
bash script.sh
```

**Use command substitution:**

```bash
# Use: echo $(date)
# Instead of: date | cat
```

### Persistence Issues with .clinerules

**Problem:** Cline often reverts to default behavior, ignoring `.clinerules` folder configurations even when properly structured (one file per rule, top-level placement).

**Root Causes:**

1. **Context reset** - Cline doesn't maintain `.clinerules` awareness across chat sessions
2. **Rule loading timing** - Rules may not load at task start or when switching project areas
3. **Memory limitations** - Long conversations can deprioritize earlier context including rules

**Effective Workarounds:**

1. **Explicit reminders** - Begin new sessions with "Please read and follow the rules in .clinerules"
2. **Reference rules when correcting** - Say "Please check .clinerules" rather than just correcting behavior
3. **Shorter conversation sessions** - Start fresh chats for new features/tasks to ensure rule loading
4. **Rule summaries** - Add `.clinerules/README.md` listing all active rules as quick reference

**Future Improvements Being Discussed:**

-   Auto-loading `.clinerules` at conversation start
-   Persistent rule awareness across sessions
-   Better VS Code workspace integration

## Best Practices

### Workflow Optimization

-   **Start sessions with rule reminders** if using `.clinerules`
-   **Break complex tasks** into smaller, focused conversations
-   **Ensure checkpoints are enabled** in Settings > Feature Settings > Checkpoints for automatic rollback capability
-   **Monitor for hanging** and apply recovery methods promptly

### Troubleshooting Strategy

1. **Try simple recovery first** (Plan → Resume)
2. **Escalate to Plan-Act-Approve** if needed
3. **Check for .clinerules issues** if behavior seems inconsistent
4. **Restart VSCode** as last resort

## Related Resources

-   **[AI Tools Overview](overview.md)** - Complete AI development ecosystem guide
-   **[Roo Code Guide](roo-code-guide.md)** - Multi-agent workflows and advanced patterns

---

> **Note:** These issues represent known limitations that the Cline development team is actively working to resolve. The workarounds provided are currently the most reliable solutions available.
