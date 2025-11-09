import * as React from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { useAnalysis } from "@/hooks/useAnalysis"
import type { AnalysisResult, SelectedFullProps } from "@/components/types"

import { RepositoryViewTable, AuthorFileViewTable } from "@/components/main_window/files/files_table"
import { BlameTabsView } from "@/components/main_window/files/blame_view_tabs"
import { FileActivityChart } from "@/components/main_window/files/file_activity"

/* -------- helpers (no commit-range filtering) -------- */

function extractFileMetadata(analysis: AnalysisResult | undefined, fileIdsToShow: string[]) {
  const fm = analysis?.repository?.files ?? []
  return fm
    .filter((f) => fileIdsToShow.includes(f.path))
    .map((f) => ({
      path: f.path,
      total_commits: f.metrics?.total_commits ?? 0,
      insertions: f.metrics?.insertions ?? 0,
      deletions: f.metrics?.deletions ?? 0,
      loc: f.metrics?.loc ?? 0,
      sloc: f.metrics?.sloc ?? 0,
      stability: f.metrics?.stability ?? 0,
      last_modified_date: f.last_modified_date ?? "",
      last_modified_time: f.last_modified_time ?? "",
      last_modified_timezone: f.last_modified_timezone ?? ""
    }))
    .sort((a, b) => b.total_commits - a.total_commits)
}

function buildAuthorFileRows(
  analysis: AnalysisResult | undefined,
  metric: "total_commits" | "insertions" | "deletions" | "loc" | "sloc",
  fileIdsToShow: string[]
) {
  const repo = analysis?.repository
  if (!repo) return []

  const fileMap = new Map<string, Record<string, number>>()

  for (const a of repo.authors ?? []) {
    const authorName = a.name ?? "Unknown"
    for (const f of a.files ?? []) {
      if (!fileIdsToShow.includes(f.file_path)) continue
      const value = (f.metrics as any)?.[metric] ?? 0
      const rec = fileMap.get(f.file_path) ?? {}
      rec[authorName] = (rec[authorName] ?? 0) + value
      fileMap.set(f.file_path, rec)
    }
  }

  const rows = Array.from(fileMap.entries()).map(([filePath, authorMetrics]) => ({
    filePath,
    authorMetrics,
    totalMetric: Object.values(authorMetrics).reduce((s, v) => s + v, 0),
  }))

  return rows.sort((a, b) => b.totalMetric - a.totalMetric)
}

/* -------- main -------- */

export function UnifiedFilesView({
  allAuthors: allAuthorsSet,
  selectedAuthors,
  allFiles: allFilesSet,
  selectedFiles,
  filterData,
  selectedRepo,
}: Pick<
  SelectedFullProps,
  | "allAuthors"
  | "selectedAuthors"
  | "allFiles"
  | "selectedFiles"
  | "filterData"
  | "selectedRepo"
>) {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null)
  const [displayMode, setDisplayMode] = React.useState<"absolute" | "percentage">("absolute")
  const [authorFileMetricType, setAuthorFileMetricType] = React.useState<
    "total_commits" | "insertions" | "deletions" | "loc" | "sloc"
  >("total_commits")
  const [viewMode, setViewMode] = React.useState<"repo" | "author-file">("repo")

  const { analysis, isLoading, error } = useAnalysis(selectedRepo)

  // All repo files (no commit-range filtering)
  const repoFiles = React.useMemo(() => {
    const files = (analysis as AnalysisResult | undefined)?.repository?.files ?? []
    return files
  }, [analysis])

  const fileIdsToShow = React.useMemo(
    () => (filterData ? selectedFiles : Array.from(allFilesSet)),
    [filterData, selectedFiles, allFilesSet]
  )

  const visibleRepoFiles = React.useMemo(
    () => repoFiles.filter((f) => fileIdsToShow.includes(f.path)),
    [repoFiles, fileIdsToShow]
  )

  React.useEffect(() => {
    if (selectedFile && !fileIdsToShow.includes(selectedFile)) setSelectedFile(null)
  }, [selectedFile, fileIdsToShow])

  const fileMetadata = React.useMemo(
    () => extractFileMetadata(analysis as AnalysisResult | undefined, fileIdsToShow),
    [analysis, fileIdsToShow]
  )

  const authorFileRows = React.useMemo(
    () => buildAuthorFileRows(analysis as AnalysisResult | undefined, authorFileMetricType, fileIdsToShow),
    [analysis, authorFileMetricType, fileIdsToShow]
  )

  const baseAuthors = React.useMemo(
    () => (filterData ? selectedAuthors : Array.from(allAuthorsSet)),
    [filterData, selectedAuthors, allAuthorsSet]
  )

  const displayedAuthors = React.useMemo(() => {
    if (baseAuthors.length === 0) return []
    const totals: Record<string, number> = {}
    authorFileRows.forEach((row) => {
      Object.entries(row.authorMetrics).forEach(([name, v]) => {
        totals[name] = (totals[name] ?? 0) + v
      })
    })
    return [...baseAuthors].sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0))
  }, [baseAuthors, authorFileRows])

  if (error) {
    return (
      <div className="space-y-2 py-4">
        <div className="text-sm text-red-600">Failed to load analysis.</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    )
  }

  // Build maps once for blame tabs (author names & commits)
  const repo = (analysis as AnalysisResult | undefined)?.repository
  const authorsById = new Map(repo?.authors?.map((a) => [a.id, a]) ?? [])

  // If a file is selected from the table, show the multi-file blame view.
  if (selectedFile) {
    return (
      <div className="space-y-2 py-4 mt-4 px-8">
        <BlameTabsView
          selectedRepo={selectedRepo}
          availableFiles={visibleRepoFiles}
          initialPath={selectedFile}
          authorsById={authorsById}
          selectedAuthors={displayedAuthors}
          onExit={() => setSelectedFile(null)}
        />
      </div>
    )
  }

  // Otherwise, show the visualization and tables
  return (
    <div className="mt-4 px-8">
      <div className="p-4">
        {/* File Activity Chart */}
        <FileActivityChart
          allAuthors={allAuthorsSet}
          selectedAuthors={selectedAuthors}
          allFiles={allFilesSet}
          selectedFiles={selectedFiles}
          filterData={filterData}
          selectedRepo={selectedRepo}
          /* no start/end commit hash props */
        />
      </div>

      {/* File Statistics Table */}
      <div className="p-4">
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">File Statistics</CardTitle>
              <div className="flex items-center gap-4">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "repo" | "author-file")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger className="text-[10px]" value="repo">All authors</TabsTrigger>
                    <TabsTrigger className="text-[10px]" value="author-file">Per author</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="display-mode" className="text-[13px]">
                    Relative
                  </Label>
                  <Switch
                    id="display-mode"
                    checked={displayMode === "percentage"}
                    onCheckedChange={(checked) => setDisplayMode(checked ? "percentage" : "absolute")}
                  />
                </div>
              </div>
            </div>

            {viewMode === "author-file" && (
              <div className="flex items-center gap-2 pb-2">
                <Label htmlFor="metric-type" className="text-sm">
                  Metric:
                </Label>
                <Select
                  value={authorFileMetricType}
                  onValueChange={(v) =>
                    setAuthorFileMetricType(v as "total_commits" | "insertions" | "deletions" | "loc" | "sloc")
                  }
                >
                  <SelectTrigger id="metric-type" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_commits">Commits</SelectItem>
                    <SelectItem value="loc">LOC</SelectItem>
                    <SelectItem value="sloc">SLOC</SelectItem>
                    <SelectItem value="insertions">Insertions</SelectItem>
                    <SelectItem value="deletions">Deletions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid w-full [&>div]:border [&>div]:rounded overflow-x-auto">
              <p className="text-xs text-muted-foreground pb-4">
                Click on any file in the table below to view its detailed blame information
              </p>

              {viewMode === "repo" ? (
                <RepositoryViewTable
                  fileMetadata={fileMetadata}
                  displayMode={displayMode}
                  onFileSelect={(path) => setSelectedFile(path)}
                />
              ) : (
                <AuthorFileViewTable
                  rows={authorFileRows}
                  allAuthors={displayedAuthors}
                  metricType={authorFileMetricType}
                  displayMode={displayMode}
                  onFileSelect={(path) => setSelectedFile(path)}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
