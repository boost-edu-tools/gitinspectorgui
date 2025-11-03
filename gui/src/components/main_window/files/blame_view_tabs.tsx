import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Plus, FolderOpen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BlameView } from "@/components/main_window/files/blame_view"
import type { AuthorId, Author, FileEntry } from "@/components/types"

type Props = {
  selectedRepo: string | null

  /** all files you want to allow adding (usually visible files after filters/range) */
  availableFiles: FileEntry[]
  /** which file to open first */
  initialPath: string 
  authorsById: Map<AuthorId, Author>
  selectedAuthors: string[]
  /** leave the blame area (back to tables) */
  onExit: () => void
}

export function BlameTabsView({
  selectedRepo,
  availableFiles,
  initialPath,
  authorsById,
  selectedAuthors,
  onExit,
}: Props) {
  // open files = set of paths; start with initial
  const [openPaths, setOpenPaths] = React.useState<string[]>(
    availableFiles.find(f => f.path === initialPath) ? [initialPath] : []
  )
  const [active, setActive] = React.useState<string>(initialPath)
  const [addOpen, setAddOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // keep active valid
  React.useEffect(() => {
    if (!openPaths.includes(active)) {
      setActive(openPaths[0] ?? "")
    }
  }, [openPaths, active])

  // update if initialPath changes (e.g. user clicked another file to open blame)
  React.useEffect(() => {
    if (initialPath && !openPaths.includes(initialPath)) {
      setOpenPaths(prev => [...prev, initialPath])
      setActive(initialPath)
    } else if (initialPath) {
      setActive(initialPath)
    }
  }, [initialPath]) // eslint-disable-line react-hooks/exhaustive-deps

  const pathToFile = (p: string) => availableFiles.find(f => f.path === p)

  const openFileEntries = openPaths.map(pathToFile).filter(Boolean) as FileEntry[]

  const togglePath = (p: string) =>
    setOpenPaths(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]))

  const closeTab = (p: string) => setOpenPaths(prev => prev.filter(x => x !== p))

  const closeAll = () => setOpenPaths([])

  const filteredChoices = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const arr = q
      ? availableFiles.filter(f => f.path.toLowerCase().includes(q))
      : availableFiles
    return arr.sort((a, b) => a.path.localeCompare(b.path))
  }, [availableFiles, search])

  // limit height and make interiors scrollable
  return (
    <div className="flex flex-col gap-3 max-h-[85vh]">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span>{openPaths.length} file{openPaths.length !== 1 ? "s" : ""} open</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add files
          </Button>
          <Button variant="ghost" size="sm" onClick={closeAll}>Close all</Button>
          <Button variant="outline" size="sm" onClick={onExit}>Back to table</Button>
        </div>
      </div>

      {/* tabs bar — horizontally scrollable */}
      <Tabs value={active} onValueChange={setActive} className="flex-1 flex flex-col min-h-0">
        <div className="relative">
          <div className="overflow-x-auto scrollbar-thin">
            <TabsList className="flex flex-wrap">
              {openFileEntries.map((f) => (
                <div key={f.path} className="relative">
                  <TabsTrigger value={f.path} className="pr-7">
                    <span className="font-mono text-xs">{f.path}</span>
                  </TabsTrigger>
                  <button
                    aria-label={`Close ${f.path}`}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(f.path)
                    }}
                  >
                    <X className="h-3.5 w-3.5 opacity-70" />
                  </button>
                </div>
              ))}
            </TabsList>
          </div>
        </div>

        {/* content area — fills remaining space and scrolls inside BlameView */}
        <div className="flex-1 min-h-0">
          {openFileEntries.map((f) => (
            <TabsContent key={f.path} value={f.path} className="h-full mt-3">
              <div className="h-full">
                <BlameView
                  selectedRepo={selectedRepo}
                  file={f}
                  authorsById={authorsById}
                  selectedAuthors={selectedAuthors}
                />
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Add files dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Select files to view</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="file-search" className="text-xs text-muted-foreground">Filter</Label>
              <Input
                id="file-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by path…"
                className="h-8"
              />
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpenPaths(filteredChoices.map(f => f.path))}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenPaths([])}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="border rounded overflow-x-auto ">
              {/* limit list height so dialog never exceeds viewport */}
              <ScrollArea className="max-h-[30vh]">
                <div className="divide-y">
                  {filteredChoices.map((f) => {
                    const checked = openPaths.includes(f.path)
                    return (
                      <label
                        key={f.path}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePath(f.path)}
                        />
                        <span className="font-mono text-xs truncate">{f.path}</span>
                      </label>
                    )
                  })}
                  {filteredChoices.length === 0 && (
                    <div className="px-3 py-6 text-sm text-muted-foreground">No files match your filter.</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
