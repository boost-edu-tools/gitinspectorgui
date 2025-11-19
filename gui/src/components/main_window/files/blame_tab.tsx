import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAuthorColor } from "@/components/helpers/author_colors"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAnalysis } from "@/hooks/useAnalysis"
import type { AnalysisResult, Author, File, Line, Commit, AnalysisProps } from "@/components/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { fmtDate } from "@/components/helpers/formatting_helpers"

function groupByCommit(lines: Line[]) {
  const groups: Array<{
    commit_hash: string
    lines: Line[]
  }> = []
  for (const ln of lines) {
    const last = groups[groups.length - 1]
    if (last && last.commit_hash === ln.commit_hash) {
      last.lines.push(ln)
    } else {
      groups.push({
        commit_hash: ln.commit_hash,
        lines: [ln],
      })
    }
  }
  return groups
}

export function BlameView({
  selectedRepo,
  selectedFile,
}:
  Pick<
    AnalysisProps,
    "selectedRepo"
    | "selectedFile"> 
    ) {
  const { analysis } = useAnalysis(selectedRepo)

  const [showMetadata, setShowMetadata] = React.useState(true)
  const [hideEmpty, setHideEmpty] = React.useState(false)
  const [hideComments, setHideComments] = React.useState(false)
  const [colorize, setColorize] = React.useState(true)
 

  const repo = (analysis as AnalysisResult | undefined)?.repository
  const commits: Commit[] = repo?.commits ?? []
  const authors: Author[] = repo?.authors ?? []
  const files: File[] = repo?.files ?? []
  const fileIdx = files.findIndex((f) => f.path === selectedFile)
  const file = files[fileIdx]

  const authorById = React.useMemo(
      () => new Map<number, Author>(authors.map((a) => [a.id, a])),
      [authors]
    )

  const authorName = (id: number) => authorById.get(id)?.name ?? "Unknown"

  const filteredLines = React.useMemo(() => {
    const lines = file.lines ?? []
    return lines.filter((ln) => {
      if (hideEmpty && ln.line_type === "WHITESPACE") return false
      if (hideComments && ln.line_type === "CLOC") return false
      return true
    })
  }, [file.lines, hideEmpty, hideComments])

  const groups = React.useMemo(() => groupByCommit(filteredLines), [filteredLines])

  const authorStats = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const ln of filteredLines) {
      const fullCommit = commits.find(c => c.hash === ln.commit_hash)
      const name = authorName(fullCommit?.author_id ?? -1)
      counts[name] = (counts[name] ?? 0) + 1
    }
    const total = filteredLines.length || 1
    return Object.entries(counts)
      .map(([author, lines]) => ({ author, lines, percentage: (lines / total) * 100 }))
      .sort((a, b) => b.lines - a.lines)
  }, [filteredLines])

  const metaCols = showMetadata
    ? "120px 200px 48px 1fr"
    : "48px 1fr"

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor="toggle-metadata" className="text-xs">Show metadata</Label>
          <Switch
            id="toggle-metadata"
            checked={showMetadata}
            onCheckedChange={setShowMetadata}
          />
        </div>
                <div className="flex items-center gap-2">
          <Label htmlFor="toggle-colorize" className="text-xs">Visualise author contributions</Label>
          <Switch
            id="toggle-colorize"
            checked={colorize}
            onCheckedChange={setColorize}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="toggle-hide-empty" className="text-xs">Hide empty</Label>
          <Switch
            id="toggle-hide-empty"
            checked={hideEmpty}
            onCheckedChange={setHideEmpty}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="toggle-hide-comments" className="text-xs">Hide comments</Label>
          <Switch
            id="toggle-hide-comments"
            checked={hideComments}
            onCheckedChange={setHideComments}
          />
        </div>


      </div>

      {(authorStats.length > 0 && colorize) && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Author Contributions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {authorStats
              .map(({ author, lines, percentage }) => {
                const info = getAuthorColor(author) ?? { color: "#888" }
                const colorStyle = colorize
                  ? {
                      borderLeftWidth: "3px",
                      borderLeftColor: (info as any).color,
                      backgroundColor: (info as any).bgColor ?? "transparent",
                    }
                  : { borderLeftWidth: "0px" as const }
                const nameStyle = colorize
                  ? { color: (info as any).color ?? "#888" }
                  : {}

                return (
                  <div
                    key={author}
                    className="flex items-center gap-2 px-3 py-2 rounded border"
                    style={colorStyle}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={nameStyle}>
                        {(info as any).name ?? author}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lines} lines ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <div className="border rounded flex flex-col">
        <div className="border-b bg-muted/30 sticky top-0 z-20">
          <div className="flex items-center justify-between px-2 py-1">
            <div
              className="grid flex-1 font-mono text-[10px] font-semibold text-muted-foreground"
              style={{ gridTemplateColumns: metaCols }}
            >
              {showMetadata && (
                <>
                  <div className="px-2">Author</div>
                  <div className="px-2">Commit (hover for details)</div>
                </>
              )}
              <div className="px-2 text-right">Line</div>
              <div className="px-2">Code</div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 h-[600px]">
          <div className="font-mono text-[11px] leading-5">
            {groups.map((g, gi) => {
              
              
              const fullCommit = commits.find(c => c.hash === g.commit_hash)
              const name = authorName(fullCommit?.author_id?? -1)
              const info = getAuthorColor(name) ?? { color: "#000" }
              const commitHash = fullCommit?.hash ?? ""
              const commitMessage = fullCommit?.message ?? ""
              const commitDate = new Date(`${fullCommit?.date}T${fullCommit?.time}${fullCommit?.timezone}`) 

              const commitNum = fullCommit?.id ?? null
              const paddedNum =
                commitNum != null ? `#${String(commitNum).padStart(2, "0")}` : "—"

              const groupStyle = colorize 
                ? {
                    borderLeftColor: (info as any).color ?? "#000",
                    backgroundColor: (info as any).bgColor ?? "transparent",
                  }
                : {
                    borderLeftColor: "transparent",
                    backgroundColor: "transparent",
                  }

              return (
                <div
                  key={`${commitHash}-${g.lines[0]?.number ?? 0}-${gi}`}
                  className="border-l-2 group transition-opacity"
                  style={groupStyle}
                >
                  {g.lines.map((ln, idx) => (
                    <div
                      key={`${commitHash}-${ln.number}-${idx}`}
                      className="grid hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ gridTemplateColumns: metaCols }}
                    >
                      {showMetadata && (
                        <>
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && <span className="text-[10px]">{name}</span>}
                          </div>

                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="text-[10px] truncate cursor-help"
                                    >
                                      <span className="font-semibold">{paddedNum}</span>
                                      <span className="mx-1">—</span>
                                      <span className="align-middle">{commitMessage || "—"}</span>
                                      
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap">
                                    <div className="text-[10px] leading-4">
                                      <div><span className="font-semibold">Commit No:</span> {commitNum ?? "—"}</div>
                                      <div><span className="font-semibold">SHA:</span> <code>{commitHash}</code></div>
                                        <div><span className="font-semibold">Message: </span>{commitMessage || "—"}</div>
                                        <div><span className="font-semibold">Date:</span> <code>{fmtDate(commitDate)}</code></div>
                                        
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </>
                      )}

                      <span className="sticky left-0 z-10 bg-background px-2 py-0.5 text-muted-foreground text-right select-none border-r border-border/40">
                        {String(ln.number).padStart(3, " ")}
                      </span>

                      <code className="whitespace-pre-wrap break-words text-foreground px-2 py-0.5">
                        {ln.content}
                      </code>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
