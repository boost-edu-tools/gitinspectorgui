import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { useAnalysis } from "@/hooks/useAnalysis"
import type { SelectedFullProps, AnalysisResult, Author } from "@/components/types"
import { METRIC_DESCRIPTIONS } from "@/components/main_window/metrics_descriptions"

type SelectedProps = Pick<
  SelectedFullProps,
  "allAuthors" | "selectedAuthors" | "filterData" | "selectedRepo"
>

type MetricKey = keyof typeof METRIC_DESCRIPTIONS

function MetricHeader({ metricKey }: { metricKey: MetricKey }) {
  const info = METRIC_DESCRIPTIONS[metricKey]
  return (
    <div className="flex items-center gap-1 justify-end">
      <span>{info.label}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{info.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export function AuthorStatisticsOverview({
  allAuthors,
  selectedAuthors,
  filterData,
  selectedRepo,
}: SelectedProps) {
  const [displayMode, setDisplayMode] = React.useState<"absolute" | "percentage">("percentage")
  const { analysis } = useAnalysis(selectedRepo)
  const repo = (analysis as AnalysisResult | undefined)?.repository
  const authors: Author[] = repo?.authors ?? []

  const totals = React.useMemo(() => {
    return authors.reduce(
      (acc, a) => {
        const m = a.metrics ?? {}
        return {
          commits: acc.commits + (m.total_commits ?? 0),
          insertions: acc.insertions + (m.insertions ?? 0),
          deletions: acc.deletions + (m.deletions ?? 0),
          loc: acc.loc + (m.loc ?? 0),
          sloc: acc.sloc + (m.sloc ?? 0),
        }
      },
      { commits: 0, insertions: 0, deletions: 0, loc: 0, sloc: 0 }
    )
  }, [authors])

  const sortedAuthors = React.useMemo(() => {
    return [...authors].sort((a, b) => {
      const aTotal = (a.metrics?.insertions ?? 0) + (a.metrics?.deletions ?? 0)
      const bTotal = (b.metrics?.insertions ?? 0) + (b.metrics?.deletions ?? 0)
      return bTotal - aTotal
    })
  }, [authors])

  const visibleAuthors = React.useMemo(() => {
    const names = filterData ? selectedAuthors : Array.from(allAuthors)
    const allowed = new Set(names)
    return sortedAuthors.filter((a) => allowed.has(a.name ?? ""))
  }, [sortedAuthors, filterData, selectedAuthors, allAuthors])

  const fmt = (v: number, total: number) =>
    displayMode === "percentage"
      ? `${total ? ((v / total) * 100).toFixed(0) : "0"}%`
      : String(v)

  return (
    <Card>
      <CardContent className="pt-2 pb-3">
        <div className="space-y-2 py-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Author Statistics</CardTitle>

            <div className="flex items-center space-x-2">
              <Label htmlFor="display-mode" className="text-sm">
                Relative
              </Label>
              <Switch
                id="display-mode"
                checked={displayMode === "percentage"}
                onCheckedChange={(checked) =>
                  setDisplayMode(checked ? "percentage" : "absolute")
                }
              />
            </div>
          </div>

          {/* Table */}
          <div className="grid w-full [&>div]:border [&>div]:rounded overflow-x-auto py-4">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="hover:bg-background">
                  <TableHead className="font-semibold sticky left-0 bg-background border-r min-w-[160px] z-10">
                    Author
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">
                    <MetricHeader metricKey="commits" />
                  </TableHead>
                  <TableHead className="text-right">
                    <MetricHeader metricKey="insertions" />
                  </TableHead>
                  <TableHead className="text-right">
                    <MetricHeader metricKey="deletions" />
                  </TableHead>
                  <TableHead className="text-right">
                    <MetricHeader metricKey="loc" />
                  </TableHead>
                  <TableHead className="text-right">
                    <MetricHeader metricKey="sloc" />
                  </TableHead>
                  <TableHead className="text-right">
                    <MetricHeader metricKey="age" />
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow className="bg-muted/30 border-b-2">
                  <TableCell className="font-semibold sticky left-0 bg-muted/30 border-r z-10">
                    All Authors ({visibleAuthors.length})
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold">{totals.commits}</TableCell>
                  <TableCell className="text-right font-semibold">{totals.insertions}</TableCell>
                  <TableCell className="text-right font-semibold">{totals.deletions}</TableCell>
                  <TableCell className="text-right font-semibold">{totals.loc}</TableCell>
                  <TableCell className="text-right font-semibold">{totals.sloc}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className="text-muted-foreground">-</span>
                  </TableCell>
                </TableRow>

                {visibleAuthors.map((a) => {
                  const m = a.metrics ?? {}
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="sticky left-0 bg-background border-r z-10">
                        <span
                          style={{ color: getAuthorColor(a.name ?? "").color }}
                          className="font-medium"
                        >
                          {a.name ?? "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{a.email ?? "Unknown"}</TableCell>
                      <TableCell className="text-right">{fmt(m.total_commits ?? 0, totals.commits)}</TableCell>
                      <TableCell className="text-right">{fmt(m.insertions ?? 0, totals.insertions)}</TableCell>
                      <TableCell className="text-right">{fmt(m.deletions ?? 0, totals.deletions)}</TableCell>
                      <TableCell className="text-right">{fmt(m.loc ?? 0, totals.loc)}</TableCell>
                      <TableCell className="text-right">{fmt(m.sloc ?? 0, totals.sloc)}</TableCell>
                      <TableCell className="text-right">{m.age ?? "-"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
