import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { Calendar as CalendarIcon } from "lucide-react"

import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { useAnalysis } from "@/hooks/useAnalysis"
import { Commit, SelectedFullProps, AnalysisResult, Author } from "@/components/types"

type FilterRangeProps = Pick<
  SelectedFullProps,
  | "selectedRepo"
  | "selectedAuthors"
  | "startDate"
  | "endDate"
  | "startCommitHash"
  | "endCommitHash"
  | "onStartDateChange"
  | "onEndDateChange"
  | "onStartCommitChange"
  | "onEndCommitChange"
>

const shortHash = (h: string) => h.slice(0, 7)

const fmtDate = (d?: Date | null) => {
  if (!d) return "—"
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d)
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`
  }
}

const toDate = (v: string | number | Date | undefined | null): Date | null => {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  const t = new Date(v)
  return isNaN(t.getTime()) ? null : t
}

const clampDate = (d: Date, min?: Date, max?: Date) => {
  if (!d) return d
  if (min && d < min) return min
  if (max && d > max) return max
  return d
}

const ensureInRange = (from?: Date, to?: Date, min?: Date, max?: Date) => {
  const f = from ? clampDate(from, min, max) : undefined
  const t = to ? clampDate(to, min, max) : undefined
  if (f && t && f > t) return { from: t, to: f }
  return { from: f, to: t }
}

// Normalize to start/end of day
const startOfDay = (d: Date) => {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}
const endOfDay = (d: Date) => {
  const copy = new Date(d)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export function FilterRange({
  selectedRepo,
  selectedAuthors,
  startDate,
  endDate,
  startCommitHash,
  endCommitHash,
  onStartDateChange,
  onEndDateChange,
  onStartCommitChange,
  onEndCommitChange,
}: FilterRangeProps) {
  const { analysis } = useAnalysis(selectedRepo)

  // repo + authors
  const repo = (analysis as AnalysisResult | undefined)?.repository
  const authors: Author[] = repo?.authors ?? []

  // Map for quick author lookup
  const authorById = React.useMemo(
    () => new Map<string, Author>(authors.map((a) => [a.id, a])),
    [authors]
  )

  const getAuthorName = React.useCallback(
    (authorId?: string) => authorById.get(authorId ?? "")?.name ?? "Unknown",
    [authorById]
  )

  // Reset to full repo range whenever the repo actually changes
  const prevRepoIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    // identify the repo stably
    const repoId = repo?.path ?? repo?.name ?? selectedRepo
    if (!repo || !repo?.commits?.length || !repoId) return

    if (prevRepoIdRef.current !== repoId) {
      // compute full, unfiltered time span for the new repo
      const sorted = [...repo.commits]
        .filter(c => c?.hash && c?.date)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      if (sorted.length) {
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        const firstDate = new Date(first.date)
        const lastDate = new Date(last.date)

        onStartDateChange(startOfDay(firstDate))
        onEndDateChange(endOfDay(lastDate))
        onStartCommitChange(first.hash)
        onEndCommitChange(last.hash)
      }

      prevRepoIdRef.current = repoId
    }
  }, [
    repo?.path,
    repo?.name,
    selectedRepo,
    repo?.commits,           
    onStartDateChange,
    onEndDateChange,
    onStartCommitChange,
    onEndCommitChange,
  ])


  const allCommits = React.useMemo<Commit[]>(() => {
    const list: Commit[] = repo?.commits ?? []
    const out: Commit[] = []
    const seen = new Set<string>()

    for (const c of list) {
      if (!c?.hash || seen.has(c.hash)) continue
      const d = toDate(c.date)
      if (!d) continue
      seen.add(c.hash)

      if (selectedAuthors && selectedAuthors.length > 0) {
        const name = getAuthorName(c.authorId)
        if (!selectedAuthors.includes(name)) continue
      }

      out.push(c)
    }

    // Sort by date ascending
    return out.sort((a, b) => {
      const da = toDate(a.date)?.getTime() ?? 0
      const db = toDate(b.date)?.getTime() ?? 0
      return da - db
    })
  }, [repo?.commits, selectedAuthors, getAuthorName])

  // Absolute min/max dates from all commits
  const { absoluteMinDate, absoluteMaxDate } = React.useMemo(() => {
    if (allCommits.length === 0) {
      return {
        absoluteMinDate: undefined as Date | undefined,
        absoluteMaxDate: undefined as Date | undefined,
      }
    }
    return {
      absoluteMinDate: toDate(allCommits[0].date) ?? undefined,
      absoluteMaxDate: toDate(allCommits[allCommits.length - 1].date) ?? undefined,
    }
  }, [allCommits])

  const commits = allCommits

  const commitsInDateRange = React.useMemo<Commit[]>(() => {
    if (!startDate || !endDate) return allCommits

    const start = startOfDay(startDate)
    const end = endOfDay(endDate)

    return allCommits.filter((c) => {
      const cd = toDate(c.date)
      if (!cd) return false
      const t = cd.getTime()
      return t >= start.getTime() && t <= end.getTime()
    })
  }, [allCommits, startDate, endDate])

  // Local UI state
  const [mode, setMode] = React.useState<"date" | "commit">("commit")
  const [commitEdge, setCommitEdge] = React.useState<"start" | "end">("start")
  const [dateDialogOpen, setDateDialogOpen] = React.useState(false)

  // Ensure the controlled selection never drifts outside the allowed window
  const safeStartDate =
    startDate && absoluteMinDate && absoluteMaxDate
      ? clampDate(startDate, absoluteMinDate, absoluteMaxDate)
      : startDate
  const safeEndDate =
    endDate && absoluteMinDate && absoluteMaxDate
      ? clampDate(endDate, absoluteMinDate, absoluteMaxDate)
      : endDate

  React.useEffect(() => {
    if (!absoluteMinDate || !absoluteMaxDate) return
    if (startDate && (startDate < absoluteMinDate || startDate > absoluteMaxDate))
      onStartDateChange(clampDate(startDate, absoluteMinDate, absoluteMaxDate))
    if (endDate && (endDate < absoluteMinDate || endDate > absoluteMaxDate))
      onEndDateChange(clampDate(endDate, absoluteMinDate, absoluteMaxDate))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absoluteMinDate, absoluteMaxDate])

  // Auto-select first and last commits when date range changes
  React.useEffect(() => {
    if (commitsInDateRange.length === 0) return

    const firstCommit = commitsInDateRange[0]
    const lastCommit = commitsInDateRange[commitsInDateRange.length - 1]

    if (firstCommit.hash !== startCommitHash) {
      onStartCommitChange(firstCommit.hash)
    }

    if (lastCommit.hash !== endCommitHash) {
      onEndCommitChange(lastCommit.hash)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitsInDateRange, onStartCommitChange, onEndCommitChange])

  // Indices for current commit selection within all commits
  const startIdxRaw = commits.findIndex((c) => c.hash === startCommitHash)
  const endIdxRaw = commits.findIndex((c) => c.hash === endCommitHash)
  const safeStartIdx = commits.length ? (startIdxRaw >= 0 ? startIdxRaw : 0) : -1
  const safeEndIdx = commits.length ? (endIdxRaw >= 0 ? endIdxRaw : commits.length - 1) : -1

  const startCommit = commits[safeStartIdx]
  const endCommit = commits[safeEndIdx]

  const pickStartIdx = (i: number) => {
    if (!commits.length) return
    const endIdx = safeEndIdx
    const actualIdx = Math.min(Math.max(0, i), endIdx)
    const selectedCommit = commits[actualIdx]
    const d = toDate(selectedCommit.date)
    if (!d) return

    onStartCommitChange(selectedCommit.hash)
    onStartDateChange(startOfDay(d))

    if (endCommit) {
      const ed = toDate(endCommit.date)
      if (ed) {
        const endCommitDate = endOfDay(ed)
        if (!endDate || endCommitDate > endDate) {
          onEndDateChange(endCommitDate)
        }
      }
    }
  }

  const pickEndIdx = (i: number) => {
    if (!commits.length) return
    const startIdx = safeStartIdx
    const actualIdx = Math.max(Math.min(i, commits.length - 1), startIdx)
    const selectedCommit = commits[actualIdx]
    const d = toDate(selectedCommit.date)
    if (!d) return

    onEndCommitChange(selectedCommit.hash)
    onEndDateChange(endOfDay(d))

    if (startCommit) {
      const sd = toDate(startCommit.date)
      if (sd) {
        const startCommitDate = startOfDay(sd)
        if (!startDate || startCommitDate < startDate) {
          onStartDateChange(startCommitDate)
        }
      }
    }
  }

  // Default month for calendar
  const defaultMonth = React.useMemo(() => {
    if (safeStartDate) return safeStartDate
    if (absoluteMinDate) return absoluteMinDate
    return undefined
  }, [safeStartDate, absoluteMinDate])

  return (
    <Card className="bg-transparent border-none shadow-none p-0">
      <CardContent className="p-2">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "date" | "commit")}>
          <TabsList className="inline-grid grid-cols-2 w-full h-7 p-2 bg-transparent">
            <TabsTrigger
              value="date"
               className="
                h-6 px-2 text-[10px] rounded-sm
                data-[state=active]:text-foreground
                data-[state=active]:font-medium
                data-[state=active]:border-b-2
                data-[state=active]:border-primary/70
                data-[state=inactive]:text-muted-foreground
                transition-colors
              "
                 >
              Date
            </TabsTrigger>
            <TabsTrigger
              value="commit"
              className="
                h-6 px-2 text-[10px] rounded-sm
                data-[state=active]:text-foreground
                data-[state=active]:font-medium
                data-[state=active]:border-b-2
                data-[state=active]:border-primary/70
                data-[state=inactive]:text-muted-foreground
                transition-colors
              "
            >
              Commits
            </TabsTrigger>
          </TabsList>

          {/* DATE MODE */}
          <TabsContent value="date" className="mt-2 p-0">
            <Button
              variant="outline"
              className="h-8 w-full justify-between text-xs"
              type="button"
              onClick={() => setDateDialogOpen(true)}
              disabled={!absoluteMinDate || !absoluteMaxDate}
            >
              <span className="truncate">
                {fmtDate(safeStartDate)} – {fmtDate(safeEndDate)}
              </span>
              <CalendarIcon className="ml-2 h-4 w-4 opacity-70 flex-shrink-0" />
            </Button>

            <AlertDialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
              <AlertDialogContent className="sm:w-[760px] w-[92vw] p-0 gap-0 overflow-hidden">
                <AlertDialogHeader className="px-6 pt-6 pb-3 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
                  <AlertDialogTitle className="text-base font-semibold tracking-tight">
                    Select date range
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs mt-1.5">
                    {absoluteMinDate && absoluteMaxDate ? (
                      <>
                        Available:{" "}
                        <span className="font-medium text-foreground">
                          {fmtDate(absoluteMinDate)}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium text-foreground">
                          {fmtDate(absoluteMaxDate)}
                        </span>
                        {commitsInDateRange.length < allCommits.length && (
                          <span className="block mt-1 text-muted-foreground">
                            {commitsInDateRange.length} of {allCommits.length} commits in selected range
                          </span>
                        )}
                      </>
                    ) : (
                      "No commits available to derive a range."
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="p-5 md:p-6 flex items-center justify-center">
                  <div className="flex justify-center h-[400px]">
                    <Calendar
                      mode="range"
                      defaultMonth={defaultMonth}
                      selected={{ from: safeStartDate ?? undefined, to: safeEndDate ?? undefined }}
                      onSelect={(range) => {
                        if (!range) return
                        const { from, to } = ensureInRange(
                          range.from,
                          range.to,
                          absoluteMinDate,
                          absoluteMaxDate
                        )
                        if (from) onStartDateChange(from)
                        if (to) onEndDateChange(to)
                        if (from && !to) onEndDateChange(from)
                        if (!from && to) onStartDateChange(to)
                      }}
                      numberOfMonths={1}
                      fromDate={absoluteMinDate}
                      toDate={absoluteMaxDate}
                      showOutsideDays
                      disabled={(date) => {
                        if (absoluteMinDate && date < absoluteMinDate) return true
                        if (absoluteMaxDate && date > absoluteMaxDate) return true
                        return false
                      }}
                      className="rounded-md border shadow-sm bg-background w-[300px] max-w-full"
                    />
                  </div>
                </div>

                <AlertDialogFooter className="px-6 py-4 border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Selected: </span>
                      <span className="font-semibold text-foreground">{fmtDate(safeStartDate)}</span>
                      <span className="text-muted-foreground mx-1.5">→</span>
                      <span className="font-semibold text-foreground">{fmtDate(safeEndDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="h-8 px-3 text-sm"
                        onClick={() => {
                          if (absoluteMinDate && absoluteMaxDate) {
                            onStartDateChange(absoluteMinDate)
                            onEndDateChange(absoluteMaxDate)
                          }
                        }}
                        disabled={!absoluteMinDate || !absoluteMaxDate}
                      >
                        Full range
                      </Button>
                      <AlertDialogCancel className="mt-0 h-8 px-4 text-sm">Done</AlertDialogCancel>
                    </div>
                  </div>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* COMMIT MODE */}
          <TabsContent value="commit" className="mt-2 p-0">
            <Tabs value={commitEdge} onValueChange={(v) => setCommitEdge(v as "start" | "end")}>
              <TabsList className="inline-grid grid-cols-2 w-full h-6 p-0.5 bg-muted/30">
                <TabsTrigger
                  value="start"
                  className="h-5 text-[10px] rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Start
                </TabsTrigger>
                <TabsTrigger
                  value="end"
                  className="h-5 text-[10px] rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  End
                </TabsTrigger>
              </TabsList>

              {/* Start commit */}
              <TabsContent value="start" className="mt-1.5 p-0">
                <ScrollArea className="h-25 rounded border">
                  <ul className="divide-y divide-border/40">
                    {commits.slice(0, Math.max(0, safeEndIdx) + 1).map((c, i) => {
                      const isSelected = i === safeStartIdx
                      const d = toDate(c.date)
                      const name = getAuthorName(c.authorId)
                      const colors = getAuthorColor(name)
                      return (
                        <li key={c.hash}>
                          <button
                            className={`w-full text-left px-2 py-1.5 transition-colors hover:bg-muted/50 ${
                              isSelected ? "bg-primary/10" : ""
                            }`}
                            onClick={() => pickStartIdx(i)}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                                    isSelected ? "bg-primary" : ""
                                  }`}
                                  style={{
                                    backgroundColor: isSelected ? undefined : colors.bgColor ?? "#ccc",
                                  }}
                                />
                                <code
                                  className="font-mono text-[9px] flex-shrink-0"
                                  style={{ color: colors.color ?? "#888" }}
                                >
                                  {shortHash(c.hash)}
                                </code>
                              </div>
                              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                                {fmtDate(d)}
                              </span>
                            </div>
                            <div className="text-[9px] line-clamp-1 text-muted-foreground pl-3">
                              {c.message}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </ScrollArea>
                <div className="text-[10px] mt-1 px-1 text-muted-foreground">
                  {startCommit
                    ? `${shortHash(startCommit.hash)} • ${fmtDate(toDate(startCommit.date))}`
                    : "No selection"}
                </div>
              </TabsContent>

              {/* End commit */}
              <TabsContent value="end" className="mt-1.5 p-0">
                <ScrollArea className="h-25 rounded border">
                  <ul className="divide-y divide-border/40">
                    {commits.slice(Math.max(0, safeStartIdx)).map((c, offset) => {
                      const i = Math.max(0, safeStartIdx) + offset
                      const isSelected = i === safeEndIdx
                      const d = toDate(c.date)
                      const name = getAuthorName(c.authorId)
                      const colors = getAuthorColor(name)
                      return (
                        <li key={c.hash}>
                          <button
                            className={`w-full text-left px-2 py-1.5 transition-colors hover:bg-muted/50 ${
                              isSelected ? "bg-primary/10" : ""
                            }`}
                            onClick={() => pickEndIdx(i)}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                                    isSelected ? "bg-primary" : ""
                                  }`}
                                  style={{
                                    backgroundColor: isSelected ? undefined : colors.bgColor ?? "#ccc",
                                  }}
                                />
                                <code
                                  className="font-mono text-[9px] flex-shrink-0"
                                  style={{ color: colors.color ?? "#888" }}
                                >
                                  {shortHash(c.hash)}
                                </code>
                              </div>
                              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                                {fmtDate(d)}
                              </span>
                            </div>
                            <div className="text-[9px] line-clamp-1 text-muted-foreground pl-3">
                              {c.message}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </ScrollArea>
                <div className="text-[10px] mt-1 px-1 text-muted-foreground">
                  {endCommit
                    ? `${shortHash(endCommit.hash)} • ${fmtDate(toDate(endCommit.date))}`
                    : "No selection"}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}