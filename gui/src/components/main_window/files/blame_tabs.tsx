import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Plus, FolderOpen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BlameView } from "@/components/main_window/files/blame_tab"
import { useAnalysis } from "@/hooks/useAnalysis"
import type { AnalysisResult, AnalysisProps, File } from "@/components/types"


export function BlameViewMultiTab({
  selectedRepo,
  selectedFile,
  setSelectedFile,
  onExit,
}: Pick<
  AnalysisProps,
  "selectedRepo"
  | "setSelectedFile"
  | "selectedFile"> &
{ onExit: () => void;
})  {

  const [openPaths, setOpenPaths] = React.useState<string[]>([String(selectedFile)])
  const [addOpen, setAddOpen] = React.useState(false)
  const prevRepoRef = React.useRef<string | null>(null);

  React.useEffect(() => {
  if (prevRepoRef.current && prevRepoRef.current !== selectedRepo) {
    setSelectedFile(null);
  }
  prevRepoRef.current = selectedRepo;
}, [selectedRepo]);

  const { analysis } = useAnalysis(selectedRepo)
  const repo = (analysis as AnalysisResult | undefined)?.repository
  const files: File[] = repo?.files ?? []

  const allFiles = files.map(f => f.path)

  const pathToFile = (p: string) => files.find(f => f.path === p)

  const openFileEntries = openPaths.map(pathToFile).filter(Boolean) as File[]

  const togglePath = (p: string) =>
    setOpenPaths(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]))

  const closeTab = (p: string) => setOpenPaths(prev => prev.filter(x => x !== p))

  const closeAll = () => setOpenPaths([])

  return (
    <div className="flex flex-col gap-3 max-h-[85vh]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span>{openPaths.length} file{openPaths.length !== 1 ? "s" : ""} open</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="bg-gray-200 hover:bg-gray-300 text-gray-900" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add files
          </Button>
          <Button variant="ghost" size="sm" onClick={closeAll}>Close all</Button>
          <Button variant="outline" size="sm" onClick={onExit}>Back to table</Button>
        </div>
      </div>

      <Tabs value={selectedFile} onValueChange={setSelectedFile} className="flex-1 flex flex-col min-h-0">
        <div className="relative">
          <div className="overflow-x-auto scrollbar-thin">
            <TabsList className="flex flex-wrap bg-transparent">
              {openFileEntries.map((f) => (
                <div key={f.path} className="relative">

                  <TabsTrigger value={f.path} className="pr-7 font-mono text-xs rounded-md transition-colors 
                   hover:bg-muted hover:text-foreground 
                   data-[state=active]:bg-gray-200  data-[state=active]:text-gray-900">
                    <span className="font-mono text-xs ">{f.path}</span>
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

        <div className="flex-1 min-h-0">
          {openFileEntries.map((f) => (
            <TabsContent key={f.path} value={f.path} className="h-full mt-3">
              <div className="h-full">
                <BlameView
                  selectedRepo={selectedRepo}
                  selectedFile={selectedFile}
                />
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Select files to view</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900"
                  onClick={() => setOpenPaths(Array.from(allFiles))}
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

              <ScrollArea className="max-h-[30vh]">
                <div className="divide-y">
                  {files.map((f) => {
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
                  {files.length === 0 && (
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
