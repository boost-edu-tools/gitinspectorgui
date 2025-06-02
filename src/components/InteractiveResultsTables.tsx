import React, { useState, useMemo, useCallback } from "react";
import { useResultsStore } from "@/stores/resultsStore";
import { formatNumber, formatPercentage } from "@/lib/utils";
import type { AuthorStat, FileStat } from "@/types/results";
import { Button } from "@/components/ui/button";
import { BlameFileTabsInterface } from "./BlameFileTabsInterface";

type SortDirection = "asc" | "desc" | null;
type SortField = string;

interface TableState {
  sortField: SortField;
  sortDirection: SortDirection;
  pageSize: number;
  currentPage: number;
  showComments: boolean;
}

interface ColumnConfig {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  editable?: boolean;
  type?: "text" | "number" | "email" | "date";
}

export function InteractiveResultsTables() {
  const { results, selectedRepository, selectedTable, selectRepository, selectTable, getCurrentRepository } = useResultsStore();
  
  
  const [tableState, setTableState] = useState<TableState>({
    sortField: "",
    sortDirection: null,
    pageSize: 50,
    currentPage: 0,
    showComments: true,
  });

  const currentRepo = getCurrentRepository();

  const handleSort = useCallback((field: string) => {
    setTableState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === "asc" ? "desc" : "asc",
      currentPage: 0,
    }));
  }, []);

  const toggleComments = useCallback(() => {
    setTableState(prev => ({ ...prev, showComments: !prev.showComments }));
  }, []);


  if (!results) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Repository Selector */}
      {results.repositories.length > 1 && (
        <div className="p-4 border-b border-border">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Repository:
          </label>
          <select
            value={selectedRepository || ""}
            onChange={(e) => selectRepository(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background text-foreground"
          >
            {results.repositories.map((repo) => (
              <option key={repo.name} value={repo.name}>
                {repo.name} ({repo.path})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Enhanced Table Controls */}
      <div className="p-4 border-b border-border space-y-4">
        {/* Table Selector with Enhanced Icons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => selectTable("authors")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTable === "authors"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            👥 Authors ({currentRepo?.authors.length || 0})
          </button>
          <button
            onClick={() => selectTable("files")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTable === "files"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            📄 Files ({currentRepo?.files.length || 0})
          </button>
          <button
            onClick={() => selectTable("blame")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTable === "blame"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            🔍 Blame ({currentRepo?.blame_data.length || 0})
          </button>
        </div>

        {/* Enhanced Filter and Control Bar */}
        <div className="flex gap-4 items-center flex-wrap">
          
          <div className="flex gap-2 items-center">
            {/* Comment Toggle for Blame Table */}
            {selectedTable === "blame" && (
              <Button
                variant={tableState.showComments ? "default" : "outline"}
                size="sm"
                onClick={toggleComments}
              >
                💬 {tableState.showComments ? "Hide" : "Show"} Comments
              </Button>
            )}
            
            {/* Export Button */}
            
            {/* Page Size Selector */}
            <select
              value={tableState.pageSize}
              onChange={(e) => setTableState(prev => ({ ...prev, pageSize: parseInt(e.target.value), currentPage: 0 }))}
              className="px-3 py-1 border border-input rounded-md bg-background text-foreground text-sm"
            >
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={250}>250 rows</option>
              <option value={500}>500 rows</option>
              <option value={1000}>1000 rows</option>
            </select>
          </div>
        </div>

        {/* Interactive Features Info */}
        <div className="text-xs text-muted-foreground flex gap-4">
          <span>💡 Click column headers to sort</span>
          {selectedTable === "blame" && <span>💬 Toggle comment visibility</span>}
        </div>
      </div>

      {/* Interactive Table Content */}
      <div className="flex-1 overflow-hidden">
        {currentRepo && (
          <>
            {selectedTable === "authors" && (
              <InteractiveAuthorsTable
                authors={currentRepo.authors}
                tableState={tableState}
                onSort={handleSort}
                onPageChange={(page: number) => setTableState(prev => ({ ...prev, currentPage: page }))}
              />
            )}
            {selectedTable === "files" && (
              <InteractiveFilesTable
                files={currentRepo.files}
                tableState={tableState}
                onSort={handleSort}
                onPageChange={(page: number) => setTableState(prev => ({ ...prev, currentPage: page }))}
              />
            )}
            {selectedTable === "blame" && (
              <BlameFileTabsInterface />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Enhanced table components with interactive features

function InteractiveAuthorsTable({
  authors,
  tableState,
  onSort,
  onPageChange
}: {
  authors: AuthorStat[];
  tableState: TableState;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}) {
  
  const columns: ColumnConfig[] = [
    { key: "name", label: "Author", sortable: true, editable: true, type: "text" },
    { key: "email", label: "Email", sortable: true, editable: true, type: "email" },
    { key: "commits", label: "Commits", sortable: true, editable: false, type: "number" },
    { key: "insertions", label: "Insertions", sortable: true, editable: false, type: "number" },
    { key: "deletions", label: "Deletions", sortable: true, editable: false, type: "number" },
    { key: "files", label: "Files", sortable: true, editable: false, type: "number" },
    { key: "percentage", label: "Percentage", sortable: true, editable: false, type: "number" },
    { key: "age", label: "Age", sortable: true, editable: false, type: "text" },
  ];

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...authors]; // Create a copy to sort

    if (tableState.sortField && tableState.sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[tableState.sortField as keyof AuthorStat];
        const bVal = b[tableState.sortField as keyof AuthorStat];
        
        if (typeof aVal === "string" && typeof bVal === "string") {
          return tableState.sortDirection === "asc" 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return tableState.sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [authors, tableState.sortField, tableState.sortDirection]);

  const paginatedData = useMemo(() => {
    const start = tableState.currentPage * tableState.pageSize;
    return filteredAndSortedData.slice(start, start + tableState.pageSize);
  }, [filteredAndSortedData, tableState.currentPage, tableState.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / tableState.pageSize);

  const SortableHeader = ({ column }: { column: ColumnConfig }) => (
    <th 
      className={`border border-border p-2 text-left select-none ${
        column.sortable ? "cursor-pointer hover:bg-muted/50" : ""
      }`}
      onClick={() => column.sortable && onSort(column.key)}
    >
      <div className="flex items-center gap-1">
        {column.label}
        {column.sortable && tableState.sortField === column.key && (
          <span className="text-xs">
            {tableState.sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );

  const SimpleCell = ({
    value,
    column
  }: {
    value: any;
    column: ColumnConfig;
  }) => {
    return (
      <div>
        {column.type === "number" && typeof value === "number"
          ? column.key === "percentage" ? formatPercentage(value) : formatNumber(value)
          : String(value)
        }
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse border border-border">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="border border-border p-2 w-8">#</th>
              {columns.map(column => (
                <SortableHeader key={column.key} column={column} />
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((author, index) => {
              return (
                <React.Fragment key={index}>
                  <tr 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="border border-border p-2 text-center">
                      {tableState.currentPage * tableState.pageSize + index + 1}
                    </td>
                    {columns.map(column => (
                      <td key={column.key} className="border border-border p-2">
                        <SimpleCell
                          value={author[column.key as keyof AuthorStat]}
                          column={column}
                        />
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Enhanced Pagination */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {tableState.currentPage * tableState.pageSize + 1} to {Math.min((tableState.currentPage + 1) * tableState.pageSize, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(tableState.currentPage - 1)}
            disabled={tableState.currentPage === 0}
          >
            ← Previous
          </Button>
          <span className="px-3 py-1 text-sm">
            Page {tableState.currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(tableState.currentPage + 1)}
            disabled={tableState.currentPage >= totalPages - 1}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}

// Similar implementations for InteractiveFilesTable and InteractiveBlameTable would follow
// For brevity, I'll implement them as simplified versions that extend the same pattern

function InteractiveFilesTable({
  files,
  tableState,
  onSort,
  onPageChange
}: {
  files: FileStat[];
  tableState: TableState;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}) {
  
  const columns: ColumnConfig[] = [
    { key: "name", label: "File", sortable: true, editable: false, type: "text" },
    { key: "path", label: "Path", sortable: true, editable: false, type: "text" },
    { key: "lines", label: "Lines", sortable: true, editable: false, type: "number" },
    { key: "commits", label: "Commits", sortable: true, editable: false, type: "number" },
    { key: "authors", label: "Authors", sortable: true, editable: false, type: "number" },
    { key: "percentage", label: "Percentage", sortable: true, editable: false, type: "number" },
  ];

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...files]; // Create a copy to sort

    if (tableState.sortField && tableState.sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[tableState.sortField as keyof FileStat];
        const bVal = b[tableState.sortField as keyof FileStat];
        
        if (typeof aVal === "string" && typeof bVal === "string") {
          return tableState.sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return tableState.sortDirection === "asc"
            ? aVal - bVal
            : bVal - aVal;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [files, tableState.sortField, tableState.sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = tableState.currentPage * tableState.pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + tableState.pageSize);
  }, [filteredAndSortedData, tableState.currentPage, tableState.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / tableState.pageSize);

  return (
    <div className="interactive-table-container">
      <div className="table-container">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`border border-border p-2 text-left select-none ${
                    column.sortable ? "cursor-pointer hover:bg-muted/50" : ""
                  }`}
                  onClick={() => column.sortable && onSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && tableState.sortField === column.key && (
                      <span className="text-xs">
                        {tableState.sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((file, index) => (
              <tr key={index} className="table-row-hover">
                <td className="border border-border p-2">{file.name}</td>
                <td className="border border-border p-2">{file.path}</td>
                <td className="border border-border p-2 text-right">{formatNumber(file.lines)}</td>
                <td className="border border-border p-2 text-right">{formatNumber(file.commits)}</td>
                <td className="border border-border p-2 text-right">{formatNumber(file.authors)}</td>
                <td className="border border-border p-2 text-right">{formatPercentage(file.percentage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="pagination-controls flex items-center justify-between mt-4 p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {tableState.currentPage * tableState.pageSize + 1} to{" "}
            {Math.min((tableState.currentPage + 1) * tableState.pageSize, filteredAndSortedData.length)} of{" "}
            {filteredAndSortedData.length} files
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(tableState.currentPage - 1)}
              disabled={tableState.currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {tableState.currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(tableState.currentPage + 1)}
              disabled={tableState.currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

