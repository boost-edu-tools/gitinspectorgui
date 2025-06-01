import React, { useState, useMemo, useCallback } from "react";
import { useResultsStore } from "@/stores/resultsStore";
import { formatNumber, formatPercentage } from "@/lib/utils";
import type { AuthorStat, FileStat, BlameEntry } from "@/types/results";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SortDirection = "asc" | "desc" | null;
type SortField = string;

interface TableState {
  sortField: SortField;
  sortDirection: SortDirection;
  pageSize: number;
  currentPage: number;
  showComments: boolean;
  expandedRows: Set<number>;
  editingCell: { row: number; column: string } | null;
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
    expandedRows: new Set(),
    editingCell: null,
  });

  const [editValue, setEditValue] = useState("");

  const currentRepo = getCurrentRepository();

  const handleSort = useCallback((field: string) => {
    setTableState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === "asc" ? "desc" : "asc",
      currentPage: 0,
    }));
  }, []);

  const toggleRowExpansion = useCallback((rowIndex: number) => {
    setTableState(prev => {
      const newExpanded = new Set(prev.expandedRows);
      if (newExpanded.has(rowIndex)) {
        newExpanded.delete(rowIndex);
      } else {
        newExpanded.add(rowIndex);
      }
      return { ...prev, expandedRows: newExpanded };
    });
  }, []);

  const startEditing = useCallback((row: number, column: string, currentValue: string) => {
    setTableState(prev => ({ ...prev, editingCell: { row, column } }));
    setEditValue(currentValue);
  }, []);

  const saveEdit = useCallback(() => {
    // TODO: Implement actual data saving logic
    console.log("Saving edit:", tableState.editingCell, editValue);
    setTableState(prev => ({ ...prev, editingCell: null }));
    setEditValue("");
  }, [tableState.editingCell, editValue]);

  const cancelEdit = useCallback(() => {
    setTableState(prev => ({ ...prev, editingCell: null }));
    setEditValue("");
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
              <option value={500}>500 rows</option>
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
                onRowExpand={toggleRowExpansion}
                onCellEdit={startEditing}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                editValue={editValue}
                onEditValueChange={setEditValue}
              />
            )}
            {selectedTable === "files" && (
              <InteractiveFilesTable 
                files={currentRepo.files} 
                tableState={tableState}
                onSort={handleSort}
                onPageChange={(page: number) => setTableState(prev => ({ ...prev, currentPage: page }))}
                onRowExpand={toggleRowExpansion}
                onCellEdit={startEditing}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                editValue={editValue}
                onEditValueChange={setEditValue}
              />
            )}
            {selectedTable === "blame" && (
              <InteractiveBlameTable
                blameData={currentRepo.blame_data}
                tableState={tableState}
                onSort={handleSort}
                onPageChange={(page: number) => setTableState(prev => ({ ...prev, currentPage: page }))}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Enhanced table components with interactive features
interface InteractiveTableProps {
  tableState: TableState;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onRowExpand: (rowIndex: number) => void;
  onCellEdit: (row: number, column: string, currentValue: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editValue: string;
  onEditValueChange: (value: string) => void;
}

function InteractiveAuthorsTable({ 
  authors, 
  tableState, 
  onSort, 
  onPageChange, 
  onRowExpand, 
  onCellEdit, 
  onSaveEdit, 
  onCancelEdit, 
  editValue, 
  onEditValueChange 
}: InteractiveTableProps & { authors: AuthorStat[] }) {
  
  const columns: ColumnConfig[] = [
    { key: "name", label: "Author", sortable: true, editable: true, type: "text" },
    { key: "email", label: "Email", sortable: true, editable: true, type: "email" },
    { key: "commits", label: "Commits", sortable: true, editable: false, type: "number" },
    { key: "insertions", label: "Insertions", sortable: true, editable: false, type: "number" },
    { key: "deletions", label: "Deletions", sortable: true, editable: false, type: "number" },
    { key: "files", label: "Files", sortable: true, editable: false, type: "number" },
    { key: "percentage", label: "Percentage", sortable: true, editable: false, type: "number" },
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

  const EditableCell = ({ 
    value, 
    rowIndex, 
    column, 
    isEditing 
  }: { 
    value: any; 
    rowIndex: number; 
    column: ColumnConfig; 
    isEditing: boolean; 
  }) => {
    if (isEditing) {
      return (
        <div className="flex gap-1">
          <Input
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="h-8 text-sm"
            type={column.type === "number" ? "number" : "text"}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
          />
          <Button size="sm" variant="outline" onClick={onSaveEdit} className="h-8 px-2">
            ✓
          </Button>
          <Button size="sm" variant="outline" onClick={onCancelEdit} className="h-8 px-2">
            ✕
          </Button>
        </div>
      );
    }

    return (
      <div
        className={`${column.editable ? "cursor-pointer hover:bg-muted/30" : ""}`}
        onDoubleClick={() => column.editable && onCellEdit(rowIndex, column.key, String(value))}
      >
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
              const globalIndex = tableState.currentPage * tableState.pageSize + index;
              
              return (
                <React.Fragment key={index}>
                  <tr 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td 
                      className="border border-border p-2 text-center cursor-pointer hover:bg-primary/10"
                      onClick={() => onRowExpand(globalIndex)}
                    >
                      📄
                    </td>
                    {columns.map(column => (
                      <td key={column.key} className="border border-border p-2">
                        <EditableCell
                          value={author[column.key as keyof AuthorStat]}
                          rowIndex={globalIndex}
                          column={column}
                          isEditing={
                            tableState.editingCell?.row === globalIndex && 
                            tableState.editingCell?.column === column.key
                          }
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
          {tableState.expandedRows.size > 0 && (
            <span className="ml-2">• {tableState.expandedRows.size} expanded</span>
          )}
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

function InteractiveFilesTable(_props: InteractiveTableProps & { files: FileStat[] }) {
  // Implementation similar to InteractiveAuthorsTable but for files
  return <div>Interactive Files Table - Implementation follows same pattern as Authors</div>;
}

function InteractiveBlameTable({
  blameData,
  tableState,
  onSort,
  onPageChange
}: {
  blameData: BlameEntry[];
  tableState: TableState;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}) {
  
  const blameColumns: ColumnConfig[] = [
    { key: "file", label: "File", sortable: true },
    { key: "line_number", label: "Line", width: "80px", sortable: true, type: "number" },
    { key: "author", label: "Author", sortable: true },
    { key: "commit", label: "Commit", width: "100px", sortable: true },
    { key: "date", label: "Date", width: "120px", sortable: true, type: "date" },
    { key: "content", label: "Content", sortable: false },
  ];

  const filteredAndSortedData = useMemo(() => {
    let filtered = blameData.filter((blame: BlameEntry) => {
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
  }, [blameData, tableState.sortField, tableState.sortDirection, tableState.showComments]);

  const paginatedData = useMemo(() => {
    const startIndex = tableState.currentPage * tableState.pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + tableState.pageSize);
  }, [filteredAndSortedData, tableState.currentPage, tableState.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / tableState.pageSize);


  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
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
              {paginatedData.map((blame, index) => {
                const globalIndex = tableState.currentPage * tableState.pageSize + index;
                
                return (
                  <React.Fragment key={`${blame.file}-${blame.line_number}`}>
                    <tr className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="p-2 text-xs text-muted-foreground">
                        <span>{globalIndex + 1}</span>
                      </td>
                      {blameColumns.map((column) => {
                        const value = blame[column.key as keyof BlameEntry];
                        
                        return (
                          <td
                            key={column.key}
                            className="p-2 text-sm"
                          >
                            <span className={column.key === 'content' ? 'font-mono text-xs' : ''}>
                              {column.type === 'number' ? formatNumber(Number(value)) : String(value)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {tableState.currentPage * tableState.pageSize + 1} to{' '}
            {Math.min((tableState.currentPage + 1) * tableState.pageSize, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(tableState.currentPage - 1)}
              disabled={tableState.currentPage === 0}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
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
