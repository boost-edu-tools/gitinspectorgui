import * as React from "react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Calendar as CalendarIcon, Info as InfoIcon } from "lucide-react"

import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { useAnalysis } from "@/hooks/useAnalysis"
import { Commit, SelectedFullProps, AnalysisResult, Author } from "@/components/types"

/**
 * Unified sidebar component:
 * - Single view (no tabs).
 * - Top bar shows current commit+date range, an info tooltip, and a calendar button to adjust dates.
 * - Commit picker: single compact scrollable list with clear start/end chips and range highlight.
 * - Date dialog: compact, time pickers below the calendar (HH:MM), defaults 00:00–23:59.
 */

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
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`
  }
}

const toDate = (v: string | number | Date | undefined | null): Date | null => {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  const t = new Date(v)
  return isNaN(t.getTime()) ? null : t
}

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

const clampDate = (d: Date, min?: Date, max?: Date) => {
  if (!d) return d
  if (min && d < min) return min
  if (max && d > max) return max
  return d
}

const setTimeOnDate = (date: Date, timeHHMM: string) => {
  const [hStr = "0", mStr = "0"] = timeHHMM.split(":")
  const h = Number(hStr)
  const m = Number(mStr)
  const nd = new Date(date)
  if (!isNaN(h) && !isNaN(m)) nd.setHours(h, m, timeHHMM === "23:59" ? 59 : 0, timeHHMM === "23:59" ? 999 : 0)
  return nd
}

const ensureChronology = (from?: Date, to?: Date) => {
  if (from && to && from > to) return { from: to, to: from }
  return { from, to }
}

const getFullRepoRange = (commits: Commit[]) => {
  const sorted = commits
    .filter((c) => c?.hash && c?.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (!sorted.length) return null
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const firstDate = new Date(first.date)
  const lastDate = new Date(last.date)
  return {
    startHash: first.hash,
    endHash: last.hash,
    startDate: startOfDay(firstDate),
    endDate: endOfDay(lastDate),
  }
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

  // Identify the repo stably (path > name > selectedRepo)
  const repoId = React.useMemo(
    () => repo?.path ?? repo?.name ?? selectedRepo ?? null,
    [repo?.path, repo?.name, selectedRepo]
  )

  const lastRepoIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!repo || !repo?.commits?.length || !repoId) return

    if (lastRepoIdRef.current !== repoId) {
      const range = getFullRepoRange(repo.commits)
      if (range) {
        onStartCommitChange(range.startHash)
        onEndCommitChange(range.endHash)
        onStartDateChange(range.startDate)
        onEndDateChange(range.endDate)
      }
      lastRepoIdRef.current = repoId
    }
  }, [
    repoId,
    repo?.commits,
    onStartCommitChange,
    onEndCommitChange,
    onStartDateChange,
    onEndDateChange,
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

  // Local UI state
  const [dateDialogOpen, setDateDialogOpen] = React.useState(false)

  // Time strings
  const startTimeStr = React.useMemo(() => {
    const d = startDate ? new Date(startDate) : undefined
    return d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "00:00"
  }, [startDate])

  const endTimeStr = React.useMemo(() => {
    const d = endDate ? new Date(endDate) : undefined
    return d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "23:59"
  }, [endDate])

  // Derived safe dates clamped to absolute range
  const safeStartDate = React.useMemo(() => {
    if (!startDate) return startDate as Date | undefined
    return absoluteMinDate && absoluteMaxDate
      ? clampDate(startDate, startOfDay(absoluteMinDate), endOfDay(absoluteMaxDate))
      : startDate
  }, [startDate, absoluteMinDate, absoluteMaxDate])

  const safeEndDate = React.useMemo(() => {
    if (!endDate) return endDate as Date | undefined
    return absoluteMinDate && absoluteMaxDate
      ? clampDate(endDate, startOfDay(absoluteMinDate), endOfDay(absoluteMaxDate))
      : endDate
  }, [endDate, absoluteMinDate, absoluteMaxDate])

  React.useEffect(() => {
    if (!absoluteMinDate || !absoluteMaxDate) return
    if (startDate && (startDate < startOfDay(absoluteMinDate) || startDate > endOfDay(absoluteMaxDate)))
      onStartDateChange(clampDate(startDate, startOfDay(absoluteMinDate), endOfDay(absoluteMaxDate)))
    if (endDate && (endDate < startOfDay(absoluteMinDate) || endDate > endOfDay(absoluteMaxDate)))
      onEndDateChange(clampDate(endDate, startOfDay(absoluteMinDate), endOfDay(absoluteMaxDate)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absoluteMinDate, absoluteMaxDate])

  // Filter commits by date range (inclusive)
  const commitsInDateRange = React.useMemo<Commit[]>(() => {
    if (!safeStartDate || !safeEndDate) return allCommits
    return allCommits.filter((c) => {
      const cd = toDate(c.date)
      if (!cd) return false
      return cd.getTime() >= safeStartDate.getTime() && cd.getTime() <= safeEndDate.getTime()
    })
  }, [allCommits, safeStartDate, safeEndDate])

  // Indices for current commit selection within all commits
  const startIdxRaw = commits.findIndex((c) => c.hash === startCommitHash)
  const endIdxRaw = commits.findIndex((c) => c.hash === endCommitHash)
  const safeStartIdx = commits.length ? (startIdxRaw >= 0 ? startIdxRaw : 0) : -1
  const safeEndIdx = commits.length ? (endIdxRaw >= 0 ? endIdxRaw : commits.length - 1) : -1

  const startCommit = commits[safeStartIdx]
  const endCommit = commits[safeEndIdx]

  // Selection behavior: first click sets start; second sets end; thereafter choose nearer edge
  const [hasPickedOnce, setHasPickedOnce] = React.useState(false)

  React.useEffect(() => {
    // When date range changes externally, auto-select first/last commits inside the range
    if (commitsInDateRange.length === 0) return
    const firstCommit = commitsInDateRange[0]
    const lastCommit = commitsInDateRange[commitsInDateRange.length - 1]
    if (firstCommit.hash !== startCommitHash) onStartCommitChange(firstCommit.hash)
    if (lastCommit.hash !== endCommitHash) onEndCommitChange(lastCommit.hash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitsInDateRange, onStartCommitChange, onEndCommitChange])

  const applyStartSelection = (idx: number) => {
    const selected = commits[idx]
    const d = toDate(selected.date)
    if (!d) return
    onStartCommitChange(selected.hash)
    onStartDateChange(setTimeOnDate(startOfDay(d), startTimeStr || "00:00"))
  }
  const applyEndSelection = (idx: number) => {
    const selected = commits[idx]
    const d = toDate(selected.date)
    if (!d) return
    onEndCommitChange(selected.hash)
    onEndDateChange(setTimeOnDate(endOfDay(d), endTimeStr || "23:59"))
  }

    // state
  const [nextPick, setNextPick] = React.useState<'start' | 'end'>('start')


  const handleCommitClick = (idx: number) => {
  if (!commits.length) return

  if (nextPick === 'start') {
    applyStartSelection(idx)
    setNextPick('end')
  } else {
    applyEndSelection(idx)
    setNextPick('start')
  }
}


  // Default month for calendar
  const defaultMonth = React.useMemo(() => {
    if (safeStartDate) return safeStartDate
    if (absoluteMinDate) return absoluteMinDate
    return undefined
  }, [safeStartDate, absoluteMinDate])

  const applyCalendarSelection = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return
    let from = range.from ? new Date(range.from) : undefined
    let to = range.to ? new Date(range.to) : undefined

    if (from) from = setTimeOnDate(from, startTimeStr || "00:00")
    if (to) to = setTimeOnDate(to, endTimeStr || "23:59")
    const norm = ensureChronology(from, to)

    if (norm.from) onStartDateChange(norm.from)
    if (norm.to) onEndDateChange(norm.to)

    if (norm.from && !norm.to) onEndDateChange(norm.from)
    if (!norm.from && norm.to) onStartDateChange(norm.to)
  }

  const onStartTimeChange = (value: string) => {
    const base = safeStartDate || absoluteMinDate || new Date()
    const withTime = setTimeOnDate(base, value || "00:00")
    if (safeEndDate && withTime > safeEndDate) {
      const adjusted = ensureChronology(withTime, safeEndDate)
      onStartDateChange(adjusted.from!)
      onEndDateChange(adjusted.to!)
    } else {
      onStartDateChange(withTime)
    }
  }

  const onEndTimeChange = (value: string) => {
    const base = safeEndDate || absoluteMaxDate || new Date()
    const withTime = setTimeOnDate(base, value || "23:59")
    if (safeStartDate && withTime < safeStartDate) {
      const adjusted = ensureChronology(safeStartDate, withTime)
      onStartDateChange(adjusted.from!)
      onEndDateChange(adjusted.to!)
    } else {
      onEndDateChange(withTime)
    }
  }

  return (
    <Card className="bg-transparent border-none shadow-none p-0">
      <CardContent className="p-2 space-y-2">
        {/* Top bar: current selection + actions */}
        <div className="flex items-start gap-2">


          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button aria-label="How selection works" className="h-7 w-7 inline-flex items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-muted/50">
                  <InfoIcon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] text-[11px] leading-snug">
                To change the commit range, see the commit list below.<br/> The first click will set the first commit, the second click will set the last commit.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            className="h-7 px-2 text-[10px] inline-flex items-center gap-1"
            type="button"
            onClick={() => setDateDialogOpen(true)}
            disabled={!absoluteMinDate || !absoluteMaxDate}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Change date range
          </Button>
        </div>

        {/* Commit list */}
        <ScrollArea className="h-30 rounded border">
          <ul className="divide-y divide-border/40">
            {commits.map((c, i) => {
              const d = toDate(c.date)
              const name = getAuthorName(c.authorId)
              const colors = getAuthorColor(name)
              const inRange = i >= Math.max(0, safeStartIdx) && i <= Math.max(0, safeEndIdx)
              const isStart = i === Math.max(0, safeStartIdx)
              const isEnd = i === Math.max(0, safeEndIdx)
              return (
                <li key={c.hash}>
                  <button
                    className={`w-full text-left px-2 py-1 transition-colors hover:bg-muted/60 ${inRange ? "bg-primary/10" : ""}`}
                    onClick={() => handleCommitClick(i)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${isStart || isEnd ? "bg-primary" : ""}`}
                          style={{ backgroundColor: isStart || isEnd ? undefined : colors.bgColor ?? "#ccc" }}
                        />
                        <code className="font-mono text-[10px] flex-shrink-0" style={{ color: colors.color ?? "#888" }}>
                          {shortHash(c.hash)}
                        </code>
                        <span className="text-[10px] text-muted-foreground truncate ml-1 max-w-[70px]">{c.message}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isStart && (
                          <span className="text-[9px] rounded px-1 py-0.5 bg-white text-primary ">start</span>
                        )}
                        {isEnd && (
                          <span className="text-[9px] rounded px-1 py-0.5 bg-white text-primary">end</span>
                        )}
                        {!isStart && !isEnd && (
                          <span className="text-[9px] text-muted-foreground flex-shrink-0">{fmtDate(d)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
                  <div className="flex-1 min-w-0">
            {startCommit && endCommit ? (
              <div className="text-[10px] leading-tight text-foreground truncate">
                <div className="truncate">
                  <span className="inline-block w-6 text-muted-foreground">Start:</span> {shortHash(startCommit.hash)} • {fmtDate(toDate(startCommit.date))}
                </div>
                <div className="truncate">
                  <span className="inline-block w-6 text-muted-foreground">End: </span> {shortHash(endCommit.hash)} • {fmtDate(toDate(endCommit.date))}
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground">No selection</div>
            )}
          </div>

        {/* Date dialog (compact, sidebar-friendly) */}
        <AlertDialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
          <AlertDialogContent className="w-[92vw] max-w-[380px] p-0 gap-0 overflow-hidden">
            <AlertDialogHeader className="px-4 pt-4 pb-2 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <AlertDialogTitle className="text-sm font-semibold tracking-tight">Select date & time</AlertDialogTitle>
              <AlertDialogDescription className="text-[11px] mt-1.5">
                {absoluteMinDate && absoluteMaxDate ? (
                  <>
                    Available: <span className="font-medium text-foreground">{fmtDate(startOfDay(absoluteMinDate))}</span> to {" "}
                    <span className="font-medium text-foreground">{fmtDate(endOfDay(absoluteMaxDate))}</span>
                  </>
                ) : (
                  "No commits available to derive a range."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="p-4 flex flex-col items-center">
              <Calendar
                mode="range"
                defaultMonth={defaultMonth}
                selected={{ from: safeStartDate ?? undefined, to: safeEndDate ?? undefined }}
                onSelect={applyCalendarSelection}
                numberOfMonths={1}
                fromDate={absoluteMinDate}
                toDate={absoluteMaxDate}
                showOutsideDays
                disabled={(date) => {
                  if (absoluteMinDate && date < absoluteMinDate) return true
                  if (absoluteMaxDate && date > absoluteMaxDate) return true
                  return false
                }}
                className="rounded-md border shadow-sm bg-background w-[320px] max-w-full"
              />

              {/* Time selectors BELOW calendar for nicer formatting */}
              <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-[320px]">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">Start time</label>
                  <input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => onStartTimeChange(e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">End time</label>
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => onEndTimeChange(e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="w-full max-w-[320px] text-[11px] mt-3">
                <span className="text-muted-foreground">Selected: </span>
                <span className="font-semibold text-foreground">{fmtDate(safeStartDate)}</span>
                <span className="text-muted-foreground mx-1.5">→</span>
                <span className="font-semibold text-foreground">{fmtDate(safeEndDate)}</span>
              </div>

              {absoluteMinDate && absoluteMaxDate && (
                <div className="w-full max-w-[320px] text-[11px] text-muted-foreground mt-1">
                  {commitsInDateRange.length} of {allCommits.length} commits in range
                </div>
              )}
            </div>

            <AlertDialogFooter className="px-4 py-3 border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <div className="flex items-center justify-between w-full gap-3">
                <div ></div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      if (absoluteMinDate && absoluteMaxDate) {
                        onStartDateChange(setTimeOnDate(startOfDay(absoluteMinDate), "00:00"))
                        onEndDateChange(setTimeOnDate(endOfDay(absoluteMaxDate), "23:59"))
                      }
                    }}
                    disabled={!absoluteMinDate || !absoluteMaxDate}
                  >
                    Full range
                  </Button>
                  <AlertDialogCancel className="mt-0 h-8 px-3 text-xs">Done</AlertDialogCancel>
                </div>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
