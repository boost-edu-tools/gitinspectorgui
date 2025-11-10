import { useMemo, useState } from "react"
import { GitCommit, Plus, Minus, Folder } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getAuthorColor } from "@/components/helpers/AuthorColors"
import type { AnalysisProps, AnalysisResult, Metrics } from "@/components/types"
import { useAnalysis } from "@/hooks/useAnalysis"

type MetricKey = "total_commits" | "insertions" | "deletions"
type DisplayMode = "absolute" | "percentage"

const formatNumber = (n: number) => Math.round(n).toLocaleString()
const formatPercent = (p: number) => `${p.toFixed(1)}%`

type Breakdown = Record<string, { total_commits: number; insertions: number; deletions: number }>

export function FileActivityChart({
  allAuthors,
  selectedAuthors,
  allFiles,
  selectedFiles,
  filterData,
  selectedRepo,
}: Pick<
  AnalysisProps,
  "allAuthors" 
  | "selectedAuthors" 
  | "allFiles" 
  | "selectedFiles" 
  | "filterData" 
  | "selectedRepo"
>) {
  const [metric, setMetric] = useState<MetricKey>("total_commits")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("absolute")
  const { analysis } = useAnalysis(selectedRepo)
  const repo = (analysis as AnalysisResult | undefined)?.repository

  // Authors/files to show (no recomputation beyond simple toggles)
  const authorsToShow = useMemo(
    () => (filterData ? selectedAuthors : Array.from(allAuthors)),
    [filterData, selectedAuthors, allAuthors]
  )
  const filesToShow = useMemo(
    () => (filterData ? selectedFiles : Array.from(allFiles)),
    [filterData, selectedFiles, allFiles]
  )

  // One-time lightweight index: authorName -> (file_path -> metrics)
  // This avoids scanning all author.files repeatedly.
  const authorFileIndex = useMemo(() => {
    const idx: Record<string, Record<string, Metrics>> = {}
    if (!repo?.authors) return idx
    for (const a of repo.authors) {
      const name = a.name ?? "Unknown"
      const byPath: Record<string, Metrics> = {}
      for (const af of a.files ?? []) {
        byPath[af.file_path] = af.metrics ?? {}
      }
      idx[name] = byPath
    }
    return idx
  }, [repo?.authors])

  // Build the minimal dataset directly from repository.files
  const fileRows = useMemo(() => {
    if (!repo?.files?.length) return []

    // Prepare rows only for the selected files; totals come straight from file.metrics
    const rows = repo.files
      .filter((f) => filesToShow.includes(f.path))
      .map((f) => {
        const m = f.metrics ?? {}
        // Source of truth for totals is the file's own metrics
        const totalCommits = (m.total_commits ?? 0)
        const totalInsertions = (m.insertions ?? 0)
        const totalDeletions = (m.deletions ?? 0)

        // Minimal per-author breakdown pulled directly from the index (no extra math)
        const breakdown: Breakdown = {}
        for (const author of authorsToShow) {
          const am = authorFileIndex[author]?.[f.path]
          breakdown[author] = {
            total_commits: am?.total_commits ?? 0,
            insertions: am?.insertions ?? 0,
            deletions: am?.deletions ?? 0,
          }
        }

        return {
          path: f.path,
          fileName: f.path.split("/").pop() || f.path,
          totals: {
            total_commits: totalCommits,
            insertions: totalInsertions,
            deletions: totalDeletions,
          },
          breakdown,
        }
      })

    // Keep your previous behavior: sort by selected metric
    return rows.sort((a, b) => b.totals[metric] - a.totals[metric])
  }, [repo?.files, filesToShow, authorsToShow, authorFileIndex, metric])

  // Grand total across all files for percentage mode (taken from file totals)
  const grandTotal = useMemo(() => {
    return fileRows.reduce((sum, r) => sum + r.totals[metric], 0)
  }, [fileRows, metric])

  // Prepare chart data in one pass (no extra structures)
  const chartData = useMemo(() => {
    return fileRows.map((r) => {
      const base = {
        fileName: r.fileName,
        fullPath: r.path,
        absoluteTotal: r.totals[metric],
        total:
          displayMode === "percentage" && grandTotal > 0
            ? (r.totals[metric] / grandTotal) * 100
            : r.totals[metric],
      } as Record<string, any>

      for (const author of authorsToShow) {
        const value = r.breakdown[author]?.[metric] ?? 0
        base[author] =
          displayMode === "percentage" && grandTotal > 0
            ? (value / grandTotal) * 100
            : value
      }
      return base
    })
  }, [fileRows, authorsToShow, metric, displayMode, grandTotal])

  const MetricIcon = ({ type }: { type: MetricKey }) => {
    switch (type) {
      case "total_commits":
        return <GitCommit className="h-4 w-4" />
      case "insertions":
        return <Plus className="h-4 w-4" />
      case "deletions":
        return <Minus className="h-4 w-4" />
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const data = chartData.find((d) => d.fileName === label)
    if (!data) return null

    return (
      <Card className="shadow-lg">
        <CardContent className="p-3 space-y-2">
          <div className="font-semibold text-sm border-b pb-2">{data.fullPath}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {displayMode === "percentage" ? "% of total:" : "Total:"}
              </span>
              <span className="font-mono font-medium">
                {displayMode === "percentage"
                  ? formatPercent(data.total)
                  : formatNumber(data.absoluteTotal)}
              </span>
            </div>
            <div className="border-t pt-1 mt-1 text-muted-foreground text-[10px]">
              By author:
            </div>
            {authorsToShow.map((author) => {
              const value = (data as any)[author]
              if (!value) return null
              const { color } = getAuthorColor(author)
              return (
                <div key={author} className="flex justify-between gap-4">
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-muted-foreground">{author}:</span>
                  </div>
                  <span className="font-mono font-medium">
                    {displayMode === "percentage" ? formatPercent(value) : formatNumber(value)}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const yAxisDomain = useMemo<[number, number | "auto"]>(() => {
    if (displayMode === "percentage") {
      const maxP = Math.max(...chartData.map((d) => d.total), 1)
      return [0, Math.ceil(maxP * 1.1)]
    }
    return [0, "auto"]
  }, [displayMode, chartData])

  return (
    <Card>
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">File Activity</CardTitle>

            <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricKey)} className="w-auto">
              <TabsList className="h-7 bg-muted/50 p-0.5">
                <TabsTrigger value="total_commits" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="total_commits" /> Commits
                </TabsTrigger>
                <TabsTrigger value="insertions" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="insertions" /> Insertions
                </TabsTrigger>
                <TabsTrigger value="deletions" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="deletions" /> Deletions
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2 ml-2">
              <Label htmlFor="display-mode" className="text-[13px]">Relative</Label>
              <Switch
                id="display-mode"
                checked={displayMode === "percentage"}
                onCheckedChange={(c) => setDisplayMode(c ? "percentage" : "absolute")}
              />
            </div>
          </div>

          <div className="flex gap-1.5 text-[10px]">
            {displayMode === "percentage" && grandTotal > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-mono">{formatNumber(grandTotal)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50">
              <Folder className="h-3 w-3" />
              <span className="font-mono">{fileRows.length} files</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3">
        {/* Legend */}
        {authorsToShow.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px]">
            {authorsToShow.map((a) => {
              const { color } = getAuthorColor(a)
              return (
                <div key={a} className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  <span>{a}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }} maxBarSize={80}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="fileName"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={50}
                interval={0}
                label={{ value: "File name", position: "insideBottom", offset: -5, style: { fontSize: 14 } }}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                width={70}
                domain={yAxisDomain}
                label={{
                  value:
                    displayMode === "percentage"
                      ? "% of Total"
                      : metric === "total_commits"
                      ? "Nr of commits"
                      : metric === "insertions"
                      ? "Insertions"
                      : "Deletions",
                  angle: -90,
                  offset: 0,
                  style: { fontSize: 14 },
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />

              {authorsToShow.map((author) => {
                const { color } = getAuthorColor(author)
                return (
                  <Bar
                    key={author}
                    dataKey={author}
                    stackId="a"
                    fill={color}
                    fillOpacity={0.8}
                    isAnimationActive={false}
                  />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
