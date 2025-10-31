import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardTitle} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { SelectedFullProps, AnalysisResult, Author } from "@/components/types"
import { useAnalysis } from "@/hooks/useAnalysis"
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

export function Overview({
  allAuthors,
  selectedAuthors,
  filterData,
  selectedRepo,
}: SelectedProps) {
  const [showRelative, setShowRelative] = React.useState(true)
  const { analysis } = useAnalysis(selectedRepo)
  const repo = (analysis as AnalysisResult | undefined)?.repository
  const authors: Author[] = repo?.authors ?? []

  // Calculate totals for relative percentages
  const totals = React.useMemo(() => {
    if (!authors.length) {
      return {
        commits: 1,
        insertions: 1,
        deletions: 1,
        loc: 1,
        sloc: 1,
      }
    }

    return authors.reduce(
      (acc, author) => {
        const m = author.metrics ?? {}
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

  // Sort authors by total changes (insertions + deletions)
  const sortedAuthors = React.useMemo(() => {
    return [...authors].sort((a, b) => {
      const aTotal = (a.metrics?.insertions ?? 0) + (a.metrics?.deletions ?? 0)
      const bTotal = (b.metrics?.insertions ?? 0) + (b.metrics?.deletions ?? 0)
      return bTotal - aTotal
    })
  }, [authors])

  // Filter to visible authors (selected vs all)
  const filtered = React.useMemo(() => {
    const names = filterData ? selectedAuthors : Array.from(allAuthors)
    const allow = new Set(names)
    return sortedAuthors.filter((author) => allow.has(author.name ?? ""))
  }, [sortedAuthors, filterData, selectedAuthors, allAuthors])

  const formatMetric = (value: number, total: number): string => {
    if (showRelative) {
      const percentage = total > 0 ? (value / total) * 100 : 0
      return `${percentage.toFixed(0)}%`
    }
    return value.toString()

  
  }

  const [showRenames, setShowRenames] = React.useState<boolean>(false)
  
  return (
    <Card>
      <CardContent className="pt-2 pb-3">
        <div className="space-y-2 py-2">
        <div className="flex items-center justify-between">
          
          <CardTitle className="text-sm">Author Statistics</CardTitle>

          <div className="flex items-center gap-4">

          <div className="flex items-center space-x-2 border-r pr-4">
            <Label htmlFor="relative-mode" className="text-sm">Show renames</Label>
            <Switch id="show-renames" checked={showRenames} onCheckedChange={setShowRenames} />
          </div>

          <div className="flex items-center space-x-2">            
            <Label htmlFor="display-mode" className="text-sm">
              Relative
            </Label>
            <Switch
              id="relative-mode"
              checked={showRelative}
              onCheckedChange={setShowRelative}
            />
          </div>

        </div>
        </div>
        

        <div className="grid w-full [&>div]:border [&>div]:rounded overflow-x-auto py-4">
          <Table>
            <TableHeader>
              <TableRow className="*:whitespace-nowrap hover:bg-background">
                <TableHead className="pl-4 sticky left-0 bg-background min-w-[150px] z-10">
                  Name
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
                  <MetricHeader metricKey="stability" />
                </TableHead>
                <TableHead className="text-right">
                  <MetricHeader metricKey="age" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-hidden">
              {filtered.map((author) => {
                const metrics = author.metrics ?? {}
                const commits = metrics.total_commits ?? 0
                const insertions = metrics.insertions ?? 0
                const deletions = metrics.deletions ?? 0
                const loc = metrics.loc ?? 0
                const sloc = metrics.sloc ?? 0
                const stability = metrics.stability ?? null
                const age = metrics.age ?? null

                return (
                  <TableRow
                    key={author.id}
                    className="group odd:bg-muted [&>td]:whitespace-nowrap hover:[&>td]:bg-blue-100 dark:hover:[&>td]:bg-blue-400"
                  >
                    <TableCell className="pl-4 sticky left-0 bg-background group-odd:bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-400 z-10">
                      <span style={{ color: getAuthorColor(author.name ?? "").color }}>
                        {author.name ?? "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>{author.email ?? "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      {formatMetric(commits, totals.commits)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMetric(insertions, totals.insertions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMetric(deletions, totals.deletions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMetric(loc, totals.loc)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMetric(sloc, totals.sloc)}
                    </TableCell>
                    <TableCell className="text-right">
                      {stability}
                    </TableCell>
                    <TableCell className="text-right">
                      {age}
                    </TableCell>
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