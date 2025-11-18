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

import { getAuthorColor } from "@/components/helpers/author_colors"
import { useAnalysis } from "@/hooks/useAnalysis"
import { Commit, AnalysisProps, AnalysisResult, Author } from "@/components/types"

import { shortHash, fmtDate } from "@/components/helpers/formatting_helpers"


export function FilterRange({
  selectedRepo,
  startDate,
  endDate,
  startCommitHash,
  endCommitHash,
  onStartDateChange,
  onEndDateChange,
  onStartCommitChange,
  onEndCommitChange,
}: 
  Pick<
    AnalysisProps,
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
  >) {
  
  const { analysis } = useAnalysis(selectedRepo)
  const repo = (analysis as AnalysisResult).repository
  const commits: Commit[] = repo.commits
  const authors: Author[] = repo.authors
  const authorById = React.useMemo(
    () => new Map<number, Author>(authors.map((a) => [a.id, a])),
    [authors]
  )

  const clampDate = (d: Date, min?: Date, max?: Date) => {
  if (!d) return d
  if (min && d < min) return min
  if (max && d > max) return max
  return d}

  const setTimeOnDate = (date: Date, timeHHMM: string) => {
    const [hStr = "0", mStr = "0"] = timeHHMM.split(":")
    const h = Number(hStr)
    const m = Number(mStr)
    const nd = new Date(date)
    nd.setHours(h, m)   
    return nd
  }

  const ensureChronology = (from?: Date, to?: Date) => {
    if (from && to && from > to) return { from: to, to: from }
    return { from, to }
  }

  const getFullRepoRange = (commits: Commit[]) => {

    const first = commits[0]
    const last = commits[commits.length - 1]
    const startDateStr = `${first.date}T${first.time}${first.timezone}`
    const endDateStr = `${last.date}T${last.time}${last.timezone}`

    return {
      startHash: first.hash,
      endHash: last.hash,
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr),
    }
  }

  const { range } = React.useMemo(() => {
    return {
      range: getFullRepoRange(repo.commits)
    }
  }, [selectedRepo])

  React.useEffect(() => {
    onStartCommitChange(range.startHash)
    onEndCommitChange(range.endHash)
    onStartDateChange(range.startDate)
    onEndDateChange(range.endDate)

  }, [range, onStartCommitChange, onEndCommitChange, onStartDateChange, onEndDateChange])

  const { absoluteMinDate, absoluteMaxDate } = React.useMemo(() => {
    return {
      absoluteMinDate: range.startDate,
      absoluteMaxDate: range.endDate,
    }
  }, [range])

  const [dateDialogOpen, setDateDialogOpen] = React.useState(false)
  const [hoveredCommitIndex, setHoveredCommitIndex] = React.useState<number | null>(null)

  const safeStartDate = React.useMemo(() => {
    return clampDate(startDate, absoluteMinDate, absoluteMaxDate)
  }, [startDate, absoluteMinDate, absoluteMaxDate])

  const safeEndDate = React.useMemo(() => {
    return clampDate(endDate, absoluteMinDate, absoluteMaxDate)
  }, [endDate, absoluteMinDate, absoluteMaxDate])

  const commitsInDateRange = React.useMemo<Commit[]>(() => {
    return commits.filter((c) => {
      const cd = new Date(`${c.date}T${c.time}${c.timezone}`)
      return cd.getTime() >= safeStartDate.getTime() && cd.getTime() <= safeEndDate.getTime()
    })
  }, [commits, safeStartDate, safeEndDate])

  const startIdx = commits.findIndex((c) => c.hash === startCommitHash)
  const endIdx = commits.findIndex((c) => c.hash === endCommitHash)
  const startCommit = commits[startIdx]
  const endCommit = commits[endIdx]

  React.useEffect(() => {
    if (commitsInDateRange.length === 0) return
    const firstCommit = commitsInDateRange[0]
    const lastCommit = commitsInDateRange[commitsInDateRange.length - 1]
    onStartCommitChange(firstCommit.hash)
    onEndCommitChange(lastCommit.hash)
  }, [commitsInDateRange, onStartCommitChange, onEndCommitChange])

  const applyStartSelection = (idx: number) => {
    const selected = commits[idx]
    const selected_date = new Date(`${selected.date}T${selected.time}${selected.timezone}`)
    onStartCommitChange(selected.hash)
    onStartDateChange(new Date(selected_date))
  }
  const applyEndSelection = (idx: number) => {
    const selected = commits[idx]
    const selected_date = new Date(`${selected.date}T${selected.time}${selected.timezone}`)
    onEndCommitChange(selected.hash)
    onEndDateChange(new Date(selected_date))
    
  }

  React.useEffect(() => {
    if (commits.findIndex((c) => c.hash === endCommitHash) < commits.findIndex((c) => c.hash === startCommitHash)) 
      {
      onStartCommitChange(endCommit.hash);
      onEndCommitChange(startCommit.hash);
      onStartDateChange(new Date (`${endCommit.date}T${endCommit.time}${endCommit.timezone}`));
      onEndDateChange(new Date (`${startCommit.date}T${startCommit.time}${startCommit.timezone}`));
  }}, [startCommitHash, endCommitHash, onStartCommitChange, onEndCommitChange, onStartDateChange, onEndDateChange]);

  const applyCalendarSelection = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return 
    let from = range.from ? new Date(range.from) : undefined
    let to = range.to ? new Date(range.to) : undefined
    const norm = ensureChronology(from, to)
    if (norm.from) onStartDateChange(norm.from)
    if (norm.to) onEndDateChange(norm.to)
  }

  return (
    <Card className="bg-transparent border-none shadow-none p-0">
      <CardContent className="p-2 space-y-2">
        <div className="flex items-start gap-2">

          <Button
            variant="outline"
            className="h-7 px-2 text-[10px] inline-flex items-center gap-1"
            type="button"
            onClick={() => setDateDialogOpen(true)}>
            Change Date Range
          </Button>
        </div>

        <ScrollArea className="h-30 rounded border">
          <ul className="divide-y divide-border/40">
            {commits.map((c, i) => {
              const d = new Date(`${c.date}T${c.time}${c.timezone}`)
              const name = authorById.get(c.author_id)?.name ?? "Unknown"
              const colors = getAuthorColor(name)

              const normalizedStart = Math.max(0, startIdx)
              const normalizedEnd = Math.max(normalizedStart, endIdx)

              const inRange = i >= normalizedStart && i <= normalizedEnd
              const isStart = i === normalizedStart
              const isEnd = i === normalizedEnd
              const isHovered = hoveredCommitIndex === i

              const beforeStart = i < normalizedStart
              const afterEnd = i > normalizedEnd


              const showStartClickable = isHovered &&  !isStart
              const showEndClickable = isHovered && !isEnd

              const handleStartClick = () => {
                if (afterEnd) {
                  applyStartSelection(i)
                  applyEndSelection(i)
                } else {
                  applyStartSelection(i)
                }
              }

              const handleEndClick = () => {
                if (beforeStart) {
                  applyStartSelection(i)
                  applyEndSelection(i)
                } else {
                  applyEndSelection(i)
                }
              }

              return (
                <li
                  key={c.hash}
                  onMouseEnter={() => setHoveredCommitIndex(i)}
                  onMouseLeave={() => setHoveredCommitIndex(null)}
                >
                  <div
                    className={`w-full text-left px-2 py-1 transition-colors ${
                      inRange ? "bg-gray-200" : ""
                    } ${isHovered ? "bg-gray-300" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                            isStart || isEnd ? "bg-primary" : ""
                          }`}
                          style={{
                            backgroundColor:
                              isStart || isEnd ? undefined : colors.bgColor ?? "#ccc",
                          }}
                        />
                        <code
                          className="font-mono text-[10px] flex-shrink-0"
                          style={{ color: colors.color ?? "#888" }}
                        >
                          {shortHash(c.hash)}
                        </code>
                        <span className="text-[10px] text-muted-foreground truncate ml-1 max-w-[70px]">
                          {c.message}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isStart && (
                          <span className="text-[9px] rounded px-1 py-0.5 bg-white text-primary">
                            start
                          </span>
                          
                        )}
                        {showStartClickable && (
                          <button
                            onClick={handleStartClick}
                            className="text-[9px] rounded px-1.5 py-0.5 bg-primary/90 text-primary-foreground hover:bg-primary transition-colors"
                          >
                            start
                          </button>
                        )}

                        {isEnd && (
                          <span className="text-[9px] rounded px-1 py-0.5 bg-white text-primary">
                            end
                          </span>
                        )}
                        {showEndClickable && (
                          <button
                            onClick={handleEndClick}
                            className="text-[9px] rounded px-1.5 py-0.5 bg-primary/90 text-primary-foreground hover:bg-primary transition-colors"
                          >
                            end
                          </button>
                        )}

                        {!isStart && !isEnd && !isHovered && (
                          <span className="text-[9px] text-muted-foreground flex-shrink-0">
                            {fmtDate(d)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </ScrollArea>

                  <div className="flex-1 min-w-0">
            {startCommit && endCommit ? (
              <div className="text-[10px] leading-tight text-foreground truncate">
                <div className="truncate">
                  <span className="inline-block w-6 text-muted-foreground">Start:</span> {shortHash(startCommit.hash)} • {fmtDate(new Date(`${startCommit.date}T${startCommit.time}${startCommit.timezone}`))}
                </div>
                <div className="truncate">
                  <span className="inline-block w-6 text-muted-foreground">End: </span> {shortHash(endCommit.hash)} • {fmtDate(new Date(`${endCommit.date}T${endCommit.time}${endCommit.timezone}`))}
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground">No selection</div>
            )}
          </div>

        <AlertDialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
          <AlertDialogContent className="w-[92vw] max-w-[380px] p-0 gap-0 overflow-hidden">
            <AlertDialogHeader className="px-4 pt-4 pb-2 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <AlertDialogTitle className="text-sm font-semibold tracking-tight">Select date & time</AlertDialogTitle>
              <AlertDialogDescription className="text-[11px] mt-1.5">
                {absoluteMinDate && absoluteMaxDate ? (
                  <>
                    Available: <span className="font-medium text-foreground">{fmtDate(absoluteMinDate)}</span> to {" "}
                    <span className="font-medium text-foreground">{fmtDate(absoluteMaxDate)}</span>
                  </>
                ) : (
                  "No commits available to derive a range."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="p-4 flex flex-col items-center">
              <Calendar
                mode="range"
                defaultMonth={safeStartDate}
                selected={{ from: safeStartDate, to: safeEndDate}}
                onSelect={applyCalendarSelection}
                numberOfMonths={1}
                showOutsideDays
                disabled={(date) => {
                  if (date < absoluteMinDate) return true
                  if (date > absoluteMaxDate) return true
                  return false
                }}
                className="rounded-md border shadow-sm bg-background w-[320px] max-w-full"
              />

              <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-[320px]">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">Start time</label>
                  <input
                    type="time"
                    value={`${String(safeStartDate.getHours()).padStart(2, "0")}:${String(safeStartDate.getMinutes()).padStart(2, "0")}`}
                    onChange={(e) => onStartDateChange(setTimeOnDate(safeStartDate, e.target.value))}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">End time</label>
                  <input
                    type="time"
                    value={`${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`}
                    onChange={(e) => onEndDateChange(setTimeOnDate(endDate, e.target.value))}
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
                  {commitsInDateRange.length} of {commits.length} commits in range
                </div>
              )}
            </div>

            <AlertDialogFooter className="px-4 py-3 border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <div className="flex items-center justify-between w-full gap-3">
                <div ></div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs "
                    onClick={() => {
                        onStartDateChange(absoluteMinDate)
                        onEndDateChange(absoluteMaxDate)
                    }}
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