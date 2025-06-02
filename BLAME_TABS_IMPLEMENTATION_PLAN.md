# Blame File Tabs Implementation Plan

## Overview
Implement a vertical sidebar approach for file-based blame tables, replacing the current combined blame view with individual file-focused tables.

## Design Decisions
- **Vertical Sidebar**: Left sidebar (200-250px) with file list
- **Smart File Names**: Truncated names with tooltips, sorted by relevance
- **Collapsible Sidebar**: Can be collapsed for maximum table space
- **Future Extensibility**: Design to support two-level navigation (directories/files) later

## Implementation Strategy

### Phase 1: Core File-Based Blame System
1. **Data Transformation**: Group blame entries by file
2. **Sidebar Component**: Create file selection sidebar
3. **Individual File Tables**: Show blame data for selected file only
4. **State Management**: Track selected file and sidebar state

### Phase 2: Enhanced UX Features
1. **Smart File Sorting**: By commits, lines, or alphabetical
2. **File Statistics**: Show line count, commit count in sidebar
3. **Search/Filter**: Filter files by name
4. **Collapsible Sidebar**: Toggle sidebar visibility

### Phase 3: Future Extensibility (Planned)
1. **Layout Toggle Icon**: Switch between flat and hierarchical views
2. **Two-Level Navigation**: Directory structure with nested files
3. **File Grouping**: Group by directory, file type, or activity

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
  fileSort: 'name' | 'lines' | 'commits';
  searchFilter: string;
}
```

## Implementation Steps

1. Create `BlameFileTabsInterface` component
2. Add file grouping logic to process blame data
3. Create `FileSelectionSidebar` with file list
4. Create `FileBlameTable` for individual file display
5. Add sidebar collapse/expand functionality
6. Implement file search and sorting
7. Add file statistics display
8. Test with repositories having many files

## Benefits
- **Space Efficient**: Maximum horizontal space for code content
- **Scalable**: Handles many files and long file names well
- **Focused**: Users can concentrate on one file at a time
- **Extensible**: Easy to add directory navigation later
- **Performance**: Only renders selected file's data

## Future Enhancement Hook
- Add layout toggle icon in sidebar header
- Implement directory tree structure
- Support both flat and hierarchical file views