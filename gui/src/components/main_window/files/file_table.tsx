import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FolderOpen, FileText, } from "lucide-react"
import { getAuthorColor } from "@/components/helpers/author_colors"
import { fmt_pct_abs, time_diff_YMD, MetricHeader} from "@/components/helpers/formatting_helpers"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Repository, AnalysisProps } from "@/components/types"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

function extractFileMetadata(repository: Repository) {
  const fm = repository.files ?? []
  return fm
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
    .sort((a, b) => a.path.localeCompare(b.path))
}

function buildAuthorFileRows(
  repository: Repository,
  metric: "total_commits" | "insertions" | "deletions" | "loc" | "sloc"
) {
  const fileMap = new Map<string, Record<string, number>>()

  for (const a of repository.authors ?? []) {
    const authorName = a.name ?? "Unknown"
    for (const f of a.files ?? []) {
      const value = (f.metrics as any)?.[metric] ?? 0
      const file_path = repository.files.find((file) => file.id === f.id)?.path ?? "Unknown"
      const rec = fileMap.get(file_path) ?? {}
      rec[authorName] = (rec[authorName] ?? 0) + value
      fileMap.set(file_path, rec)
    }
  }

  const rows = Array.from(fileMap.entries()).map(([filePath, authorMetrics]) => ({
    filePath,
    authorMetrics,
    totalMetric: Object.values(authorMetrics).reduce((s, v) => s + v, 0),
  }))

  return rows.sort((a, b) => b.totalMetric - a.totalMetric)
}


function RepositoryViewTable({
  fileMetadata,
  displayMode,
  onFileSelect,
}: {
  fileMetadata: Array<{ path: string; total_commits: number; insertions: number; deletions: number; loc: number; sloc: number; stability: number, last_modified_date: string, last_modified_time: string, last_modified_timezone: string}>
  displayMode: "absolute" | "percentage"
  onFileSelect: (fileName: string) => void
}) {
  const totals = React.useMemo(() => {
    return fileMetadata.reduce(
      (acc, f) => ({
        total_commits: acc.total_commits + f.total_commits,
        insertions: acc.insertions + f.insertions,
        deletions: acc.deletions + f.deletions,
        loc: acc.loc + f.loc,
        sloc: acc.sloc + f.sloc,
      }),
      { total_commits: 0, insertions: 0, deletions: 0, loc: 0, sloc: 0 }
    )
  }, [fileMetadata])

  return (
    <div className="border rounded-lg overflow-auto max-h-[60vh]">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="hover:bg-background">
            <TableHead className="font-semibold sticky left-0 bg-background border-r w-[200px] z-10">File</TableHead>
            <TableHead className="text-right"><MetricHeader metricKey="total_commits" /></TableHead>
            <TableHead className="text-right"><MetricHeader metricKey="insertions" /></TableHead>
            <TableHead className="text-right"><MetricHeader metricKey="deletions" /></TableHead>
            <TableHead className="text-right"><MetricHeader metricKey="loc"/></TableHead>
            <TableHead className="text-right"><MetricHeader metricKey="sloc" /></TableHead>
            <TableHead className="text-right"><MetricHeader metricKey="stability" /></TableHead>
            
            <TableHead className="text-right"><MetricHeader metricKey="last_modified" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-muted/30 hover:bg-muted/40 border-b-2">
            <TableCell className="font-semibold sticky left-0 bg-muted border-r z-10">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span>All Files ({fileMetadata.length})</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-semibold">{totals.total_commits}</TableCell>
            <TableCell className="text-right font-semibold">{totals.insertions}</TableCell>
            <TableCell className="text-right font-semibold">{totals.deletions}</TableCell>
            <TableCell className="text-right font-semibold">{totals.loc}</TableCell>
            <TableCell className="text-right font-semibold">{totals.sloc}</TableCell>
            
            <TableCell className="text-right font-semibold"><span className="text-muted-foreground">-</span></TableCell>
         </TableRow>

          {fileMetadata.map((f) => {

            const iso = `${f.last_modified_date}T${f.last_modified_time}${f.last_modified_timezone}`;
            const lastModified = new Date(iso);  
            const now = new Date();                  
            const diffMs = Math.max(0, now.getTime() - lastModified.getTime());
            const { years, months, days} = time_diff_YMD(diffMs);
            const formattedDate = lastModified.toISOString().slice(0, 10); 
                  const formattedRelative = `${years}y ${months}m ${days}d ago`;

            const lastModifiedDisplay =
              displayMode === "percentage" ? formattedRelative : formattedDate;
      
            return (
            <TableRow key={f.path} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onFileSelect(f.path)}>
              <TableCell
                      className="font-mono text-xs sticky left-0 bg-background border-r z-10"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 w-[300px] overflow-hidden">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{f.path}</span>
                            </div>
                          </TooltipTrigger>

                          <TooltipContent side="right" className="max-w-[600px] break-all">
                            <p className="font-mono text-xs">{f.path}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

              <TableCell className="text-right">{fmt_pct_abs(f.total_commits, totals.total_commits, displayMode)}</TableCell>
              <TableCell className="text-right">{fmt_pct_abs(f.insertions, totals.insertions, displayMode)}</TableCell>
              <TableCell className="text-right">{fmt_pct_abs(f.deletions, totals.deletions, displayMode)}</TableCell>
              <TableCell className="text-right">{fmt_pct_abs(f.loc, totals.loc, displayMode)}</TableCell>
              <TableCell className="text-right">{fmt_pct_abs(f.sloc, totals.sloc, displayMode)}</TableCell>
              <TableCell className="text-right"><span>{f.stability}</span></TableCell>
              <TableCell className="text-right">{lastModifiedDisplay}</TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  )
}

function AuthorFileViewTable({
  rows,
  allAuthors,
  metricType,
  displayMode,
  onFileSelect,
}: {
  rows: Array<{ filePath: string; totalMetric: number; authorMetrics: Record<string, number> }>
  allAuthors: string[]
  metricType: "total_commits" | "insertions" | "deletions" | "loc" | "sloc" 
  displayMode: "absolute" | "percentage"
  onFileSelect: (fileName: string) => void
}) {
  const totals = React.useMemo(() => {
    const authorTotals: Record<string, number> = {}
    let overall = 0
    for (const r of rows) {
      overall += r.totalMetric
      for (const [author, v] of Object.entries(r.authorMetrics)) {
        authorTotals[author] = (authorTotals[author] ?? 0) + v
      }
    }
    return { authorTotals, overall }
  }, [rows])

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="hover:bg-background">
            <TableHead className="font-semibold sticky left-0 bg-background border-r min-w-[200px] z-10">File</TableHead>
            <TableHead className="text-right"><MetricHeader metricKey={metricType}/></TableHead>
            {allAuthors.map((a) => {
              const info = getAuthorColor(a) ?? { color: "#888" }
              return (
                <TableHead key={a} className="text-right font-semibold">
                  <div className="flex flex-col items-end">
                    <span style={{ color: (info as any).color ?? "#888" }}>{(info as any).name ?? a}</span>
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-muted/30 hover:bg-muted/40 border-b-2">
            <TableCell className="font-semibold sticky left-0 bg-muted/30 border-r z-10">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span>All Files ({rows.length})</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-semibold">{totals.overall}</TableCell>
            {allAuthors.map((a) => {
              const v = totals.authorTotals[a] ?? 0
              return (
                <TableCell key={a} className="text-right">
                  {v > 0 ? <span className="text-sm font-medium">{fmt_pct_abs(v, totals.overall, displayMode)}</span> : <span className="text-muted-foreground text-sm">-</span>}
                </TableCell>
              )
            })}
          </TableRow>

          {rows.map((r) => (
            <TableRow key={r.filePath} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onFileSelect(r.filePath)}>
              <TableCell className="font-mono text-xs sticky left-0 bg-background border-r z-10">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{r.filePath}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{r.totalMetric}</TableCell>
              {allAuthors.map((a) => {
                const v = r.authorMetrics[a] ?? 0
                return (
                  <TableCell key={a} className="text-right">
                    {v > 0 ? <span className="text-sm">{fmt_pct_abs(v, r.totalMetric, displayMode)}</span> : <span className="text-muted-foreground text-sm">-</span>}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function FileStatisticsTable({
  repository, 
  setSelectedFile
  }: {repository: Repository} & Pick<AnalysisProps, "setSelectedFile">)  

 {
  const [displayMode, setDisplayMode] = React.useState<"absolute" | "percentage">("absolute")
  const [viewMode, setViewMode] = React.useState<"repo" | "author-file">("repo")
  const [authorFileMetricType, setAuthorFileMetricType] = React.useState<
    "total_commits" | "insertions" | "deletions" | "loc" | "sloc"
  >("total_commits")

  const allAuthors = Array.from(new Set(repository.authors.map((a: any) => (a?.name ?? ""))))

  const fileMetadata = React.useMemo(
      () => extractFileMetadata(repository),
      [repository]
    )

  const authorFileRows = React.useMemo(
      () => buildAuthorFileRows(repository, authorFileMetricType),
      [repository, authorFileMetricType]
    )

    return (
      
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">File Statistics</CardTitle>
              <div className="flex items-center gap-4">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "repo" | "author-file")}>
                  
                  <TabsList className="h-7 bg-gray-200  p-0.5">
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
                  allAuthors={Array.from(allAuthors)}
                  metricType={authorFileMetricType}
                  displayMode={displayMode}
                  onFileSelect={(path) => setSelectedFile(path)}
                />
              )}
            </div>
          </CardContent>
        </Card>
    )
}