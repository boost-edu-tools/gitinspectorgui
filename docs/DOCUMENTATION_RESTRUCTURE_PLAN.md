# Documentation Restructure Plan

## Current Issues Identified

### 1. Logical Flow Problems

-   **Quick Start before Installation**: Users can't follow quick start without prerequisites
-   **Circular References**: Documents reference each other without clear hierarchy
-   **Mixed Audiences**: Development and user documentation intermingled

### 2. Content Duplication

-   **Server Commands**: `python -m gigui.start_server` appears in 5+ places
-   **Installation Steps**: Platform setup duplicated across files
-   **Development Commands**: `pnpm run tauri dev` repeated multiple times
-   **Troubleshooting**: Similar solutions scattered across files

### 3. Inconsistent Organization

-   **Getting Started**: Mixes user and developer concerns
-   **Development**: Overlaps with getting started content
-   **Cross-References**: Unclear reading order

## Proposed Restructure

### Phase 1: Reorganize Getting Started (User-First Approach)

#### New Structure:

```
docs/getting-started/
├── 01-prerequisites.md          # System requirements & tool installation
├── 02-installation.md           # Project setup & dependency installation
├── 03-quick-start.md           # 3-step verification (after installation)
└── 04-first-analysis.md        # Testing your setup
```

#### Content Changes:

-   **Prerequisites First**: Clear system requirements before any setup
-   **Installation Second**: Complete project setup with all dependencies
-   **Quick Start Third**: Fast verification that everything works
-   **First Analysis Last**: Comprehensive testing

### Phase 2: Streamline Development Documentation

#### Consolidate Overlapping Content:

-   **environment-setup.md**: Focus on IDE configuration and development tools
-   **development-workflow.md**: Focus on development patterns and workflows
-   **package-management.md**: Focus on dependency management specifics
-   **troubleshooting.md**: Centralize all troubleshooting content

#### Remove Duplication:

-   **Server Commands**: Centralize in development-workflow.md with references
-   **Installation**: Remove from development docs, reference getting-started
-   **Build Commands**: Consolidate in build-process.md

### Phase 3: Create Clear Content Hierarchy

#### Establish Single Source of Truth:

-   **Installation**: Only in getting-started/installation.md
-   **Server Commands**: Primary in development-workflow.md
-   **Troubleshooting**: Centralized in development/troubleshooting.md
-   **Build Process**: Only in development/build-process.md

#### Cross-Reference Strategy:

-   Use clear "See [Document](link)" references
-   Avoid duplicating content
-   Establish reading order with numbered files

## Implementation Plan

### Step 1: Restructure Getting Started

1. Create new numbered files with logical flow
2. Move content to eliminate duplication
3. Update cross-references

### Step 2: Consolidate Development Docs

1. Remove duplicated installation content
2. Centralize command references
3. Streamline troubleshooting

### Step 3: Update Navigation

1. Update mkdocs.yml with new structure
2. Verify all internal links
3. Test documentation flow

## Benefits

### For New Users:

-   Clear prerequisite → installation → verification flow
-   No confusion about what to install first
-   Single source of truth for each topic

### For Developers:

-   Reduced maintenance burden
-   Clear separation of concerns
-   Easier to keep content current

### For Documentation:

-   Eliminates circular references
-   Reduces duplication by ~40%
-   Creates logical reading progression
