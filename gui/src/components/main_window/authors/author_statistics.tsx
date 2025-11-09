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
import { Info, Users, User } from "lucide-react"

import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { useAnalysis } from "@/hooks/useAnalysis"
import type { SelectedFullProps, AnalysisResult, Author, Commit } from "@/components/types"
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
          <TooltipContent side="top">
            <p className="text-xs">{info.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function normalizeAliases(aliasCSV: unknown): string[] {
  if (!aliasCSV) return []
  return String(aliasCSV)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function EmailCell({
  primary,
  aliases,
  showAliases,
}: {
  primary?: string | null
  aliases: string[]
  showAliases: boolean
}) {
  const hasPrimary = !!primary
  const hasAliases = aliases.length > 0 && showAliases

  if (!hasPrimary && !hasAliases) {
    return <span className="text-xs">Unknown</span>
  }

  return (
    <div className="flex flex-col gap-1 text-xs">
      {hasPrimary && (
        <div className="flex items-center gap-2">
          <span className="font-mono break-all">{primary}</span>
        </div>
      )}

      {showAliases &&
        aliases.map((em, i) => (
          <div key={`${em}-${i}`} className="flex items-center gap-2">
            <span className="font-mono break-all">{em}</span>
          </div>
        ))}
    </div>
  )
}


export function AuthorStatisticsOverview({
  allAuthors,
  selectedAuthors,
  filterData,
  selectedRepo,
}: SelectedProps) {
  const [displayMode, setDisplayMode] = React.useState<"absolute" | "percentage">("absolute")
  const { analysis } = useAnalysis(selectedRepo)
  const repo = (analysis as AnalysisResult | undefined)?.repository
  const authors: Author[] = repo?.authors ?? []
  const [showRenames, setShowRenames] = React.useState<boolean>(false)
  const fullCommits: Commit[] = repo?.commits ?? []

  const totals = React.useMemo(() => {
    return authors.reduce(
      (acc, a) => {
        const m = a.metrics ?? {}
        return {
          total_commits: acc.total_commits + (m.total_commits ?? 0),
          insertions: acc.insertions + (m.insertions ?? 0),
          deletions: acc.deletions + (m.deletions ?? 0),
          loc: acc.loc + (m.loc ?? 0),
          sloc: acc.sloc + (m.sloc ?? 0),
        }
      },
      { total_commits: 0, insertions: 0, deletions: 0, loc: 0, sloc: 0 }
    )
  }, [authors])

  const sortedAuthors = React.useMemo(() => {
    return [...authors].sort((a, b) => {
      return (b.metrics?.total_commits ?? 0) - (a.metrics?.total_commits ?? 0)
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
      <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Author Statistics</CardTitle>

            <div className="flex items-center space-x-2">

            <div className="flex items-center space-x-2  pr-4">
              <Label htmlFor="show-renames" className="text-[13px]">Show renames</Label>
              <Switch id="show-renames" checked={showRenames} onCheckedChange={setShowRenames} />
            </div>
              <Label htmlFor="display-mode" className="text-[13px]">
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
                  <TableHead className="font-semibold sticky left-0 bg-background border-r w-[200px] z-10">
                    Author
                  </TableHead>
                  <TableHead className="min-w-[170px] max-w-[170x] w-[170px]">Email(s)</TableHead>
                  <TableHead className="text-right">
                    <MetricHeader metricKey="total_commits" />
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

              <TableBody>
                <TableRow className="bg-muted/30 border-b-2">
                  <TableCell className="font-semibold sticky left-0 bg-muted/30 border-r z-10">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>All Authors ({visibleAuthors.length})</span>
                  </div>
                    
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold">{totals.total_commits}</TableCell>
                  <TableCell className="text-right font-semibold">{totals.insertions}</TableCell>
                  <TableCell className="text-right font-semibold">{totals.deletions}</TableCell>
                  <TableCell className="text-right font-semibold">{totals.loc}</TableCell>
                  <TableCell className="text-right font-semibold">{totals.sloc}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className="text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className="text-muted-foreground">-</span>
                  </TableCell>
                </TableRow>

                {visibleAuthors.map((a) => {
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

                  const m = a.metrics ?? {}
                  const aliases = normalizeAliases((a as any).aliases_email)
                  const last_commit_hash = a.commit_hashes[a.commit_hashes.length - 1];
                  const lastCommit = fullCommits.find(c => c.hash === last_commit_hash);
                  let ageYDH: string | undefined;

                  if (lastCommit?.date && lastCommit?.time && lastCommit?.timezone) {

                    const iso = `${lastCommit.date}T${lastCommit.time}${lastCommit.timezone}`;
                    const lastModified = new Date(iso);  
                    const now = new Date();                  
                    const diffMs = Math.max(0, now.getTime() - lastModified.getTime());
                    const { years, days, hours } = diffToYDH(diffMs);
                    ageYDH = `${years}:${days}:${hours}`;
                  }                                    
                  
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs sticky left-0 bg-background border-r z-10">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span
                            style={{ color: getAuthorColor(a.name ?? "").color }}
                            className="font-medium"
                          >
                            {a.name ?? "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs align-top min-w-[170px] max-w-[170px] w-[170px]">
                        <EmailCell primary={a.email} aliases={aliases} showAliases={showRenames} />
                      </TableCell>
                      <TableCell className="text-right">{fmt(m.total_commits ?? 0, totals.total_commits)}</TableCell>
                      <TableCell className="text-right">{fmt(m.insertions ?? 0, totals.insertions)}</TableCell>
                      <TableCell className="text-right">{fmt(m.deletions ?? 0, totals.deletions)}</TableCell>
                      <TableCell className="text-right">{fmt(m.loc ?? 0, totals.loc)}</TableCell>
                      <TableCell className="text-right">{fmt(m.sloc ?? 0, totals.sloc)}</TableCell>
                      <TableCell className="text-right">{m.stability}</TableCell>
                      <TableCell className="text-right">{ageYDH}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
      </CardContent>
    </Card>
  )
}
