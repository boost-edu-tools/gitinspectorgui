import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FolderOpen, FileText, Info } from "lucide-react"
import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { METRIC_DESCRIPTIONS } from "@/components/main_window/metrics_descriptions"

export type MetricKey = keyof typeof METRIC_DESCRIPTIONS

interface MetricHeaderProps {
  metricKey: MetricKey
}

export function MetricHeader({ metricKey }: MetricHeaderProps) {
  const info = METRIC_DESCRIPTIONS[metricKey]
  return (
    <div className="flex items-center gap-1 justify-end">
      <span>{info.label}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{info.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}


/* -------- Repository view table -------- */

export function RepositoryViewTable({
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

  const fmt = (v: number, total: number) => (displayMode === "percentage" ? `${total ? ((v / total) * 100).toFixed(0) : "0.0"}%` : String(v))

  return (
    <div className="border rounded-lg overflow-x-auto">
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
            
            <TableHead className="text-right"><MetricHeader metricKey="age" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-muted/30 hover:bg-muted/40 border-b-2">
            <TableCell className="font-semibold sticky left-0 bg-muted/30 border-r z-10">
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

            const diffToYDH = (ms: number) => {
                  const MS_PER_HOUR = 60 * 60 * 1000;
                  const MS_PER_DAY  = 24 * MS_PER_HOUR;
                  const MS_PER_YEAR = 365 * MS_PER_DAY; 

                  const years = Math.floor(ms / MS_PER_YEAR);
                  ms %= MS_PER_YEAR;
                  const days  = Math.floor(ms / MS_PER_DAY);
                  ms %= MS_PER_DAY;
                  const hours = Math.floor(ms / MS_PER_HOUR);

                  return { years, days, hours };
                };

            let ageYDH: string | undefined;
            const iso = `${f.last_modified_date}T${f.last_modified_time}${f.last_modified_timezone}`;
            const lastModified = new Date(iso);  
            const now = new Date();                  
            const diffMs = Math.max(0, now.getTime() - lastModified.getTime());
            const { years, days, hours } = diffToYDH(diffMs);
            ageYDH = `${years}:${days}:${hours}`;
            
            return (
            <TableRow key={f.path} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onFileSelect(f.path)}>
              <TableCell className="font-mono text-xs sticky left-0 bg-background border-r z-10">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{f.path}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{fmt(f.total_commits, totals.total_commits)}</TableCell>
              <TableCell className="text-right">{fmt(f.insertions, totals.insertions)}</TableCell>
              <TableCell className="text-right">{fmt(f.deletions, totals.deletions)}</TableCell>
              <TableCell className="text-right">{fmt(f.loc, totals.loc)}</TableCell>
              <TableCell className="text-right">{fmt(f.sloc, totals.sloc)}</TableCell>
              <TableCell className="text-right"><span>{f.stability}</span></TableCell>
              <TableCell className="text-right">{ageYDH}</TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  )
}

/* -------- Author-file view table -------- */

export function AuthorFileViewTable({
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

  const fmt = (v: number, total: number) => (displayMode === "percentage" ? `${total ? ((v / total) * 100).toFixed(0) : "0.0"}%` : String(v))

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
                  {v > 0 ? <span className="text-sm font-medium">{fmt(v, totals.overall)}</span> : <span className="text-muted-foreground text-sm">-</span>}
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
                    {v > 0 ? <span className="text-sm">{fmt(v, r.totalMetric)}</span> : <span className="text-muted-foreground text-sm">-</span>}
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
