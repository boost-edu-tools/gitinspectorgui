# Roo Code Guide

Comprehensive guide to using Roo Code for complex architecture setup and project orchestration.

## Overview

Roo Code (formerly Roo Cline) is an AI-powered autonomous coding agent that provides a whole dev team of AI agents in your code editor. Unlike Cline's single-agent approach, Roo Code offers specialized modes and orchestration capabilities for complex development workflows.

## Key Differences from Cline

### Multi-Agent Architecture

**Roo Code:**

-   Multiple specialized modes (Code, Architect, Ask, Debug, Orchestrator)
-   Each mode has specific tool access and behavior patterns
-   Orchestrator mode can delegate tasks to other modes
-   Sticky model assignment per mode

**Cline:**

-   Single general-purpose agent
-   Consistent behavior across all tasks
-   Direct tool access without mode restrictions

### When to Use Roo Code vs Cline

**Use Roo Code for:**

-   Complex architecture planning and implementation
-   Multi-step projects requiring different expertise
-   Team-like workflows with specialized roles
-   Projects requiring safety controls (read-only modes)
-   Systematic debugging and troubleshooting

**Use Cline for:**

-   Direct, immediate coding tasks
-   Simple file modifications
-   Quick debugging sessions
-   Cost-sensitive workflows (single agent)

## Roo Code Modes for Architecture Setup

### 1. Architect Mode (`🏗️ Architect`)

**Purpose:** System design and high-level planning

**Tool Access:**

-   `read` - Analyze existing codebase
-   `browser` - Research technologies and patterns
-   `mcp` - Access external tools and APIs
-   `edit` (restricted) - Markdown files only for documentation

**Workflow:**

1. **Information Gathering:** Analyzes requirements and existing code
2. **Architecture Design:** Creates system diagrams and technical specifications
3. **Implementation Planning:** Breaks down work into actionable tasks
4. **Documentation:** Creates comprehensive architecture documentation

### 2. Orchestrator Mode (`🪃 Orchestrator`)

**Purpose:** Strategic workflow orchestration and task delegation

**Tool Access:**

-   `read` - Analyze project structure
-   `browser` - Research and gather information
-   `command` - Execute build and deployment commands
-   `mcp` - Access external tools
-   `edit` (restricted) - Mode configuration files only

**Key Capability:** Uses the `new_task` tool to delegate subtasks to specialized modes

## Best Practices

### 1. Mode Selection Strategy

-   **Start with Architect** for complex projects
-   **Use Orchestrator** for multi-component systems
-   **Switch to Code** for implementation details
-   **Use Debug** for systematic troubleshooting
-   **Use Ask** for learning and exploration

### 2. Task Delegation

-   Break complex tasks into mode-appropriate subtasks
-   Use clear, specific instructions for each mode
-   Maintain context between mode switches
-   Document decisions and handoffs

### 3. Safety and Control

-   Use restricted modes (Ask, Architect) for planning phases
-   Enable full tool access only when implementing
-   Review architecture plans before implementation
-   Use checkpoints for complex workflows
