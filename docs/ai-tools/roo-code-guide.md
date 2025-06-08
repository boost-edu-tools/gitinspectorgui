# Roo Code Development Guide

## Overview

Roo Code was originally forked from Cline, it has evolved into a multi-agent development platform with specialized modes and enhanced capabilities.

## Multi-Agent Architecture

### Available Modes

**🏗️ Architect Mode:**

-   **Purpose:** System design and high-level planning
-   **Best for:** Architecture documentation, technical specifications

**🪃 Orchestrator Mode:**

-   **Purpose:** Strategic workflow orchestration and task delegation
-   **Key feature:** Uses `new_task` tool for delegating to specialized modes
-   **Best for:** Complex multi-component projects

**⚡ Code Mode:**

-   **Purpose:** Direct implementation and coding tasks
-   **Best for:** Active development, debugging, file operations

**❓ Ask Mode:**

-   **Purpose:** Learning, exploration, and safe planning
-   **Best for:** Understanding codebases, research, safe exploration

**🐛 Debug Mode:**

-   **Purpose:** Systematic troubleshooting and issue resolution
-   **Best for:** Identifying and fixing bugs, performance analysis

## Advanced Capabilities

### Browser Automation

-   **Extended browser automation** with customization options
-   **More control** over testing different screen sizes and image quality
-   **Advanced web scraping** and testing capabilities
-   **Custom browser configurations** for specific testing needs

## Strategic Usage Patterns

### Mode Selection and execution Strategy

1. **Start with Architect** for complex system design and planning
2. **Evaluate and update plan** evaluate saved architect plan and update where
   needed
3. **Archtect switches mode** Let Archtect decide to execute plan via Orchestrator or Code\*\*
4. **Use Orchestrator** for project coordination and task delegation
5. **Switch to Code** for implementation details and active development
6. **Deploy Debug** for systematic troubleshooting and issue resolution
7. **Leverage Ask** for learning and codebase exploration
