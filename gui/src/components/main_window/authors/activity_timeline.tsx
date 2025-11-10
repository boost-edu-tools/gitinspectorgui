import { useMemo, useState } from "react"
import { GitCommit, Percent } from "lucide-react"
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
import type { AnalysisProps, AnalysisResult, Author } from "@/components/types"
import { useAnalysis } from "@/hooks/useAnalysis"
import { fmtDate } from "@/components/helpers/helper_functions"

type MetricKey = "commits" | "percent"
type ViewMode = "authors" | "repo"

export function Timeline({
  selectedRepo,
}: Pick<AnalysisProps, "selectedRepo">) {
  const [metric, setMetric] = useState<MetricKey>("percent")
  const [viewMode, setViewMode] = useState<ViewMode>("repo")
  const { analysis } = useAnalysis(selectedRepo)

  
  const fmtDatePlot = (d: Date | null) => {
  if (!d) return "—"
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d)
}

  const {
    perCommit,
    totalCommits,
    authorsSorted,
    dateMin,
    dateMax,
  } = useMemo(() => {
    const repo = (analysis as AnalysisResult | undefined)?.repository
    const commits = repo?.commits ?? []
    const authorsArr: Author[] = repo?.authors ?? []
    const authorById = new Map(authorsArr.map((a) => [a.id, a]))

    const authorsSet = new Set<string>()
    let min = Infinity
    let max = -Infinity

    const points = commits.map((c) => {
      const ts = +new Date(`${c.date}T${c.time}${c.timezone}`)
      const author = authorById.get(c.author_id)?.name ?? "Unknown"
      authorsSet.add(author)
      if (ts < min) min = ts
      if (ts > max) max = ts

      const locTotal = Object.values(c.metrics.commit_loc ?? {}).reduce(
        (a, b) => a + b,
        0
      )
      const valuePercent =
        locTotal > 0
          ? ((c.metrics.insertions ?? 0) / locTotal) * 100
          : 0

      return {
        date: ts,
        author,
        valuePercent,
        valueCommits: 1,
        message: c.message,
        hash: c.hash,
      }
    })

    return {
      perCommit: points,
      totalCommits: points.length,
      authorsSorted: Array.from(authorsSet).sort(),
      dateMin: min === Infinity ? 0 : min,
      dateMax: max === -Infinity ? 0 : max,
    }
  }, [analysis])

  const indexByAuthor = useMemo(
    () => new Map(authorsSorted.map((a, i) => [a, i] as const)),
    [authorsSorted]
  )

  const data = useMemo(() => {
    if (viewMode === "repo") {
      return perCommit.map((p) => ({
        ...p,
        authorIndex: indexByAuthor.get(p.author) ?? 0,
        value: metric === "percent" ? p.valuePercent : p.valueCommits,
      }))
    }

    const byKey = new Map<string, { date: number; authorIndex: number; value: number }>()
    for (const p of perCommit) {
      const k = `${p.author}:${p.date}`
      const base =
        byKey.get(k) ??
        { date: p.date, authorIndex: indexByAuthor.get(p.author) ?? 0, value: 0 }
      base.value += metric === "percent" ? p.valuePercent : p.valueCommits
      byKey.set(k, base)
    }
    return Array.from(byKey.values())
  }, [viewMode, metric, perCommit, indexByAuthor])

  const { minVal, maxVal } = useMemo(() => {
    if (viewMode !== "authors" || data.length === 0) return { minVal: 0, maxVal: 1 }
    let min = Infinity
    let max = -Infinity
    for (const d of data) {
      const v = d.value ?? 0
      if (v < min) min = v
      if (v > max) max = v
    }
    return {
      minVal: Math.max(0, isFinite(min) ? min : 0),
      maxVal: Math.max(1, isFinite(max) ? max : 1),
    }
  }, [viewMode, data])

  const getDotSize = (value: number) => {
    if (viewMode === "repo") return 3.5
    const s = Math.sqrt(Math.max(0, value))
    const sMin = Math.sqrt(minVal)
    const sMax = Math.sqrt(maxVal)
    const t = (s - sMin) / Math.max(1e-9, sMax - sMin)
    const px = (3.5 + t * (6))
    return px
  }

  const legendVals = useMemo(() => {
    if (viewMode !== "authors") return [] as number[]
    const mid = minVal + (maxVal - minVal) / 2
    if (metric === "commits") {
      const a = Math.max(1, Math.round(minVal))
      const b = Math.max(a, Math.round(mid))
      const c = Math.max(b, Math.round(maxVal))
      return Array.from(new Set([a, b, c]))
    }
    const a = Math.max(0.01, +minVal.toFixed(2))
    const b = Math.max(a, +mid.toFixed(2))
    const c = Math.max(b, +maxVal.toFixed(2))
    return Array.from(new Set([a, b, c]))
  }, [viewMode, metric, minVal, maxVal])

  const MetricIcon = ({ type }: { type: MetricKey }) =>
    type === "commits" ? <GitCommit className="h-4 w-4" /> : <Percent className="h-4 w-4" />

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const label = metric === "commits" ? "Commits" : "% Changed"
    return (
      <Card className="shadow-lg">
        <CardContent className="p-3 space-y-2">
          <div className="font-semibold text-sm border-b pb-2">
            {viewMode === "authors" ? d.author : d.author || "Repository"}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{fmtDate(d.date)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{label}:</span>
              <span className="font-mono font-medium">
                {metric === "commits" ? Math.round(d.value).toLocaleString() : `${d.value.toFixed(2)}%`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const yAxisProps =
    viewMode === "authors"
      ? {
          type: "number" as const,
          dataKey: "authorIndex",
          domain: authorsSorted.length ? [-1, authorsSorted.length ] : [0, 0],
          ticks: authorsSorted.map((_, i) => i),
          tickFormatter: (i: number) => authorsSorted[i] || "",
          tick: { fontSize: 10 },
          width: 80,
          name: "Author",
        }
      : {
          type: "number" as const,
          dataKey: "value",
          domain: [0, "auto"] as [number, any],
          tick: { fontSize: 10 },
          width: 80,
          label: {
            value: metric === "commits" ? "Nr of commits" : "Changes (%)",
            angle: -90,
            offset: 0,
            style: { fontSize: 14 },
          },
          allowDecimals: metric !== "commits",
        }

  return (
    <Card>
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">Activity Timeline</CardTitle>

            <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricKey)} className="w-auto">
              <TabsList className="h-7 bg-muted/50 p-0.5">
                <TabsTrigger value="commits" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="commits" /> Commits
                </TabsTrigger>
                <TabsTrigger value="percent" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="percent" /> Changes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
              <TabsList className="h-7 bg-muted/50 p-0.5 ml-2">
                <TabsTrigger value="repo" className="h-6 px-2 text-[10px]">All authors</TabsTrigger>
                <TabsTrigger value="authors" className="h-6 px-2 text-[10px]">Per author</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-1.5 text-[10px]">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50">
              <GitCommit className="h-3 w-3" />
              <span className="font-mono">{totalCommits}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-8 flex items-center">
        {viewMode === "repo" && authorsSorted.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px]">
            {authorsSorted.map((a) => {
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

        {viewMode === "authors" && legendVals.length > 0 && (
          <div className="flex items-center gap-4 mb-2 text-[10px]">
            <span className="text-muted-foreground">
              Dot size; {metric === "commits" ? "nr of commits" : "% changed"}
            </span>
            {legendVals.map((v, i) => {
              const r = Math.max(2, Math.round(getDotSize(Number(v))))
              const s = r * 2 + 6
              return (
                <div key={`${v}-${i}`} className="flex items-center gap-1">
                  <svg width={s} height={s} className="opacity-70">
                    <circle cx={s / 2} cy={s / 2} r={r} />
                  </svg>
                  <span className="font-mono">
                    {metric === "commits"
                      ? Math.round(Number(v)).toLocaleString()
                      : `${Number(v).toFixed(2)}%`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                type="number"
                dataKey="date"
                domain={[dateMin - (dateMax - dateMin)*0.03, dateMax + (dateMax - dateMin)*0.03]}
                tickFormatter={fmtDatePlot}
                tick={{ fontSize: 10 }}
                name="Date"
                height={50}
                label={{ value: "Date", position: "insideBottom", offset: -5, style: { fontSize: 14 } }}
              />
              <YAxis {...(yAxisProps as any)} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={data}
                shape={({ cx, cy, payload }: any) => {
                  const r = getDotSize(payload.value)
                  const fill =
                    viewMode === "repo" ? getAuthorColor(payload.author).color : "#030303"
                  return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.8} />
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
