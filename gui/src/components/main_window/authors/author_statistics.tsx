import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { SelectedFullProps, AnalysisResult, Author } from "@/components/types"
import { useAnalysis } from "@/hooks/useAnalysis"

type SelectedProps = Pick<
  SelectedFullProps,
  "allAuthors" | "selectedAuthors" | "filterData" | "selectedRepo"
>

type RowOut = {
  name: string
  commits: number
  insertions: number
  deletions: number
  percentage_of_changes: string
  rows: number                 // showing SLOC in the "LOCs" column
  percentage_in_comments: string // approx: (LOC - SLOC)/LOC
}

export function Overview({
  allAuthors,
  selectedAuthors,
  filterData,
  selectedRepo,
}: SelectedProps) {
  const { analysis } = useAnalysis(selectedRepo)
  const repo = (analysis as AnalysisResult | undefined)?.repository
  const authors: Author[] = repo?.authors ?? []

  // Build rows directly from author.metrics
  const perAuthor = React.useMemo<RowOut[]>(() => {
    if (!authors.length) return []

    // normalize metrics for each author
    const normalized = authors.map((a) => {
      const m = a.metrics ?? {
        insertions: 0,
        deletions: 0,
        total_commits: 0,
        loc: 0,
        sloc: 0,
      }
      return {
        name: a.name ?? "Unknown",
        insertions: m.insertions ?? 0,
        deletions: m.deletions ?? 0,
        total_commits: m.total_commits ?? 0,
        loc: m.loc ?? 0,
        sloc: m.sloc ?? 0,
      }
    })

    const totalChanges =
      normalized.reduce((acc, a) => acc + a.insertions + a.deletions, 0) || 1

    const rows = normalized.map((a) => {
      const pctChanges = ((a.insertions + a.deletions) / totalChanges) * 100
      const commentApprox = a.loc > 0 ? ((a.loc - a.sloc) / a.loc) * 100 : 0

      return {
        name: a.name,
        commits: a.total_commits,
        insertions: a.insertions,
        deletions: a.deletions,
        percentage_of_changes: `${pctChanges.toFixed(1)}%`,
        rows: a.sloc, // display SLOC
        percentage_in_comments: `${commentApprox.toFixed(1)}%`,
      }
    })

    // Sort by most total changes
    rows.sort(
      (x, y) => y.insertions + y.deletions - (x.insertions + x.deletions)
    )
    return rows
  }, [authors])

  // Filter to visible authors (selected vs all)
  const filtered = React.useMemo(() => {
    const names = filterData ? selectedAuthors : Array.from(allAuthors)
    const allow = new Set(names)
    return perAuthor.filter((a) => allow.has(a.name))
  }, [perAuthor, filterData, selectedAuthors, allAuthors])

  return (
    <Card>
      <CardHeader className="space-y-0">
        <CardTitle className="text-sm">Author Statistics</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid w-full [&>div]:border [&>div]:rounded">
          <Table>
            <TableHeader>
              <TableRow className="*:whitespace-nowrap hover:bg-background">
                <TableHead className="pl-4 sticky left-0 bg-background min-w-[50px]">
                  Name
                </TableHead>
                <TableHead>Commits</TableHead>
                <TableHead>Insertions</TableHead>
                <TableHead>Deletions</TableHead>
                <TableHead>% of changes</TableHead>
                <TableHead>LOCs</TableHead>
                <TableHead>% in comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-hidden">
              {filtered.map((author) => (
                <TableRow
                  key={author.name}
                  className="group odd:bg-muted [&>td]:whitespace-nowrap hover:[&>td]:bg-blue-100 dark:hover:[&>td]:bg-blue-400"
                >
                  <TableCell className="pl-4 sticky left-0 bg-background group-odd:bg-muted group-hover:bg-blue-100">
                    <span style={{ color: getAuthorColor(author.name).color }}>
                      {author.name}
                    </span>
                  </TableCell>
                  <TableCell>{author.commits}</TableCell>
                  <TableCell>{author.insertions}</TableCell>
                  <TableCell>{author.deletions}</TableCell>
                  <TableCell>{author.percentage_of_changes}</TableCell>
                  <TableCell>{author.rows}</TableCell>
                  <TableCell>{author.percentage_in_comments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
