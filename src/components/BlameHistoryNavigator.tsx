import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useResultsStore } from "@/stores/resultsStore";
import { formatDate } from "@/lib/utils";
import type { BlameEntry } from "@/types/results";

interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
  filesChanged: number;
  linesChanged: number;
}

interface BlameHistoryState {
  selectedCommit: string | null;
  commitHistory: CommitInfo[];
  filteredBlameData: BlameEntry[];
}

export function BlameHistoryNavigator() {
  const { results, getCurrentRepository } = useResultsStore();
  
  const [historyState, setHistoryState] = useState<BlameHistoryState>({
    selectedCommit: null,
    commitHistory: [],
    filteredBlameData: [],
  });

  const currentRepo = getCurrentRepository();

  // Generate commit history from blame data
  const commitHistory = useMemo(() => {
    if (!currentRepo?.blame_data) return [];

    const commitMap = new Map<string, CommitInfo>();
    
    currentRepo.blame_data.forEach(blame => {
      if (!commitMap.has(blame.commit)) {
        commitMap.set(blame.commit, {
          hash: blame.commit,
          author: blame.author,
          date: blame.date,
          message: `Commit ${blame.commit.substring(0, 7)}`, // Mock message
          filesChanged: 0,
          linesChanged: 0,
        });
      }
      
      const commit = commitMap.get(blame.commit)!;
      commit.linesChanged++;
    });

    // Calculate files changed per commit
    currentRepo.blame_data.forEach(blame => {
      const commit = commitMap.get(blame.commit)!;
      const filesInCommit = new Set(
        currentRepo.blame_data
          .filter(b => b.commit === blame.commit)
          .map(b => b.file)
      );
      commit.filesChanged = filesInCommit.size;
    });

    return Array.from(commitMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [currentRepo?.blame_data]);

  // Filter blame data based on selected commit
  const filteredBlameData = useMemo(() => {
    if (!currentRepo?.blame_data) return [];
    if (!historyState.selectedCommit) return currentRepo.blame_data;
    
    return currentRepo.blame_data.filter(blame =>
      blame.commit === historyState.selectedCommit
    );
  }, [currentRepo?.blame_data, historyState.selectedCommit]);


  const selectCommit = useCallback((commitHash: string | null) => {
    setHistoryState(prev => ({
      ...prev,
      selectedCommit: commitHash,
    }));
  }, []);



  // Auto-select the first commit when commits are available
  useEffect(() => {
    if (commitHistory.length > 0 && !historyState.selectedCommit) {
      selectCommit(commitHistory[0].hash);
    }
  }, [commitHistory, historyState.selectedCommit, selectCommit]);

  if (!results || !currentRepo) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No repository data available for blame history navigation.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            🕒 Blame History Navigator
          </h3>
          <div className="flex gap-2">
          </div>
        </div>


      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Commit History Sidebar */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border bg-muted/30">
            <h4 className="font-medium text-sm">📜 Commit History</h4>
          </div>
          
          <div className="flex-1 overflow-auto">
            {commitHistory.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No commits found matching filter.</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {commitHistory.map((commit) => (
                  <div
                    key={commit.hash}
                    className={`p-3 rounded-md cursor-pointer transition-colors border ${
                      historyState.selectedCommit === commit.hash
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted/50 border-transparent"
                    }`}
                    onClick={() => selectCommit(commit.hash)}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium font-mono">
                        {commit.hash.substring(0, 7)}
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Blame Data Visualization */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border bg-muted/30">
            <h4 className="font-medium text-sm">
              🔍 Blame Data 
              {historyState.selectedCommit && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Commit: {historyState.selectedCommit.substring(0, 7)})
                </span>
              )}
            </h4>
          </div>
          
          <div className="flex-1 overflow-auto">
            {filteredBlameData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="space-y-2">
                  <p className="text-lg">📭 No blame data available</p>
                  <p className="text-sm">
                    {historyState.selectedCommit 
                      ? "No blame entries found for the selected commit."
                      : "No blame data available for this repository."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <BlameDataTable 
                blameData={filteredBlameData}
                selectedCommit={historyState.selectedCommit}
                onCommitClick={selectCommit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>
            💡 Click commits to filter blame data • Double-click commit hashes to navigate
          </span>
          <span>
            {filteredBlameData.length} blame entries displayed
          </span>
        </div>
      </div>
    </div>
  );
}

interface BlameDataTableProps {
  blameData: BlameEntry[];
  selectedCommit: string | null;
  onCommitClick: (commitHash: string) => void;
}

function BlameDataTable({ blameData, selectedCommit, onCommitClick }: BlameDataTableProps) {
  const [sortField, setSortField] = useState<keyof BlameEntry>("line_number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    return [...blameData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  }, [blameData, sortField, sortDirection]);

  const handleSort = (field: keyof BlameEntry) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({ field, children }: { field: keyof BlameEntry; children: React.ReactNode }) => (
    <th 
      className="border border-border p-2 text-left cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">
            {sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse border border-border">
        <thead className="sticky top-0 bg-muted">
          <tr>
            <SortableHeader field="file">📄 File</SortableHeader>
            <SortableHeader field="line_number">Line</SortableHeader>
            <SortableHeader field="author">Author</SortableHeader>
            <SortableHeader field="commit">Commit</SortableHeader>
            <SortableHeader field="date">📅 Date</SortableHeader>
            <SortableHeader field="content">📝 Content</SortableHeader>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((blame, index) => (
            <tr 
              key={index} 
              className={`hover:bg-muted/30 transition-colors ${
                selectedCommit === blame.commit ? "bg-primary/10" : ""
              }`}
            >
              <td className="border border-border p-2 font-mono text-xs">
                {blame.file}
              </td>
              <td className="border border-border p-2 text-right">
                {blame.line_number}
              </td>
              <td className="border border-border p-2">
                {blame.author}
              </td>
              <td className="border border-border p-2">
                <code 
                  className={`text-xs cursor-pointer hover:bg-primary/20 px-1 rounded transition-colors ${
                    selectedCommit === blame.commit ? "bg-primary/30" : "bg-muted"
                  }`}
                  onClick={() => onCommitClick(blame.commit)}
                  onDoubleClick={() => onCommitClick(blame.commit)}
                >
                  {blame.commit.substring(0, 7)}
                </code>
              </td>
              <td className="border border-border p-2 text-sm">
                {formatDate(blame.date)}
              </td>
              <td className="border border-border p-2 font-mono text-xs max-w-md">
                <div className="truncate" title={blame.content}>
                  {blame.content}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}