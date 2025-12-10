import { useMemo, useState } from "react"
import { GitCommit, Plus, Minus, FileText, Info } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthorColor } from "@/components/helpers/author_colors"
import type { AnalysisResult, Author } from "@/components/types"
import { fmtDate, fmtDatePlot, fmtDateNoTime } from "@/components/helpers/formatting_helpers"

type MetricKey = "commits" | "insertions" | "deletions" | "locs"

export function AuthorStatisticsVisualisation(
  {repository}: Pick<AnalysisResult, "repository">) {

  const [metric, setMetric] = useState<MetricKey>("commits")

  const {
    barData,
    lineData,
    authorsSorted,
    pieData,
    locPieData,
  } = useMemo(() => {
    const commits = repository?.commits ?? []
    const authorsArr: Author[] = repository?.authors ?? []
    const authorById = new Map(authorsArr.map((a) => [a.id, a]))

    const authorsSet = new Set<string>()

    const processedCommits = commits
      .map((c) => {
        const ts = +new Date(`${c.date}T${c.time}${c.timezone}`)
        const author = authorById.get(c.author_id)?.name ?? "Unknown"
        authorsSet.add(author)

        return {
          ts,
          author,
          commits: 1,
          insertions: c.metrics.insertions ?? 0,
          deletions: c.metrics.deletions ?? 0,
          locChange: c.metrics.loc ?? 0
        }
      })
      .sort((a, b) => a.ts - b.ts)

    const authors = Array.from(authorsSet).sort()

    const grouped = new Map<number, Map<string, any>>()

    processedCommits.forEach((c) => {
      const dayStart = new Date(c.ts)
      dayStart.setHours(0, 0, 0, 0)
      const dayTimestamp = dayStart.getTime()
      
      if (!grouped.has(dayTimestamp)) {
        grouped.set(dayTimestamp, new Map())
      }
      const dateGroup = grouped.get(dayTimestamp)!

      const existing = dateGroup.get(c.author) || {
        commits: 0,
        insertions: 0,
        deletions: 0,
        locs: 0,
      }

      existing.commits += c.commits
      existing.insertions += c.insertions
      existing.deletions += c.deletions
      existing.locs += c.locChange

      dateGroup.set(c.author, existing)
    })

    const barChartData = Array.from(grouped.entries())
      .map(([ts, authorMap]) => {
        const dataPoint: any = { date: ts }
        authorMap.forEach((metrics, author) => {
          dataPoint[author] = metrics[metric === "locs" ? "locs" : metric]
        })
        return dataPoint
      })
      .sort((a, b) => a.date - b.date)

    const cumulativeLOC = new Map<string, number>()
    authors.forEach((author) => cumulativeLOC.set(author, 0))

    const allDays = new Set<number>()
    processedCommits.forEach((c) => {
      const dayStart = new Date(c.ts)
      dayStart.setHours(0, 0, 0, 0)
      allDays.add(dayStart.getTime())
    })
    const sortedTimestamps = Array.from(allDays).sort((a, b) => a - b)

    const lineChartData = sortedTimestamps.map((ts) => {
      const dataPoint: any = { date: ts }

      processedCommits
        .filter((c) => c.ts === ts)
        .forEach((c) => {
          const current = cumulativeLOC.get(c.author) ?? 0
          cumulativeLOC.set(c.author, current + c.locChange)
        })

      authors.forEach((author) => {
        dataPoint[author] = cumulativeLOC.get(author) ?? 0
      })

      return dataPoint
    })

    const metricTotals = new Map<string, number>()
    authors.forEach((a) => metricTotals.set(a, 0))

    processedCommits.forEach((c) => {
      let value = 0
      if (metric === "commits") value = c.commits
      else if (metric === "insertions") value = c.insertions
      else if (metric === "deletions") value = c.deletions

      const current = metricTotals.get(c.author) ?? 0
      metricTotals.set(c.author, current + value)
    })

    const pieChartData = authors.map((author) => ({
      name: author,
      value: metricTotals.get(author) ?? 0,
    }))

    const locPieChartData = authors.map((author) => ({
      name: author,
      value: cumulativeLOC.get(author) ?? 0,
    }))

    return {
      barData: barChartData,
      lineData: lineChartData,
      authorsSorted: authors,
      pieData: pieChartData,
      locPieData: locPieChartData,
    }
  }, [repository, metric])

  const MetricIcon = ({ type }: { type: MetricKey }) => {
    switch (type) {
      case "commits":
        return <GitCommit className="h-4 w-4" />
      case "insertions":
        return <Plus className="h-4 w-4" />
      case "deletions":
        return <Minus className="h-4 w-4" />
      case "locs":
        return <FileText className="h-4 w-4" />
    }
  }

  const getMetricLabel = (type: MetricKey) => {
    switch (type) {
      case "commits":
        return "Commits"
      case "insertions":
        return "Insertions"
      case "deletions":
        return "Deletions"
      case "locs":
        return "Lines of Code"
    }
  }

  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    return (
      <Card className="shadow-lg">
        <CardContent className="p-3 space-y-2">
          <div className="font-semibold text-sm border-b pb-2">
            {fmtDateNoTime(label)}
          </div>
          <div className="space-y-1 text-xs">
            {payload
            .filter((entry: any) => entry.value !== 0 && entry.value !== null)
            .map((entry: any, index: number) => (
              <div key={index} className="flex justify-between gap-4">
                <span style={{ color: entry.color }}>{entry.name}:</span>
                <span className="font-mono font-medium">
                  {Math.round(entry.value).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltipLine = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    return (
      <Card className="shadow-lg">
        <CardContent className="p-3 space-y-2">
          <div className="font-semibold text-sm border-b pb-2">
            {fmtDate(label)}
          </div>
          <div className="space-y-1 text-xs">
            {payload
              .filter((entry: any) => entry.value !== 0 && entry.value !== null)
              .map((entry: any, index: number) => (
                <div key={index} className="flex justify-between gap-4">
                  <span style={{ color: entry.color }}>{entry.name}:</span>
                  <span className="font-mono font-medium">
                    {Math.round(entry.value).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const yAxisLabel = getMetricLabel(metric)
  const isLineChart = metric === "locs"
  const chartData = isLineChart ? lineData : barData

  const pieChartData = metric === "locs" ? locPieData : pieData

  const totalPieValue = pieChartData.reduce((sum, d) => sum + d.value, 0)

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const entry = payload[0]
    const percentage =
      totalPieValue > 0 ? ((entry.value / totalPieValue) * 100).toFixed(1) : "0.0"

    return (
      <Card className="shadow-lg">
        <CardContent className="p-3 space-y-1 text-xs">
          <div className="font-semibold text-sm">{entry.name}</div>
          <div className="flex justify-between gap-4">
            <span>{metric}</span>
            <span className="font-mono">{entry.value} ({percentage}%)</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPieTitle = () => {

    if (!lineData || lineData.length === 0) {
    return "No data available";
  }
  
    const firstPoint = lineData[0]
    const lastPoint = lineData[lineData.length - 1]
    if (metric === "locs") {
      
      if (lastPoint?.date) {
        return `Total lines of code per author (as of ${fmtDate(lastPoint.date)})`
      }
      return "Current LOC per author"
    }

    switch (metric) {
      case "commits":
        return `Total commits per author (from ${fmtDate(firstPoint.date)} to ${fmtDate(lastPoint.date)})`
      case "insertions":
        return `Total insertions per author (from ${fmtDate(firstPoint.date)} to ${fmtDate(lastPoint.date)})`
      case "deletions":
        return `Total deletions per author (from ${fmtDate(firstPoint.date)} to ${fmtDate(lastPoint.date)})`
      default:
        return "Distribution per author"
    }
  }

  const pieTitle = getPieTitle()

  return (
    <Card>
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">Activity Timeline</CardTitle>

            <Tabs
              value={metric}
              onValueChange={(v) => setMetric(v as MetricKey)}
              className="w-auto"
            >
              <TabsList className="h-7 bg-gray-200  p-0.5">
                <TabsTrigger value="commits" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="commits" /> Commits
                </TabsTrigger>
                <TabsTrigger value="insertions" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="insertions" /> Insertions
                </TabsTrigger>
                <TabsTrigger value="deletions" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="deletions" /> Deletions
                </TabsTrigger>
                <TabsTrigger value="locs" className="h-6 px-2 text-[10px] gap-1">
                  <MetricIcon type="locs" /> LOC
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-8 flex items-center">
          {authorsSorted.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px]">
              {authorsSorted.map((a) => {
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
        </div>

        <div className="h-[250px] w-full flex gap-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              {isLineChart ? (
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={fmtDatePlot}
                    tick={{ fontSize: 10 }}
                    height={50}
                    
                    label={{
                      value: "Date",
                      position: "insideBottom",
                      offset: -5,
                      style: { fontSize: 14 },
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={60}
                    domain = {[0, 'dataMax + 1']}  
                    label={{
                      value: yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      dy: 30,   
                      dx: 0,   
                      style: { fontSize: 14 },
                    }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltipLine />} />
                  {authorsSorted.map((author) => {
                    const { color } = getAuthorColor(author)
                    return (
                      <Line
                        key={author}
                        dataKey={author}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                        isAnimationActive={false}
                      />
                    )
                  })}
                </LineChart>
              ) : (
                <BarChart
                  data={chartData}
                  maxBarSize={20} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={fmtDatePlot}
                    padding={{ left: 10, right: 10 }}
                    tick={{ fontSize: 10 }}
                    height={50}
                    label={{
                      value: "Date",
                      position: "insideBottom",
                      offset: -5,
                      style: { fontSize: 14 },
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={60}
                    domain = {[0, 'dataMax + 1']} 
                    label={{
                      value: yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      dy: 30,   
                      dx: 5,   
                      style: { fontSize: 14 },
                    }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltipBar />} />
                  {authorsSorted.map((author) => {
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
              )}
            </ResponsiveContainer>
          </div>

        {pieChartData.length > 0 && (
          <div className="w-48 flex flex-col">
                 <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-sm text-foreground">Distribution</span>
              <div className="relative group">
                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                
                <div className="
                  absolute bottom-full mb-2
                  left-1/2 -translate-x-1/2
                  sm:left-auto sm:translate-x-0 sm:right-0
                  w-max max-w-xs
                  rounded-lg bg-popover border border-border
                  text-popover-foreground text-xs p-3
                  opacity-0 invisible
                  group-hover:opacity-100 group-hover:visible
                  transition-all duration-200
                  shadow-lg z-50
                  pointer-events-none 
                ">
                  {pieTitle}
                  <div className="
                    absolute top-full left-1/2 -translate-x-1/2 -mt-px
                    w-0 h-0
                    border-l-4 border-l-transparent
                    border-r-4 border-r-transparent
                    border-t-4 border-t-border
                  " />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="0%"
                    outerRadius="80%"
                    isAnimationActive={false}
                  >
                    {pieChartData.map((entry, index) => {
                      const { color } = getAuthorColor(entry.name)
                      return <Cell key={`cell-${index}`} fill={color} />
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
}
