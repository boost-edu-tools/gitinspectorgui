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
import type { SelectedFullProps, AnalysisResult } from "@/components/types"
import { useAnalysis } from "@/hooks/useAnalysis"

type MetricKey = "commits" | "insertions" | "deletions"
type DisplayMode = "absolute" | "percentage"

const formatNumber = (n: number) => Math.round(n).toLocaleString()
const formatPercent = (p: number) => `${p.toFixed(1)}%`

interface FileMetrics {
  path: string
  commits: number
  insertions: number
  deletions: number
  authorBreakdown: Record<string, { commits: number; insertions: number; deletions: number }>
}

function extractFileMetrics(
  analysis: AnalysisResult | undefined,
  fileIdsToShow: string[],
  authorsToShow: string[]
): FileMetrics[] {
  const repo = analysis?.repository
  if (!repo) return []

  const authorsSet = new Set(authorsToShow)
  
  // Get file metadata for total metrics
  const fileMetadataMap = new Map(
    (repo.files_metadata ?? [])
      .filter((f) => fileIdsToShow.includes(f.path))
      .map((f) => [
        f.path,
        {
          commits: f.metrics?.commits ?? 0,
          insertions: f.metrics?.insertions ?? 0,
          deletions: f.metrics?.deletions ?? 0,
        },
      ])
  )

  // Get author breakdown from author files
  const fileMap = new Map<string, FileMetrics>()

  for (const author of repo.authors ?? []) {
    const authorName = author.name ?? "Unknown"
    if (!authorsSet.has(authorName)) continue

    for (const file of author.files ?? []) {
      if (!fileIdsToShow.includes(file.file_path)) continue

      if (!fileMap.has(file.file_path)) {
        const metadata = fileMetadataMap.get(file.file_path) || {
          commits: 0,
          insertions: 0,
          deletions: 0,
        }
        fileMap.set(file.file_path, {
          path: file.file_path,
          commits: metadata.commits,
          insertions: metadata.insertions,
          deletions: metadata.deletions,
          authorBreakdown: {},
        })
      }

      const fileData = fileMap.get(file.file_path)!
      if (!fileData.authorBreakdown[authorName]) {
        fileData.authorBreakdown[authorName] = { commits: 0, insertions: 0, deletions: 0 }
      }

      // Aggregate author metrics
      fileData.authorBreakdown[authorName].commits += file.metrics?.commits ?? 0
      fileData.authorBreakdown[authorName].insertions += file.metrics?.insertions ?? 0
      fileData.authorBreakdown[authorName].deletions += file.metrics?.deletions ?? 0
    }
  }

  return Array.from(fileMap.values())
}

export function FileActivityChart({
  allAuthors,
  selectedAuthors,
  allFiles,
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
  | "startCommitHash"
  | "endCommitHash"
>) {
  const [metric, setMetric] = useState<MetricKey>("commits")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("absolute")
  const { analysis } = useAnalysis(selectedRepo)

  // Determine which authors and files to show
  const authorsToShow = useMemo(
    () => (filterData ? selectedAuthors : Array.from(allAuthors)),
    [filterData, selectedAuthors, allAuthors]
  )

  const filesToShow = useMemo(
    () => (filterData ? selectedFiles : Array.from(allFiles)),
    [filterData, selectedFiles, allFiles]
  )

  const fileMetrics = useMemo(() => {
    const metrics = extractFileMetrics(
      analysis as AnalysisResult | undefined,
      filesToShow,
      authorsToShow
    )

    // Sort by selected metric and take top 20
    return metrics.sort((a, b) => b[metric] - a[metric]).slice(0, 20)
  }, [analysis, filesToShow, authorsToShow, metric])

  // Calculate total across all files for percentage mode
  const grandTotal = useMemo(() => {
    return fileMetrics.reduce((sum, file) => sum + file[metric], 0)
  }, [fileMetrics, metric])

  // Prepare chart data
  const chartData = useMemo(() => {
    return fileMetrics.map((file) => {
      const fileTotal = file[metric]
      const authorData: Record<string, number> = {}

      // In percentage mode, show percentage of grand total
      // In absolute mode, show actual values
      for (const author of authorsToShow) {
        const breakdown = file.authorBreakdown[author]
        if (breakdown) {
          const value = breakdown[metric]
          if (displayMode === "percentage") {
            // Percentage of the grand total across all files
            authorData[author] = grandTotal > 0 ? (value / grandTotal) * 100 : 0
          } else {
            // Absolute value
            authorData[author] = value
          }
        } else {
          authorData[author] = 0
        }
      }

      return {
        fileName: file.path.split("/").pop() || file.path,
        fullPath: file.path,
        total: displayMode === "percentage" && grandTotal > 0 ? (fileTotal / grandTotal) * 100 : fileTotal,
        absoluteTotal: fileTotal,
        ...authorData,
      }
    })
  }, [fileMetrics, authorsToShow, metric, displayMode, grandTotal])

  const MetricIcon = ({ type }: { type: MetricKey }) => {
    switch (type) {
      case "commits":
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
              if (!value || value === 0) return null
              const { color } = getAuthorColor(author)
              return (
                <div key={author} className="flex justify-between gap-4">
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
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

  // Dynamic Y-axis domain for better visibility
  const yAxisDomain = useMemo<[number, number | "auto"]>(() => {
    if (displayMode === "percentage") {
      // In percentage mode, find max to set appropriate scale
      const maxPercentage = Math.max(...chartData.map(d => d.total), 1)
      return [0, Math.ceil(maxPercentage * 1.1)] // 10% padding
    }
    return [0, "auto"]
  }, [displayMode, chartData])

  return (
    <Card>
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">File Activity</CardTitle>

            <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricKey)} className="w-auto">
              <TabsList className="h-7 bg-muted/50 p-0.5">
                <TabsTrigger value="commits" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="commits" /> Commits
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
              <Label htmlFor="display-mode" className="text-[10px]">
                Relative
              </Label>
              <Switch
                id="display-mode"
                checked={displayMode === "percentage"}
                onCheckedChange={(checked) => setDisplayMode(checked ? "percentage" : "absolute")}
              />
            </div>
          </div>

          <div className="flex gap-1.5 text-[10px]">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50">
              <Folder className="h-3 w-3" />
              <span className="font-mono">{fileMetrics.length} files</span>
            </div>
            {displayMode === "percentage" && grandTotal > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-mono">{formatNumber(grandTotal)}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3">
        {/* Legend: author colors */}
        {authorsToShow.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px]">
            {authorsToShow.map((a) => {
              const { color } = getAuthorColor(a)
              return (
                <div key={a} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span>{a}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              maxBarSize={80}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="fileName"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={50}
                interval={0}
                label = {{ value: 'File name', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                width={70}
                domain={yAxisDomain}
                label={{
                  value:
                    displayMode === "percentage"
                      ? "% of Total"
                      : metric === "commits"
                      ? "Nr of commits"
                      : metric === "insertions"
                      ? "Insertions"
                      : "Deletions",
                  angle: -90,
                  offset: 0,
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