# AI Development Ecosystem

AI-powered development tools and workflows for GitInspectorGUI.

## Tool Overview

### Claude.ai - Research Hub

-   **Model:** Claude 3.5 Sonnet (Anthropic API)
-   **Use:** Research, documentation analysis, web search
-   **Strengths:** File upload analysis, current information access

### Cline (VSCode) - Primary Development

-   **Model:** Claude 3.5 Sonnet (OpenRouter API)
-   **Use:** Direct coding, file modifications, debugging
-   **Strengths:** Reliable execution, minimal setup, file system access

### Roo Code (VSCode) - Advanced Architecture

-   **Model:** Claude 3.5 Sonnet (OpenRouter API)
-   **Use:** Complex architecture, multi-agent workflows
-   **Strengths:** System design, orchestrated development

## Selection Guide

### Primary Tool: Cline

-   Most development tasks
-   File modifications and debugging
-   Reliable, consistent performance
-   **Recommended first choice**

### Research Tool: Claude.ai

-   When Cline lacks current information
-   When Cline repeatedly fails to fix a bug
-   Technology research and best practices
-   Multi-file analysis requirements
-   Web search capabilities needed

### Architecture Tool: Roo Code

-   Complex system architecture planning
-   Multi-component project coordination
-   **Use only when specifically needed**

## Workflow Patterns

### Research → Implementation

1. **Research Phase (Claude.ai)**

    - Upload relevant files for analysis
    - Research current best practices
    - Generate implementation guidelines

2. **Implementation Phase (Cline)**
    - Save research as markdown reference
    - Use Cline for actual code changes
    - Reference research document for decisions

### Development Best Practices

-   **Checkpoints over commits** - Use tool checkpoints, commit when ready
-   **Clean git history** - Avoid frequent micro-commits

## Documentation

-   **[Cline Guide](cline-guide.md)** - Direct development assistance
-   **[Roo Code Guide](roo-code-guide.md)** - Multi-agent workflows
