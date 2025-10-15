import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FileText, FolderOpen, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardTitle } from "@/components/ui/card"

import { useAnalysis } from "@/hooks/useAnalysis"
import { getAuthorColor } from "@/components/helpers/AuthorColors"

// types from your shared file
import {
  AnalysisResult,
  SelectedFullProps,
  Commit,
  FileEntry,
  LineEntry,
  Author,
  AuthorId,
} from "@/components/types"

/* ---------------- Local view types ---------------- */

type FileLine = {
  no: number
  text: string
  lastChange: {
    commitHash: string
    commitMessage: string
    authorId: AuthorId
    authorName: string
    timestamp: string // ISO
  }
}

type RepoFile = {
  path: string
  lines: FileLine[]
}

/* ---------------- Props ---------------- */

type SelectedProps = Pick<
  SelectedFullProps,
  | "allAuthors"
  | "selectedAuthors"
  | "allFiles"
  | "selectedFiles"
  | "filterData"
  | "selectedRepo"
  | "startCommitHash"
  | "endCommitHash"
>

type FileStats = {
  fileName: string
  totalLines: number
  totalCommits: number
  authorContributions: Record<string, number> // keyed by authorName for display
}

/* ---------------- Helpers ---------------- */

function shortHash(hash: string) {
  return hash?.slice(0, 7) ?? ""
}
function formatCompact(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts ?? ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type LineGroup = {
  commitHash: string
  commitMessage: string
  authorId: AuthorId
  authorName: string
  timestamp: string
  lines: FileLine[]
}

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
        authorId: ln.lastChange.authorId,
        authorName: ln.lastChange.authorName,
        timestamp: ln.lastChange.timestamp,
        lines: [ln],
      })
    }
  }
  return groups
}

/* ---------------- Transform analysis → RepoFile[] within commit range ---------------- */

function buildRepoFilesInRange(
  analysis: AnalysisResult | undefined,
  startCommitHash?: string,
  endCommitHash?: string
): RepoFile[] {
  if (!analysis?.repository) return []

  const repo = analysis.repository
  const commits: Commit[] = repo.commits ?? []
  const authors: Author[] = repo.authors ?? []

  const authorById = new Map<AuthorId, Author>(authors.map((a) => [a.id, a]))
  const getAuthorName = (id?: AuthorId) => (id ? authorById.get(id)?.name : undefined) ?? "Unknown"

  // Quick lookup for commit metadata by hash
  const commitByHash = new Map<string, Commit>(commits.map((c) => [c.hash, c]))

  // Sort commits chronologically (oldest → newest)
  const sortedCommits = [...commits].sort(
    (a, b) => new Date(a?.date ?? 0).getTime() - new Date(b?.date ?? 0).getTime()
  )

  // Determine range
  let startIndex = 0
  let endIndex = sortedCommits.length - 1

  if (startCommitHash) {
    const foundStart = sortedCommits.findIndex((c) => c.hash === startCommitHash)
    if (foundStart !== -1) startIndex = foundStart
  }
  if (endCommitHash) {
    const foundEnd = sortedCommits.findIndex((c) => c.hash === endCommitHash)
    if (foundEnd !== -1) endIndex = foundEnd
  }

  const rangedCommits = sortedCommits.slice(startIndex, endIndex + 1)

  // Rebuild file state line-by-line by replaying commits
  const fileMap = new Map<string, Map<number, FileLine>>() // path -> (lineNo -> FileLine)

  for (const c of rangedCommits) {
    const files: FileEntry[] = c.files_changed ?? []
    for (const f of files) {
      const path = f?.path
      if (!path) continue

      if (!fileMap.has(path)) fileMap.set(path, new Map<number, FileLine>())
      const lineMap = fileMap.get(path)!

      // Prefer the line's own authorId/date/commit_hash when present; fallback to commit's
      const lines: LineEntry[] = f?.lines ?? []
      for (const ln of lines) {
        if (typeof ln?.number !== "number") continue
        const lineAuthorId: AuthorId | undefined = ln.authorId ?? c.authorId
        const authorName = getAuthorName(lineAuthorId)
        const commitMeta = commitByHash.get(ln.commit_hash ?? c.hash)

        lineMap.set(ln.number, {
          no: ln.number,
          text: ln?.content ?? "",
          lastChange: {
            commitHash: ln.commit_hash ?? c.hash,
            commitMessage: commitMeta?.message ?? c.message ?? "",
            authorId: lineAuthorId ?? ("" as AuthorId),
            authorName,
            timestamp: ln?.date ?? c.date ?? "",
          },
        })
      }
    }
  }

  // Convert to array
  const repoFiles: RepoFile[] = []
  for (const [path, lineMap] of fileMap.entries()) {
    const lines = Array.from(lineMap.values()).sort((a, b) => a.no - b.no)
    repoFiles.push({ path, lines })
  }

  return repoFiles.sort((a, b) => a.path.localeCompare(b.path))
}

/* ---------------- Enhanced Blame View ---------------- */

function EnhancedBlameView({
  file,
  onBack,
  selectedAuthors,
}: {
  file: RepoFile
  onBack: () => void
  selectedAuthors: string[]
}) {
  const [showMetadata, setShowMetadata] = React.useState(true)
  const groups = groupByCommit(file.lines)

  // Author contributions for legend
  const authorStats = React.useMemo(() => {
    const contributions: Record<string, number> = {}
    file.lines.forEach((line) => {
      const author = line.lastChange.authorName
      contributions[author] = (contributions[author] || 0) + 1
    })

    return Object.entries(contributions)
      .map(([author, lines]) => ({
        author,
        lines,
        percentage: (lines / file.lines.length) * 100,
      }))
      .sort((a, b) => b.lines - a.lines)
  }, [file])

  const visibleAuthors = authorStats.filter(({ author }) => selectedAuthors.includes(author))

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="h-8 px-3">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Files
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-semibold">{file.path}</span>
          </div>
        </div>
      </div>

      {/* Author Legend */}
      {visibleAuthors.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Author Contributions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {authorStats
              .filter(({ author }) => selectedAuthors.includes(author))
              .map(({ author, lines, percentage }) => {
                const info = getAuthorColor(author) ?? { color: "#888" }
                return (
                  <div
                    key={author}
                    className="flex items-center gap-2 px-3 py-2 rounded border"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: (info as any).color,
                      // @ts-ignore
                      backgroundColor: (info as any).bgColor ?? "transparent",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: (info as any).color ?? "#888" }}>
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

      {/* Blame grid */}
      <div className="border rounded flex flex-col">
        <div className="border-b bg-muted/30 sticky top-0 z-20">
          <div className="flex items-center justify-between px-2 py-1">
            <div
              className="grid flex-1 font-mono text-[10px] font-semibold text-muted-foreground"
              style={{
                gridTemplateColumns: showMetadata ? "100px 140px 200px 56px 1fr" : "56px 1fr",
              }}
            >
              {showMetadata && (
                <>
                  <div className="px-2">SHA</div>
                  <div className="px-2">Date</div>
                  <div className="px-2">Message</div>
                </>
              )}
              <div className="px-2 text-right">Line</div>
              <div className="px-2">Code</div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              className="h-6 px-2 text-xs ml-2"
            >
              {showMetadata ? (
                <>
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  Hide Metadata
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3 mr-1" />
                  Show Metadata
                </>
              )}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 h-[600px]">
          <div className="font-mono text-[11px] leading-5">
            {groups.map((g, gi) => {
              const info = getAuthorColor(g.authorName) ?? { color: "#000" }
              const isSelected = selectedAuthors.includes(g.authorName)

              return (
                <div
                  key={`${g.commitHash}-${g.lines[0]?.no ?? 0}-${gi}`}
                  className="border-l-2 group transition-opacity"
                  style={{
                    borderLeftColor: isSelected ? (info as any).color ?? "#000" : "transparent",
                    backgroundColor: isSelected ? (info as any).bgColor ?? "transparent" : "transparent",
                  }}
                >
                  {g.lines.map((ln, idx) => (
                    <div
                      key={`${g.commitHash}-${ln.no}-${idx}`}
                      className="grid hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        gridTemplateColumns: showMetadata ? "100px 140px 200px 56px 1fr" : "56px 1fr",
                      }}
                    >
                      {showMetadata && (
                        <>
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && <code className="text-[10px]">{shortHash(g.commitHash)}</code>}
                          </div>
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && <span className="text-[10px]">{formatCompact(g.timestamp)}</span>}
                          </div>
                          <div className="px-2 py-0.5 text-muted-foreground border-r border-border/40">
                            {idx === 0 && (
                              <div className="truncate text-[10px]" title={g.commitMessage}>
                                {g.commitMessage}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <span className="sticky left-0 z-10 bg-background px-2 py-0.5 text-muted-foreground text-right select-none border-r border-border/40">
                        {String(ln.no).padStart(3, " ")}
                      </span>

                      <code className="whitespace-pre-wrap break-words text-foreground px-2 py-0.5">
                        {ln.text}
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

/* ---------------- File Statistics Table ---------------- */

function FileStatsTable({
  fileStats,
  allAuthors,
  totalLinesAllFiles,
  aggregatedStats,
  showPercentages,
  onFileSelect,
}: {
  fileStats: FileStats[]
  allAuthors: string[] // author names for columns
  totalLinesAllFiles: number
  aggregatedStats: { authorTotals: Record<string, number>; totalCommitsAllFiles: number }
  showPercentages: boolean
  onFileSelect: (fileName: string) => void
}) {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="hover:bg-background">
            <TableHead className="font-semibold sticky left-0 bg-background border-r min-w-[200px]">
              File
            </TableHead>
            <TableHead className="text-right font-semibold">LOCs</TableHead>
            <TableHead className="text-right font-semibold">Commits</TableHead>
            {allAuthors.map((author) => {
              const authorInfo = getAuthorColor(author) ?? { color: "#888" }
              return (
                <TableHead key={author} className="text-right font-semibold">
                  <div className="flex flex-col items-end">
                    <span style={{ color: (authorInfo as any).color ?? "#888" }}>
                      {(authorInfo as any).name ?? author}
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">(LOCs)</span>
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* All Files aggregated row */}
          <TableRow className="bg-muted/30 hover:bg-muted/40 border-b-2">
            <TableCell className="font-semibold sticky left-0 bg-muted/30 border-r">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span>All Files ({fileStats.length})</span>
              </div>
            </TableCell>

            <TableCell className="text-right font-semibold">{totalLinesAllFiles}</TableCell>
            <TableCell className="text-right font-semibold">{aggregatedStats.totalCommitsAllFiles}</TableCell>

            {allAuthors.map((author) => {
              const lines = aggregatedStats.authorTotals[author] || 0
              const percentage = totalLinesAllFiles > 0 ? (lines / totalLinesAllFiles) * 100 : 0
              const displayValue = showPercentages ? `${percentage.toFixed(0)}%` : String(lines)

              return (
                <TableCell key={author} className="text-right">
                  {lines > 0 ? (
                    <span className="text-sm font-medium">{displayValue}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
              )
            })}
          </TableRow>

          {/* Individual file rows */}
          {fileStats.map((fileData) => (
            <TableRow
              key={fileData.fileName}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onFileSelect(fileData.fileName)}
            >
              <TableCell className="font-mono text-xs sticky left-0 bg-background border-r">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{fileData.fileName}</span>
                </div>
              </TableCell>

              <TableCell className="text-right font-medium">{fileData.totalLines}</TableCell>
              <TableCell className="text-right font-medium">{fileData.totalCommits}</TableCell>

              {allAuthors.map((author) => {
                const lines = fileData.authorContributions[author] || 0
                const percentage = fileData.totalLines > 0 ? (lines / fileData.totalLines) * 100 : 0
                const displayValue = showPercentages ? `${percentage.toFixed(0)}%` : String(lines)

                return (
                  <TableCell key={author} className="text-right">
                    {lines > 0 ? (
                      <span className="text-sm">{displayValue}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ---------------- Main ---------------- */

export function UnifiedFilesView({
  allAuthors: allAuthorsSet,
  selectedAuthors,
  allFiles: allFilesSet,
  selectedFiles,
  filterData,
  selectedRepo,
  startCommitHash,
  endCommitHash,
}: SelectedProps) {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null)
  const [showPercentages, setShowPercentages] = React.useState(true)

  // Load analysis for the selected repo
  const { analysis, isLoading, error } = useAnalysis(selectedRepo)

  // Build repo state within the commit range (typed)
  const repoFiles = React.useMemo(
    () => (analysis ? buildRepoFilesInRange(analysis as AnalysisResult, startCommitHash, endCommitHash) : []),
    [analysis, startCommitHash, endCommitHash]
  )

  // Use selected vs all files
  const fileIdsToShow = React.useMemo(
    () => (filterData ? selectedFiles : Array.from(allFilesSet)),
    [filterData, selectedFiles, allFilesSet]
  )

  const visibleRepoFiles = React.useMemo(
    () => repoFiles.filter((f) => fileIdsToShow.includes(f.path)),
    [repoFiles, fileIdsToShow]
  )

  // Clear selection if filtered out
  React.useEffect(() => {
    if (selectedFile && !fileIdsToShow.includes(selectedFile)) {
      setSelectedFile(null)
    }
  }, [selectedFile, fileIdsToShow])

  const file = React.useMemo(
    () => (selectedFile ? visibleRepoFiles.find((f) => f.path === selectedFile) : undefined),
    [selectedFile, visibleRepoFiles]
  )

  // Stats from visible files
  const fileStats = React.useMemo((): FileStats[] => {
    return visibleRepoFiles
      .map((file) => {
        const authorContributions: Record<string, number> = {}
        const uniqueCommits = new Set<string>()

        file.lines.forEach((line) => {
          const authorName = line.lastChange.authorName
          authorContributions[authorName] = (authorContributions[authorName] || 0) + 1
          uniqueCommits.add(line.lastChange.commitHash)
        })

        return {
          fileName: file.path,
          totalLines: file.lines.length,
          totalCommits: uniqueCommits.size,
          authorContributions,
        }
      })
      .sort((a, b) => b.totalCommits - a.totalCommits)
  }, [visibleRepoFiles])

  // Totals across visible files
  const aggregatedStats = React.useMemo(() => {
    const authorTotals: Record<string, number> = {}
    let totalCommitsAllFiles = 0

    fileStats.forEach((file) => {
      totalCommitsAllFiles += file.totalCommits
      Object.entries(file.authorContributions).forEach(([authorName, lines]) => {
        authorTotals[authorName] = (authorTotals[authorName] || 0) + lines
      })
    })

    return { authorTotals, totalCommitsAllFiles }
  }, [fileStats])

  const totalLinesAllFiles = React.useMemo(
    () => fileStats.reduce((sum, f) => sum + f.totalLines, 0),
    [fileStats]
  )

  // Authors to display (names)
  const baseAuthors = React.useMemo(
    () => (filterData ? selectedAuthors : Array.from(allAuthorsSet)),
    [filterData, selectedAuthors, allAuthorsSet]
  )

  const displayedAuthors = React.useMemo(() => {
    if (baseAuthors.length === 0) return []
    const totals = aggregatedStats.authorTotals
    return [...baseAuthors].sort((a, b) => (totals[b] || 0) - (totals[a] || 0))
  }, [baseAuthors, aggregatedStats.authorTotals])

  // Loading & error states
  if (error) {
    return (
      <div className="space-y-2 py-4">
        <div className="text-sm text-red-600">Failed to load analysis.</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    )
  }

  // If a file is selected, show blame view
  if (file) {
    return (
      <div className="space-y-2 py-4">
        <EnhancedBlameView file={file} onBack={() => setSelectedFile(null)} selectedAuthors={displayedAuthors} />
      </div>
    )
  }

  // Otherwise, show the table
  return (
    <Card>
      <CardContent className="pt-2 pb-3">
        <div className="space-y-2 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">File Statistics</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch id="percentage-mode" checked={showPercentages} onCheckedChange={setShowPercentages} />
                <Label htmlFor="percentage-mode" className="text-sm">
                  %
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Click on any file in the table below to view its detailed blame information
              </p>
              <FileStatsTable
                fileStats={fileStats}
                allAuthors={displayedAuthors}
                totalLinesAllFiles={totalLinesAllFiles}
                aggregatedStats={aggregatedStats}
                showPercentages={showPercentages}
                onFileSelect={(f) => setSelectedFile(f)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
