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

/* -------- helpers -------- */

function filesInCommitRange(
  analysis: AnalysisResult | undefined,
  startCommitHash?: string,
  endCommitHash?: string
) {
  const repo = analysis?.repository
  if (!repo) return []

  const commits = repo.commits ?? []
  const sorted = [...commits].sort((a, b) => +new Date(a.date) - +new Date(b.date))

  let start = 0
  let end = sorted.length - 1
  if (startCommitHash) {
    const i = sorted.findIndex((c) => c.hash === startCommitHash)
    if (i !== -1) start = i
  }
  if (endCommitHash) {
    const i = sorted.findIndex((c) => c.hash === endCommitHash)
    if (i !== -1) end = i
  }

  const allowed = new Set(sorted.slice(start, end + 1).map((c) => c.hash))
  const limited = (repo.files ?? []).map((f) => {
    const lines = (f.lines ?? []).filter((ln) =>
      startCommitHash || endCommitHash ? allowed.has(ln.commitHash) : true
    )
    return { ...f, lines }
  })

  return limited
    .filter((f) => f.lines.length > 0)
    .sort((a, b) => a.path.localeCompare(b.path))
}

function extractFileMetadata(analysis: AnalysisResult | undefined, fileIdsToShow: string[]) {
  const fm = analysis?.repository?.files_metadata ?? []
  return fm
    .filter((f) => fileIdsToShow.includes(f.path))
    .map((f) => ({
      path: f.path,
      commits: f.metrics?.commits ?? 0,
      insertions: f.metrics?.insertions ?? 0,
      deletions: f.metrics?.deletions ?? 0,
      loc: f.metrics?.loc ?? 0,
      sloc: f.metrics?.sloc ?? 0,
      age: f.metrics?.age ?? 0,
    }))
    .sort((a, b) => b.commits - a.commits)
}

function buildAuthorFileRows(
  analysis: AnalysisResult | undefined,
  metric: "commits" | "insertions" | "deletions" | "loc" | "sloc",
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
  startCommitHash,
  endCommitHash,
}: Pick<
  SelectedFullProps,
  | "allAuthors"
  | "selectedAuthors"
  | "allFiles"
  | "selectedFiles"
  | "filterData"
  | "selectedRepo"
  | "startCommitHash"
  | "endCommitHash"
>) {
  
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null)
  const [displayMode, setDisplayMode] = React.useState<"absolute" | "percentage">("percentage")
  const [authorFileMetricType, setAuthorFileMetricType] = React.useState<
    "commits" | "insertions" | "deletions" | "loc" | "sloc"
  >("loc")
  const [viewMode, setViewMode] = React.useState<"repo" | "author-file">("repo")

  const { analysis, isLoading, error } = useAnalysis(selectedRepo)

  const repoFiles = React.useMemo(
    () => filesInCommitRange(analysis as AnalysisResult | undefined, startCommitHash, endCommitHash),
    [analysis, startCommitHash, endCommitHash]
  )

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

  // Build maps once for blame tabs (commit numbers & author names)
  const repo = (analysis as AnalysisResult | undefined)?.repository
  const authorsById = new Map(repo?.authors?.map((a) => [a.id, a]) ?? [])
  const commitsByHash = new Map(repo?.commits?.map((c) => [c.hash, c]) ?? [])

  // If a file is selected from the table, show the multi-file blame view.
  if (selectedFile) {
    return (
      <div className="space-y-2 py-4">
        <BlameTabsView
          availableFiles={visibleRepoFiles}
          initialPath={selectedFile}
          authorsById={authorsById}
          commitsByHash={commitsByHash}
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
        startCommitHash={startCommitHash}
        endCommitHash={endCommitHash}
      />
      </div>

      {/* File Statistics Table */}
      <div className="p-4">
      <Card>
        <CardContent className="pt-2 pb-3">
          <div className="space-y-2 py-2">

              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">File Statistics</CardTitle>
                <div className="flex items-center gap-4">
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "repo" | "author-file")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="repo">All authors</TabsTrigger>
                      <TabsTrigger value="author-file">Per author</TabsTrigger>
                    </TabsList>
                  </Tabs>


                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="display-mode" className="text-sm">
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="metric-type" className="text-sm">
                    Metric:
                  </Label>
                  <Select
                    value={authorFileMetricType}
                    onValueChange={(v) =>
                      setAuthorFileMetricType(v as "commits" | "insertions" | "deletions" | "loc" | "sloc")
                    }
                  >
                    <SelectTrigger id="metric-type" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commits">Commits</SelectItem>
                      <SelectItem value="loc">LOC</SelectItem>
                      <SelectItem value="sloc">SLOC</SelectItem>
                      <SelectItem value="insertions">Insertions</SelectItem>
                      <SelectItem value="deletions">Deletions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid w-full [&>div]:border [&>div]:rounded overflow-x-auto py-4">
                <p className="text-xs text-muted-foreground">
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
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}