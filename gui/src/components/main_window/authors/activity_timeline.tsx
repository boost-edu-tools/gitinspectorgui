import * as React from "react"
import { useMemo, useState } from "react"
import { GitCommit, Plus, Minus } from "lucide-react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { SelectedFullProps, AnalysisResult, Commit, Author } from "@/components/types"
import { useAnalysis } from "@/hooks/useAnalysis"

type MetricKey = "commits" | "insertions" | "deletions"

type SelectedProps = Pick<
  SelectedFullProps,
  | "allAuthors"
  | "selectedAuthors"
  | "filterData"
  | "selectedRepo"
  | "startCommitHash"
  | "endCommitHash"
>

const dayKey = (isoOrDate: string | Date) => {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate
  return d.getTime()
}

export function Timeline({
  allAuthors,
  selectedAuthors,
  filterData,
  selectedRepo,
  startCommitHash,
  endCommitHash,
}: SelectedProps) {
  const [metric, setMetric] = useState<MetricKey>("commits")
  const { analysis } = useAnalysis(selectedRepo)

  const { scatterData, summary, authorsList, dateRange } = useMemo(() => {
    const analysisResult = analysis as AnalysisResult | undefined
    const repo = analysisResult?.repository
    const allCommits: Commit[] = repo?.commits ?? []
    const authorsArr: Author[] = repo?.authors ?? []

    // Build a quick lookup from authorId -> Author
    const authorById = new Map(authorsArr.map((a) => [a.id, a]))

    // Sort commits chronologically (oldest → newest)
    const sortedCommits = [...allCommits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Commit bounds
    let startIndex = 0
    let endIndex = sortedCommits.length - 1
    if (startCommitHash) {
      const idx = sortedCommits.findIndex((c) => c.hash === startCommitHash)
      if (idx !== -1) startIndex = idx
    }
    if (endCommitHash) {
      const idx = sortedCommits.findIndex((c) => c.hash === endCommitHash)
      if (idx !== -1) endIndex = idx
    }

    const commits = sortedCommits.slice(startIndex, endIndex + 1)

    const authorsSet = new Set<string>()
    const dataPoints: Array<{
      date: number
      author: string
      authorIndex: number
      value: number
      message: string
      hash: string
      insertions?: number
      deletions?: number
    }> = []

    let totalCommits = 0
    let totalInsertions = 0
    let totalDeletions = 0

    // Collect authors present in the filtered commits
    for (const c of commits) {
      const a = authorById.get(c.authorId)
      const authorName = a?.name ?? "Unknown"
      authorsSet.add(authorName)
    }

    const authorsArray = Array.from(authorsSet).sort()
    const authorToIndex = new Map(authorsArray.map((a, i) => [a, i]))

    let minDate = Infinity
    let maxDate = -Infinity

    // Build points
    for (const c of commits) {
      const timestamp = dayKey(c.date)
      const a = authorById.get(c.authorId)
      const authorName = a?.name ?? "Unknown"
      const authorIndex = authorToIndex.get(authorName) ?? 0

      minDate = Math.min(minDate, timestamp)
      maxDate = Math.max(maxDate, timestamp)

      let ins = 0
      let del = 0
      if (Array.isArray(c.files_changed) && c.files_changed.length > 0) {
        for (const f of c.files_changed) {
          const fm = f.metrics || {}
          ins += Number(fm.insertions ?? 0)
          del += Number(fm.deletions ?? 0)
        }
      } else if (c.metrics) {
        ins += Number(c.metrics.insertions ?? 0)
        del += Number(c.metrics.deletions ?? 0)
      }

      totalInsertions += ins
      totalDeletions += del

      dataPoints.push({
        date: timestamp,
        author: authorName,
        authorIndex,
        value: 1,
        message: c.message ?? "",
        hash: c.hash,
        insertions: ins,
        deletions: del,
      })
      totalCommits++
    }

    return {
      scatterData: dataPoints,
      summary: {
        totalCommits,
        totalInsertions,
        totalDeletions,
      },
      authorsList: authorsArray,
      dateRange: {
        min: minDate === Infinity ? 0 : minDate,
        max: maxDate === -Infinity ? 0 : maxDate,
      },
    }
  }, [analysis, startCommitHash, endCommitHash])

  const authorsToPlot = React.useMemo(
    () => (filterData ? selectedAuthors : Array.from(allAuthors)),
    [filterData, selectedAuthors, allAuthors]
  )

  const filteredData = useMemo(() => {
    return scatterData
      .filter((p) => authorsToPlot.includes(p.author))
      .map((p) => {
        let value = p.value
        if (metric === "insertions") value = p.insertions || 0
        else if (metric === "deletions") value = p.deletions || 0
        if (value === 0) return null
        return { ...p, value }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
  }, [scatterData, authorsToPlot, metric])

  const filteredAuthorsList = useMemo(
    () => authorsList.filter((a) => authorsToPlot.includes(a)),
    [authorsList, authorsToPlot]
  )

  const filteredAuthorToIndex = useMemo(
    () => new Map(filteredAuthorsList.map((a, i) => [a, i] as const)),
    [filteredAuthorsList]
  )

  const remappedData = useMemo(
    () =>
      filteredData.map((point) => ({
        ...point,
        authorIndex: filteredAuthorToIndex.get(point.author) ?? 0,
      })),
    [filteredData, filteredAuthorToIndex]
  )

  const scaleParams = useMemo(() => {
    const minDotSize = 30
    const maxDotSize = 80
    if (remappedData.length === 0) return { min: 1, max: 100, range: 99, minDotSize, maxDotSize }
    const values = remappedData.map((d) => d.value).filter((v) => v > 0)
    if (values.length === 0) return { min: 1, max: 100, range: 99, minDotSize, maxDotSize }
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue
    return { min: minValue, max: maxValue, range: range || 1, minDotSize, maxDotSize }
  }, [remappedData])

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: dateRange.max - dateRange.min > 365 * 24 * 60 * 60 * 1000 ? "numeric" : undefined,
      })
    } catch {
      return ""
    }
  }

  const formatNumber = (num: number) =>
    Math.abs(num) >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toLocaleString()

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null
    const data = payload[0].payload
    const metricLabel = metric === "commits" ? "Commit" : metric === "insertions" ? "Additions" : "Deletions"
    return (
      <Card className="shadow-lg">
        <CardContent className="p-3 space-y-2">
          <div className="font-semibold text-sm border-b pb-2">{data.author}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{formatDate(data.date)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{metricLabel}:</span>
              <span className="font-mono font-medium">{formatNumber(data.value)}</span>
            </div>
            {data.message && (
              <div className="pt-2 border-t">
                <div className="text-muted-foreground mb-1">Message:</div>
                <div className="text-xs line-clamp-3">{data.message}</div>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground font-mono pt-1">
              {data.hash.slice(0, 7)}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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

  const getDotSize = (value: number) => {
    const { min, max, range, minDotSize, maxDotSize } = scaleParams
    if (metric === "commits") {
      if (range === 0) return minDotSize / 10
      const normalized = (value - min) / range
      return (minDotSize + normalized * (maxDotSize - minDotSize)) / 10
    }
    if (range === 0) return minDotSize / 10
    const sqrtValue = Math.sqrt(value)
    const sqrtMin = Math.sqrt(min)
    const sqrtMax = Math.sqrt(max)
    const sqrtRange = sqrtMax - sqrtMin || 1
    const normalized = (sqrtValue - sqrtMin) / sqrtRange
    return (minDotSize + normalized * (maxDotSize - minDotSize)) / 10
  }

  return (
    <Card>
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">Activity Timeline</CardTitle>
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
          </div>

          <div className="flex gap-1.5 text-[10px]">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50">
              <GitCommit className="h-3 w-3" />
              <span className="font-mono">{summary.totalCommits}</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400">
              <Plus className="h-3 w-3" />
              <span className="font-mono">{formatNumber(summary.totalInsertions)}</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400">
              <Minus className="h-3 w-3" />
              <span className="font-mono">{formatNumber(summary.totalDeletions)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3">
        <div className="h-50 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                type="number"
                dataKey="date"
                domain={[dateRange.min, dateRange.max]}
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
                name="Date"
                height={30}
              />
              <YAxis
                type="number"
                dataKey="authorIndex"
                domain={
                  filteredAuthorsList.length > 0
                    ? [0, Math.max(0, filteredAuthorsList.length - 1)]
                    : [0, 0]
                }
                ticks={filteredAuthorsList.map((_, i) => i)}
                tickFormatter={(index) => filteredAuthorsList[index] || ""}
                tick={{ fontSize: 10 }}
                width={95}
                name="Author"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={remappedData}
                isAnimationActive={false}
                shape={(props: any) => {
                  const { cx, cy, payload } = props
                  const radius = getDotSize(payload.value)
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={getAuthorColor(payload.author).color}
                      fillOpacity={0.7}
                    />
                  )
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
