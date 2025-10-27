import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAuthorColor } from "@/components/helpers/AuthorColors"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { AuthorId, Author, FileEntry, LineEntry, Commit } from "@/components/types"

/** group adjacent lines by commit hash (using line metadata) */
function groupByCommit(lines: LineEntry[]) {
  const groups: Array<{
    commitHash: string
    commitMessage: string
    authorId: AuthorId
    timestamp: string
    lines: LineEntry[]
  }> = []
  for (const ln of lines) {
    const last = groups[groups.length - 1]
    if (last && last.commitHash === ln.commitHash) {
      last.lines.push(ln)
    } else {
      groups.push({
        commitHash: ln.commitHash,
        commitMessage: ln.commitMessage ?? "",
        authorId: ln.authorId,
        timestamp: ln.date ?? "",
        lines: [ln],
      })
    }
  }
  return groups
}

function shortHash(hash: string) {
  return hash?.slice(0, 7) ?? ""
}

function formatCompact(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts ?? ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function BlameView({
  file,
  authorsById,
  commitsByHash,
  selectedAuthors,
}: {
  file: FileEntry
  authorsById: Map<AuthorId, Author>
  commitsByHash: Map<string, Commit>
  selectedAuthors: string[]
}) {
  const [showMetadata, setShowMetadata] = React.useState(true)
  const [hideEmpty, setHideEmpty] = React.useState(false)
  const [hideComments, setHideComments] = React.useState(false)
  const [colorize, setColorize] = React.useState(true)

  const authorName = (id: AuthorId) => authorsById.get(id)?.name ?? "Unknown"

  // filter lines by line_type before grouping
  const filteredLines = React.useMemo(() => {
    const lines = file.lines ?? []
    return lines.filter((ln) => {
      if (hideEmpty && ln.line_type === 0) return false
      if (hideComments && ln.line_type === 1) return false
      return true
    })
  }, [file.lines, hideEmpty, hideComments])

  const groups = React.useMemo(() => groupByCommit(filteredLines), [filteredLines])

  const authorStats = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const ln of filteredLines) {
      const name = authorName(ln.authorId)
      counts[name] = (counts[name] ?? 0) + 1
    }
    const total = filteredLines.length || 1
    return Object.entries(counts)
      .map(([author, lines]) => ({ author, lines, percentage: (lines / total) * 100 }))
      .sort((a, b) => b.lines - a.lines)
  }, [filteredLines])

  const visibleAuthors = authorStats.filter(({ author }) => selectedAuthors.includes(author))

  // Metadata columns (narrower) now include Author:
  // [No.] [SHA] [Author] [Date] [Message] | [Line] | [Code]
  const metaCols = showMetadata
    ? "120px 84px 44px 60px 160px 30px 1fr"
    : "48px 1fr"

  return (
    <div className="space-y-3">
      {/* Controls */}
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

      {(visibleAuthors.length > 0 && colorize) && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Author Contributions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {authorStats
              .filter(({ author }) => selectedAuthors.includes(author))
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
                  <div className="px-2">Date</div>
                  <div className="px-2">No.</div>
                  <div className="px-2">SHA</div>
                  <div className="px-2">Message</div>
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
              const name = authorName(g.authorId)
              const info = getAuthorColor(name) ?? { color: "#000" }
              const isSelected = selectedAuthors.includes(name)
              const commitNum = commitsByHash.get(g.commitHash)?.number

              const groupStyle = colorize && isSelected
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
                  key={`${g.commitHash}-${g.lines[0]?.number ?? 0}-${gi}`}
                  className="border-l-2 group transition-opacity"
                  style={groupStyle}
                >
                  {g.lines.map((ln, idx) => (
                    <div
                      key={`${g.commitHash}-${ln.number}-${idx}`}
                      className="grid hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ gridTemplateColumns: metaCols }}
                    >
                      {showMetadata && (
                        <>
                          {/* Author */}
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && <span className="text-[10px]">{name}</span>}
                          </div>

                          {/* Date */}
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && <span className="text-[10px]">{formatCompact(g.timestamp)}</span>}
                          </div>

                          {/* Commit number (first line of the group) */}
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && <span className="text-[10px]">{commitNum ?? "—"}</span>}
                          </div>

                          {/* SHA */}
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && <code className="text-[10px]">{shortHash(g.commitHash)}</code>}
                          </div>

                          

                          

                          {/* Message */}
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && (
                              <div className="truncate text-[10px]" title={g.commitMessage}>
                                {g.commitMessage}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Line number */}
                      <span className="sticky left-0 z-10 bg-background px-2 py-0.5 text-muted-foreground text-right select-none border-r border-border/40">
                        {String(ln.number).padStart(3, " ")}
                      </span>

                      {/* Code */}
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
