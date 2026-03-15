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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Users, User } from "lucide-react"
import { getAuthorColor } from "@/components/helpers/author_colors"
import type { AnalysisResult, Author} from "@/components/types"
import { fmt_pct_abs, time_diff_YMD, MetricHeader} from "@/components/helpers/formatting_helpers"

export function AuthorStatisticsOverview(
  {repository}: Pick<AnalysisResult, "repository">) {

  const [displayMode, setDisplayMode] = React.useState<"absolute" | "percentage">("absolute")
  const authors: Author[] = repository?.authors ?? []
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
    return authors.sort((a, b) => {
      return (b.metrics?.total_commits ?? 0) - (a.metrics?.total_commits ?? 0)
    })
  }, [authors])

  return (
    <Card>
      <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Author Statistics</CardTitle>

            <div className="flex items-center space-x-2">

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

          <div className="grid w-full [&>div]:border [&>div]:rounded overflow-auto py-4">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="hover:bg-background">
                  <TableHead className="font-semibold sticky left-0 bg-muted border-r w-[200px] z-10">
                    Author
                  </TableHead>
                  <TableHead className="min-w-[170px] max-w-[170x] w-[170px]">Email</TableHead>
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
                    <MetricHeader metricKey="last_modified" />
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow className="bg-muted/30 border-b-2">
                  <TableCell className="font-semibold sticky left-0 bg-muted border-r z-10">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>All Authors ({sortedAuthors.length})</span>
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

                {Array.from(sortedAuthors).map((a) => {
                  
                  const m = a.metrics ?? {}
                  const lastModified = new Date(`${a.last_modified_date}T${a.last_modified_time}${a.last_modified_timezone}`);  
                  const now = new Date();                  
                  const diffMs = Math.max(0, now.getTime() - lastModified.getTime());
                  const { years, months, days } = time_diff_YMD(diffMs);
                  const formattedDate = lastModified.toISOString().slice(0, 10); // YYYY-MM-DD
                  const formattedRelative = `${years}y ${months}m ${days}d ago`;

                  const lastModifiedDisplay =
                    displayMode === "percentage" ? formattedRelative : formattedDate;
                                   
                  return (
                    <TableRow key={a.id} >
                      <TableCell className="font-mono text-xs sticky left-0 bg-muted border-r z-10">
                        <div className="flex items-center gap-2 ">
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
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-mono block truncate">
                                    {a.email}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{a.email}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                      <TableCell className="text-right">{fmt_pct_abs(m.total_commits ?? 0, totals.total_commits, displayMode)}</TableCell>
                      <TableCell className="text-right">{fmt_pct_abs(m.insertions ?? 0, totals.insertions, displayMode)}</TableCell>
                      <TableCell className="text-right">{fmt_pct_abs(m.deletions ?? 0, totals.deletions, displayMode)}</TableCell>
                      <TableCell className="text-right">{fmt_pct_abs(m.loc ?? 0, totals.loc, displayMode)}</TableCell>
                      <TableCell className="text-right">{fmt_pct_abs(m.sloc ?? 0, totals.sloc, displayMode)}</TableCell>
                      <TableCell className="text-right">{m.stability}</TableCell>
                      <TableCell className="text-right">{lastModifiedDisplay}</TableCell>
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
