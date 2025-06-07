# Blame File Tabs Implementation

## Overview

The blame file tabs feature provides a vertical sidebar approach for file-based blame tables, allowing users to focus on individual files while maintaining an efficient navigation experience.

## Current Implementation

### Design Features

-   **Vertical Sidebar**: Left sidebar (200-250px) with file list for efficient navigation
-   **Smart File Names**: Truncated names with tooltips, sorted by relevance
-   **Collapsible Sidebar**: Can be collapsed for maximum table space
-   **File-Focused View**: Individual file-focused tables for concentrated analysis

### Core Functionality

The current implementation includes:

1. **Data Transformation**: Blame entries grouped by file for organized display
2. **Sidebar Component**: File selection sidebar with intuitive navigation
3. **Individual File Tables**: Dedicated blame data display for selected file
4. **State Management**: Tracks selected file and sidebar state

### Enhanced UX Features

Current user experience enhancements:

1. **Smart File Sorting**: Sort by commits, lines, or alphabetical order
2. **File Statistics**: Display line count and commit count in sidebar
3. **Search/Filter**: Filter files by name for quick navigation
4. **Collapsible Sidebar**: Toggle sidebar visibility for space optimization

### Future Extensibility (Planned)

Designed for future enhancements:

1. **Layout Toggle Icon**: Switch between flat and hierarchical views
2. **Two-Level Navigation**: Directory structure with nested files
3. **File Grouping**: Group by directory, file type, or activity level

## Component Architecture

```
BlameFileTabsInterface
├── FileSelectionSidebar
│   ├── SidebarHeader (with collapse toggle)
│   ├── FileSearchInput
│   ├── FileSortControls
│   └── FileList
│       └── FileListItem (with stats, tooltip)
└── FileBlameTable
    ├── FileHeader (selected file info)
    └── BlameTable (existing table logic)
```

## Data Structure Changes

```typescript
interface BlameFileData {
    fileName: string;
    filePath: string;
    blameEntries: BlameEntry[];
    stats: {
        totalLines: number;
        totalCommits: number;
        authors: string[];
    };
}

interface BlameTabsState {
    selectedFile: string | null;
    sidebarCollapsed: boolean;
    fileSort: "name" | "lines" | "commits";
    searchFilter: string;
}
```

## Current Architecture

The implementation follows a clean component structure:

```
BlameFileTabsInterface
├── FileSelectionSidebar
│   ├── SidebarHeader (with collapse toggle)
│   ├── FileSearchInput
│   ├── FileSortControls
│   └── FileList
│       └── FileListItem (with stats, tooltip)
└── FileBlameTable
    ├── FileHeader (selected file info)
    └── BlameTable (existing table logic)
```

## Data Structures

The current implementation uses these data structures:

```typescript
interface BlameFileData {
    fileName: string;
    filePath: string;
    blameEntries: BlameEntry[];
    stats: {
        totalLines: number;
        totalCommits: number;
        authors: string[];
    };
}

interface BlameTabsState {
    selectedFile: string | null;
    sidebarCollapsed: boolean;
    fileSort: "name" | "lines" | "commits";
    searchFilter: string;
}
```

## Current Benefits

-   **Space Efficient**: Maximizes horizontal space for code content
-   **Scalable**: Handles many files and long file names effectively
-   **Focused**: Users can concentrate on one file at a time
-   **Extensible**: Architecture supports future directory navigation
-   **Performance**: Only renders selected file's data for optimal performance

## Future Enhancement Capabilities

The current architecture provides hooks for future enhancements:

-   Layout toggle icon in sidebar header for view switching
-   Directory tree structure implementation
-   Support for both flat and hierarchical file views
-   Advanced file grouping and organization features
