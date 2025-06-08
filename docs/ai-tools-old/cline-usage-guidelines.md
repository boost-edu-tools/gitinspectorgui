# Cline Usage Guidelines

Cost-efficient communication patterns and workflow preferences for working with Cline + Sonnet-4.

## Cost Optimization

### Understanding Costs

**Sonnet-4 Pricing:**

-   Input tokens: ~$3.00/million tokens (what you send)
-   Output tokens: ~$15.00/million tokens (what Cline generates)
-   Output is 5x more expensive than input

**High-cost patterns to avoid:**

-   Verbose completion summaries
-   Repetitive explanations
-   Unnecessary context repetition
-   Long "thinking" explanations

### Preferred Response Style

**Instead of verbose summaries:**

```
❌ Task Completed

I have successfully improved the installation documentation to address all the issues you identified:

## Problems Fixed
### 1. Chaotic Layout and Heading Structure
- Before: Inconsistent headings...
- After: Clean, consistent hierarchy...
[300+ words of obvious summary]
```

**Use concise confirmations:**

```
✅ Installation guide updated with platform-specific instructions and package manager explanations.

✅ Done. Changes committed.

✅ Fixed heading structure and Windows compatibility issues.
```

### Efficient Communication Patterns

**Be specific in requests:**

-   ❌ "Fix the documentation"
-   ✅ "Fix heading structure in installation.md - use consistent # → ## → ### hierarchy"

**Batch related tasks:**

-   ❌ 5 separate requests for 5 files
-   ✅ "Fix these 5 documentation issues in one go"

**Request brief responses when appropriate:**

-   "Just make the changes, minimal explanation"
-   "Give brief responses"
-   "Skip the summary"

## Workflow Preferences

### Checkpoint Strategy

**Use checkpoints instead of frequent commits:**

-   Make change → Create checkpoint with descriptive name
-   Make another change → Create another checkpoint
-   Complete all related work → Ask about committing
-   Review everything → Single focused git commit

**Benefits:**

-   Clean git history
-   Better review process
-   Flexible workflow
-   Easy rollback options

### When to Commit

Only commit to git when explicitly requested:

-   "Commit these changes"
-   "Save to git"
-   "Finalize these updates"
-   Given a specific commit message

## Response Guidelines

### What to Include

**Always include:**

-   Confirmation of task completion
-   Critical errors or unexpected issues
-   Important technical details when requested

**Skip unless requested:**

-   Detailed before/after comparisons
-   Bullet-pointed summaries of obvious changes
-   "Task Completed" headers
-   Marketing-style wrap-ups

### When to Be Verbose

**Provide full detail for:**

-   Complex technical explanations
-   Error diagnosis and troubleshooting
-   Architecture decisions
-   Code analysis and recommendations

**When explicitly requested:**

-   "Explain what you changed"
-   "Give me the full breakdown"
-   "What are the implications?"

## Quick Reference

### Cost-Saving Commands

**For simple tasks:**

-   "Brief response only"
-   "Just confirm when done"
-   "Skip the explanation"

**For batching:**

-   "Make all these changes, then summarize"
-   "Handle these 3 issues together"

**For workflow:**

-   "Checkpoint this"
-   "Don't commit yet"
-   "Follow the Cline guidelines"

### Reminder Commands

**When I revert to verbose mode:**

-   "Follow the Cline usage guidelines"
-   "Use concise responses per the guidelines doc"
-   "Check docs/development/cline-usage-guidelines.md"

## Estimated Savings

**Typical verbose completion summary:** 200-400 tokens (~$3-6)
**Concise confirmation:** 10-20 tokens (~$0.15-0.30)
**Potential savings:** 80-95% on completion messages

**Overall impact:** 20-30% reduction in total output costs while maintaining full capability.

## Implementation

### For New Conversations

1. Reference this document early: "Follow the Cline usage guidelines"
2. Set expectations: "Use concise responses unless I ask for detail"
3. Specify workflow: "Use checkpoints, not frequent commits"

### For Ongoing Work

-   Point to this doc when I revert to verbose mode
-   Use the quick reference commands
-   Adjust based on task complexity

## Notes

This document serves as a persistent reference to maintain cost-efficient communication patterns across conversation resets, VSCode restarts, and new task contexts.
