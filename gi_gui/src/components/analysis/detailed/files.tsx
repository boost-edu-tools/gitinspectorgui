import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { FolderOpen } from "lucide-react"
import repoFiles, { RepoFile, FileLine } from "@/data/FileDataExample"

function shortHash(hash: string) { return hash.slice(0, 7) }
function formatCompact(ts: string) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type LineGroup = {
  commitHash: string
  commitMessage: string
  authorName: string
  timestamp: string
  lines: FileLine[]
}

/** Group *consecutive* lines by lastChange.commitHash (blame-style) */
function groupByCommit(lines: FileLine[]): LineGroup[] {
  const groups: LineGroup[] = []
  for (const ln of lines) {
    const k = ln.lastChange.commitHash
    const last = groups[groups.length - 1]
    if (last && last.commitHash === k) {
      last.lines.push(ln)
    } else {
      groups.push({
        commitHash: k,
        commitMessage: ln.lastChange.commitMessage,
        authorName: ln.lastChange.authorName,
        timestamp: ln.lastChange.timestamp,
        lines: [ln],
      })
    }
  }
  return groups
}

export function FilesViewer() {
  const [path, setPath] = React.useState<string>(repoFiles[0]?.path ?? "")
  const file: RepoFile | undefined = React.useMemo(() => repoFiles.find(f => f.path === path), [path])

  const groups = React.useMemo(() => (file ? groupByCommit(file.lines) : []), [file])

  return (
    <div className="text-xs space-y-3">
      {/* Header with folder icon + select */}
      <div className="flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-muted-foreground" />
        <div className="w-[280px]">
          <Select value={path} onValueChange={setPath}>
            <SelectTrigger className="h-8 px-2">
              <SelectValue placeholder="Select file" />
            </SelectTrigger>
            <SelectContent>
              {repoFiles.map(f => (
                <SelectItem key={f.path} value={f.path}>{f.path}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded">
        <ScrollArea className="max-h-[420px]">
          <pre className="font-mono text-[11px] leading-5">
            {groups.map((g) => (
              <HoverCard key={`${g.commitHash}-${g.lines[0].no}`} openDelay={80} closeDelay={80}>
                <HoverCardTrigger asChild>
                  <div
                    className="border-l group hover:bg-muted/95"
                    style={{ borderLeftWidth: 2 }}
                  >
                    {g.lines.map((ln) => (
                      <div
                        key={ln.no}
                        className="grid grid-cols-[56px_1fr] gap-2 px-2"
                      >
                        <span className="sticky left-0 z-10 bg-background pr-2 text-muted-foreground text-right select-none">
                          {String(ln.no).padStart(3, " ")}
                        </span>
                        <code className="whitespace-pre-wrap break-words">{ln.text}</code>
                      </div>
                    ))}
                  </div>
                </HoverCardTrigger>

                <HoverCardContent
                  side="bottom"
                  align="start"
                  sideOffset={20}
                  className="w-64 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Author</span>
                      <Badge variant="secondary" className="text-[10px]">{g.authorName}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Commit</span>
                      <code className="text-[11px]">{shortHash(g.commitHash)}</code>
                      <span className="text-[11px] text-muted-foreground truncate">{g.commitMessage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Date</span>
                        <code className="text-[11px]">{formatCompact(g.timestamp)} </code>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Lines:</span>
                       <code className="text-[11px]"> {g.lines[0].no}
                      {g.lines.length > 1 ? `–${g.lines[g.lines.length - 1].no}` : ""} ({g.lines.length})</code>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </pre>
        </ScrollArea>
      </div>
    </div>
  )
}
