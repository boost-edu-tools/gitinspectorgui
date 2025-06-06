import React, { useState, useMemo, useCallback } from "react";
import { useResultsStore } from "@/stores/resultsStore";
import type { BlameEntry } from "@/types/results";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, FileText } from "lucide-react";

interface BlameFileData {
  fileName: string;
  filePath: string;
  blameEntries: BlameEntry[];
  stats: {
    totalLines: number;
    totalCommits: number;
    uniqueAuthors: number;
    authors: string[];
  };
}

interface BlameTabsState {
  selectedFile: string | null;
  sidebarCollapsed: boolean;
  fileSort: 'name' | 'lines' | 'commits' | 'authors';
  searchFilter: string;
}

type SortDirection = "asc" | "desc" | null;

interface TableState {
  sortField: string;
  sortDirection: SortDirection;
  pageSize: number;
  currentPage: number;
  showComments: boolean;
}

export function BlameFileTabsInterface() {
  const { getCurrentRepository } = useResultsStore();
  const currentRepo = getCurrentRepository();
  

  const [tabsState, setTabsState] = useState<BlameTabsState>({
    selectedFile: null,
    sidebarCollapsed: false,
    fileSort: 'lines',
    searchFilter: '',
  });

  const [tableState, setTableState] = useState<TableState>({
    sortField: "line_number",
    sortDirection: "asc",
    pageSize: 50,
    currentPage: 0,
    showComments: true,
  });

  const [jumpToPage, setJumpToPage] = useState("");

  // Group blame data by file and calculate statistics
  const fileBlameData = useMemo(() => {
    if (!currentRepo?.blame_data) return [];

    const fileMap = new Map<string, BlameEntry[]>();
    
    // Group blame entries by file
    currentRepo.blame_data.forEach(entry => {
      if (!fileMap.has(entry.file)) {
        fileMap.set(entry.file, []);
      }
      fileMap.get(entry.file)!.push(entry);
    });

    // Convert to BlameFileData with statistics
    const fileData: BlameFileData[] = Array.from(fileMap.entries()).map(([filePath, entries]) => {
      const fileName = filePath.split('/').pop() || filePath;
      const uniqueCommits = new Set(entries.map(e => e.commit)).size;
      const uniqueAuthors = new Set(entries.map(e => e.author));

      return {
        fileName,
        filePath,
        blameEntries: entries.sort((a, b) => a.line_number - b.line_number),
        stats: {
          totalLines: entries.length,
          totalCommits: uniqueCommits,
          uniqueAuthors: uniqueAuthors.size,
          authors: Array.from(uniqueAuthors),
        },
      };
    });

    return fileData;
  }, [currentRepo?.blame_data]);

  // Filter and sort files based on search and sort criteria
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = fileBlameData.filter(file => 
      file.fileName.toLowerCase().includes(tabsState.searchFilter.toLowerCase()) ||
      file.filePath.toLowerCase().includes(tabsState.searchFilter.toLowerCase())
    );

    // Sort files
    filtered.sort((a, b) => {
      switch (tabsState.fileSort) {
        case 'name':
          return a.fileName.localeCompare(b.fileName);
        case 'lines':
          return b.stats.totalLines - a.stats.totalLines;
        case 'commits':
          return b.stats.totalCommits - a.stats.totalCommits;
        case 'authors':
          return b.stats.uniqueAuthors - a.stats.uniqueAuthors;
        default:
          return 0;
      }
    });

    return filtered;
  }, [fileBlameData, tabsState.searchFilter, tabsState.fileSort]);

  // Set default selected file
  React.useEffect(() => {
    if (filteredAndSortedFiles.length > 0 && !tabsState.selectedFile) {
      setTabsState(prev => ({
        ...prev,
        selectedFile: filteredAndSortedFiles[0].filePath
      }));
    }
  }, [filteredAndSortedFiles, tabsState.selectedFile]);

  // Get currently selected file data
  const selectedFileData = useMemo(() => {
    return filteredAndSortedFiles.find(file => file.filePath === tabsState.selectedFile);
  }, [filteredAndSortedFiles, tabsState.selectedFile]);

  const handleFileSelect = useCallback((filePath: string) => {
    setTabsState(prev => ({ ...prev, selectedFile: filePath }));
    setTableState(prev => ({ ...prev, currentPage: 0 })); // Reset to first page
  }, []);

  const toggleSidebar = useCallback(() => {
    setTabsState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const handleSort = useCallback((field: string) => {
    setTableState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      currentPage: 0,
    }));
  }, []);

  const handleJumpToPage = useCallback(() => {
    const pageNum = parseInt(jumpToPage) - 1;
    const maxPage = selectedFileData ? Math.ceil(selectedFileData.blameEntries.length / tableState.pageSize) - 1 : 0;
    
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum <= maxPage) {
      setTableState(prev => ({ ...prev, currentPage: pageNum }));
      setJumpToPage("");
    }
  }, [jumpToPage, selectedFileData, tableState.pageSize]);

  if (!currentRepo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No repository data available</p>
      </div>
    );
  }

  if (fileBlameData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No blame data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* File Selection Sidebar */}
      <div className={`border-r border-border bg-muted/20 transition-all duration-200 ${
        tabsState.sidebarCollapsed ? 'w-12' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="p-3 border-b border-border flex items-center justify-between">
          {!tabsState.sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-medium text-sm">Files ({filteredAndSortedFiles.length})</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-1 h-6 w-6"
          >
            {tabsState.sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {!tabsState.sidebarCollapsed && (
          <>
            {/* Search and Sort Controls */}
            <div className="p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={tabsState.searchFilter}
                  onChange={(e) => setTabsState(prev => ({ ...prev, searchFilter: e.target.value }))}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              
              <select
                value={tabsState.fileSort}
                onChange={(e) => setTabsState(prev => ({ ...prev, fileSort: e.target.value as any }))}
                className="w-full h-8 text-xs border border-border rounded px-2 bg-background"
              >
                <option value="lines">Sort by Lines</option>
                <option value="commits">Sort by Commits</option>
                <option value="authors">Sort by Authors</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto">
              {filteredAndSortedFiles.map((file) => (
                <div
                  key={file.filePath}
                  onClick={() => handleFileSelect(file.filePath)}
                  className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    tabsState.selectedFile === file.filePath ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                  }`}
                  title={file.filePath}
                >
                  <div className="text-sm font-medium truncate mb-1">
                    {file.fileName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {file.filePath}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* File Blame Table */}
      <div className="flex-1 flex flex-col">
        {selectedFileData ? (
          <FileBlameTable
            fileData={selectedFileData}
            tableState={tableState}
            onSort={handleSort}
            onPageChange={(page: number) => setTableState(prev => ({ ...prev, currentPage: page }))}
            onPageSizeChange={(size: number) => setTableState(prev => ({ ...prev, pageSize: size, currentPage: 0 }))}
            onToggleComments={() => setTableState(prev => ({ ...prev, showComments: !prev.showComments, currentPage: 0 }))}
            jumpToPage={jumpToPage}
            setJumpToPage={setJumpToPage}
            onJumpToPage={handleJumpToPage}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a file to view blame data</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual File Blame Table Component
interface FileBlameTableProps {
  fileData: BlameFileData;
  tableState: TableState;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onToggleComments: () => void;
  jumpToPage: string;
  setJumpToPage: (value: string) => void;
  onJumpToPage: () => void;
}

function FileBlameTable({
  fileData,
  tableState,
  onSort,
  onPageChange,
  onPageSizeChange,
  onToggleComments,
  jumpToPage,
  setJumpToPage,
  onJumpToPage
}: FileBlameTableProps) {
  
  const blameColumns = [
    { key: "line_number", label: "Line", width: "80px", sortable: true, type: "number" },
    { key: "author", label: "Author", sortable: true },
    { key: "commit", label: "Commit", width: "100px", sortable: true },
    { key: "date", label: "Date", width: "120px", sortable: true, type: "date" },
    { key: "content", label: "Content", sortable: false },
  ];

  const filteredAndSortedData = useMemo(() => {
    let filtered = fileData.blameEntries.filter((blame: BlameEntry) => {
      // Filter comments if showComments is false
      const isComment = blame.content.trim().startsWith('//') ||
                       blame.content.trim().startsWith('#') ||
                       blame.content.trim().startsWith('/*') ||
                       blame.content.trim().startsWith('*');
      
      return (tableState.showComments || !isComment);
    });

    // Sort data
    if (tableState.sortField && tableState.sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[tableState.sortField as keyof BlameEntry];
        const bVal = b[tableState.sortField as keyof BlameEntry];
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        }
        
        return tableState.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [fileData.blameEntries, tableState.sortField, tableState.sortDirection, tableState.showComments]);

  const paginatedData = useMemo(() => {
    const startIndex = tableState.currentPage * tableState.pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + tableState.pageSize);
  }, [filteredAndSortedData, tableState.currentPage, tableState.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / tableState.pageSize);

  return (
    <div className="h-full flex flex-col">
      {/* File Header */}
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">{fileData.fileName}</h3>
            <p className="text-sm text-muted-foreground">{fileData.filePath}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{fileData.stats.totalLines} lines</span>
            <span>{fileData.stats.totalCommits} commits</span>
            <span>{fileData.stats.uniqueAuthors} authors</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleComments}
              className="text-xs"
            >
              {tableState.showComments ? "Hide Comments" : "Show Comments"}
            </Button>
            
            <select
              value={tableState.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 text-xs border border-border rounded px-2 bg-background"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
            </select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedData.length} lines
            {!tableState.showComments && " (comments hidden)"}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden flex flex-col m-4 mt-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="w-8 p-2 text-left text-xs font-medium text-muted-foreground">#</th>
                {blameColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`p-2 text-left text-xs font-medium text-muted-foreground ${
                      column.sortable ? 'cursor-pointer hover:bg-muted/70' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && onSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && tableState.sortField === column.key && (
                        <span className="text-xs">
                          {tableState.sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((blame, index) => (
                <tr key={`${blame.file}-${blame.line_number}`} className="border-b border-border hover:bg-muted/30">
                  <td className="p-2 text-xs text-muted-foreground">
                    {tableState.currentPage * tableState.pageSize + index + 1}
                  </td>
                  <td className="p-2 text-xs font-mono">{blame.line_number}</td>
                  <td className="p-2 text-xs">{blame.author}</td>
                  <td className="p-2 text-xs font-mono">{blame.commit.substring(0, 8)}</td>
                  <td className="p-2 text-xs">{blame.date}</td>
                  <td className="p-2 text-xs font-mono whitespace-pre-wrap break-all">{blame.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(0)}
                disabled={tableState.currentPage === 0}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(tableState.currentPage - 1)}
                disabled={tableState.currentPage === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {tableState.currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(tableState.currentPage + 1)}
                disabled={tableState.currentPage === totalPages - 1}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages - 1)}
                disabled={tableState.currentPage === totalPages - 1}
              >
                Last
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Jump to page:</span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onJumpToPage()}
                className="w-16 h-8 text-xs"
                placeholder="1"
              />
              <Button variant="outline" size="sm" onClick={onJumpToPage}>
                Go
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}