import React, { useState, useMemo } from "react";
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
  filter: string;
  pageSize: number;
  currentPage: number;
}

export function AdvancedResultsTables() {
  const { results, selectedRepository, selectedTable, selectRepository, selectTable, getCurrentRepository } = useResultsStore();
  
  const [tableState, setTableState] = useState<TableState>({
    sortField: "",
    sortDirection: null,
    filter: "",
    pageSize: 50,
    currentPage: 0,
  });

  const currentRepo = getCurrentRepository();

  const handleSort = (field: string) => {
    setTableState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === "asc" ? "desc" : "asc",
      currentPage: 0,
    }));
  };

  const handleFilter = (value: string) => {
    setTableState(prev => ({
      ...prev,
      filter: value,
      currentPage: 0,
    }));
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === "string" && value.includes(",") ? `"${value}"` : value
      ).join(",")
    );
    
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      {/* Table Controls */}
      <div className="p-4 border-b border-border space-y-4">
        {/* Table Selector */}
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

        {/* Filter and Export Controls */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="Filter results..."
              value={tableState.filter}
              onChange={(e) => handleFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentRepo && selectedTable === "authors") {
                  exportToCSV(currentRepo.authors, `${currentRepo.name}-authors.csv`);
                } else if (currentRepo && selectedTable === "files") {
                  exportToCSV(currentRepo.files, `${currentRepo.name}-files.csv`);
                } else if (currentRepo && selectedTable === "blame") {
                  exportToCSV(currentRepo.blame_data, `${currentRepo.name}-blame.csv`);
                }
              }}
            >
              📊 Export CSV
            </Button>
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
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-hidden">
        {currentRepo && (
          <>
            {selectedTable === "authors" && (
              <AdvancedAuthorsTable
                authors={currentRepo.authors}
                tableState={tableState}
                onSort={handleSort}
                onPageChange={(page: number) => setTableState(prev => ({ ...prev, currentPage: page }))}
              />
            )}
            {selectedTable === "files" && (
              <AdvancedFilesTable
                files={currentRepo.files}
                tableState={tableState}
                onSort={handleSort}
                onPageChange={(page: number) => setTableState(prev => ({ ...prev, currentPage: page }))}
              />
            )}
            {selectedTable === "blame" && (
              <AdvancedBlameTable
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

interface AuthorTableProps {
  authors: AuthorStat[];
  tableState: TableState;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}

interface FileTableProps {
  files: FileStat[];
  tableState: TableState;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}

interface BlameTableProps {
  blameData: BlameEntry[];
  tableState: TableState;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}

function AdvancedAuthorsTable({ authors, tableState, onSort, onPageChange }: AuthorTableProps) {
  const filteredAndSortedData = useMemo(() => {
    let filtered = authors.filter(author =>
      author.name.toLowerCase().includes(tableState.filter.toLowerCase()) ||
      author.email.toLowerCase().includes(tableState.filter.toLowerCase())
    );

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
  }, [authors, tableState.filter, tableState.sortField, tableState.sortDirection]);

  const paginatedData = useMemo(() => {
    const start = tableState.currentPage * tableState.pageSize;
    return filteredAndSortedData.slice(start, start + tableState.pageSize);
  }, [filteredAndSortedData, tableState.currentPage, tableState.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / tableState.pageSize);

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th 
      className="border border-border p-2 text-left cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {tableState.sortField === field && (
          <span className="text-xs">
            {tableState.sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse border border-border">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <SortableHeader field="name">Author</SortableHeader>
              <SortableHeader field="email">Email</SortableHeader>
              <SortableHeader field="commits">Commits</SortableHeader>
              <SortableHeader field="insertions">Insertions</SortableHeader>
              <SortableHeader field="deletions">Deletions</SortableHeader>
              <SortableHeader field="files">Files</SortableHeader>
              <SortableHeader field="percentage">Percentage</SortableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((author, index) => (
              <tr key={index} className="hover:bg-muted/30 transition-colors">
                <td className="border border-border p-2">{author.name}</td>
                <td className="border border-border p-2">{author.email}</td>
                <td className="border border-border p-2 text-right">{formatNumber(author.commits)}</td>
                <td className="border border-border p-2 text-right">{formatNumber(author.insertions)}</td>
                <td className="border border-border p-2 text-right">{formatNumber(author.deletions)}</td>
                <td className="border border-border p-2 text-right">{formatNumber(author.files)}</td>
                <td className="border border-border p-2 text-right">{formatPercentage(author.percentage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
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
            Previous
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
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdvancedFilesTable({ files, tableState, onSort, onPageChange }: FileTableProps) {
  const filteredAndSortedData = useMemo(() => {
    let filtered = files.filter((file: FileStat) =>
      file.name.toLowerCase().includes(tableState.filter.toLowerCase()) ||
      file.path.toLowerCase().includes(tableState.filter.toLowerCase())
    );

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
          return tableState.sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [files, tableState.filter, tableState.sortField, tableState.sortDirection]);

  const paginatedData = useMemo(() => {
    const start = tableState.currentPage * tableState.pageSize;
    return filteredAndSortedData.slice(start, start + tableState.pageSize);
  }, [filteredAndSortedData, tableState.currentPage, tableState.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / tableState.pageSize);

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th 
      className="border border-border p-2 text-left cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {tableState.sortField === field && (
          <span className="text-xs">
            {tableState.sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse border border-border">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <SortableHeader field="name">File</SortableHeader>
              <SortableHeader field="path">Path</SortableHeader>
              <SortableHeader field="lines">Lines</SortableHeader>
              <SortableHeader field="commits">Commits</SortableHeader>
              <SortableHeader field="authors">Authors</SortableHeader>
              <SortableHeader field="percentage">Percentage</SortableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((file, index) => (
              <tr key={index} className="hover:bg-muted/30 transition-colors">
                <td className="border border-border p-2">{file.name}</td>
                <td className="border border-border p-2 font-mono text-xs">{file.path}</td>
                <td className="border border-border p-2 text-right">{formatNumber(file.lines)}</td>
                <td className="border border-border p-2 text-right">{formatNumber(file.commits)}</td>
                <td className="border border-border p-2 text-right">{formatNumber(file.authors)}</td>
                <td className="border border-border p-2 text-right">{formatPercentage(file.percentage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
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
            Previous
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
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdvancedBlameTable({ blameData, tableState, onSort, onPageChange }: BlameTableProps) {
  const filteredAndSortedData = useMemo(() => {
    let filtered = blameData.filter((blame: BlameEntry) =>
      blame.file.toLowerCase().includes(tableState.filter.toLowerCase()) ||
      blame.author.toLowerCase().includes(tableState.filter.toLowerCase()) ||
      blame.content.toLowerCase().includes(tableState.filter.toLowerCase())
    );

    if (tableState.sortField && tableState.sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[tableState.sortField as keyof BlameEntry];
        const bVal = b[tableState.sortField as keyof BlameEntry];
        
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
  }, [blameData, tableState.filter, tableState.sortField, tableState.sortDirection]);

  const paginatedData = useMemo(() => {
    const start = tableState.currentPage * tableState.pageSize;
    return filteredAndSortedData.slice(start, start + tableState.pageSize);
  }, [filteredAndSortedData, tableState.currentPage, tableState.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / tableState.pageSize);

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th 
      className="border border-border p-2 text-left cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {tableState.sortField === field && (
          <span className="text-xs">
            {tableState.sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse border border-border">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <SortableHeader field="file">File</SortableHeader>
              <SortableHeader field="line_number">Line</SortableHeader>
              <SortableHeader field="author">Author</SortableHeader>
              <SortableHeader field="commit">Commit</SortableHeader>
              <SortableHeader field="date">Date</SortableHeader>
              <SortableHeader field="content">Content</SortableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((blame, index) => (
              <tr key={index} className="hover:bg-muted/30 transition-colors">
                <td className="border border-border p-2 font-mono text-xs">{blame.file}</td>
                <td className="border border-border p-2 text-right">{blame.line_number}</td>
                <td className="border border-border p-2">{blame.author}</td>
                <td className="border border-border p-2 font-mono text-xs">{blame.commit}</td>
                <td className="border border-border p-2">{blame.date}</td>
                <td className="border border-border p-2 font-mono text-xs max-w-md truncate">{blame.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
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
            Previous
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
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}