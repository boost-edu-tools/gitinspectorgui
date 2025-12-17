import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Folder } from "lucide-react"
import type { AnalysisProps } from "@/components/types"

type FilterFilesProps = Pick<AnalysisProps, "allFiles" | "selectedFiles" | "selectFiles">

type GroupedFile = {
  fullPath: string
  displayName: string
}

type GroupedByFolder = Record<string, GroupedFile[]>

// group by top-level folder: ".ci/app.yml" → folder ".ci", display "app.yml"
function groupFilesByTopFolder(files: Iterable<string>): GroupedByFolder {
  const groups: GroupedByFolder = {}

  for (const fullPath of files) {
    const segments = fullPath.split("/")
    let folder: string
    let displayName: string

    if (segments.length === 1) {
      // file in root
      folder = "(root)"
      displayName = segments[0]
    } else {
      folder = segments[0]
      displayName = segments.slice(1).join("/") // show rest of path within folder
    }

    if (!groups[folder]) groups[folder] = []
    groups[folder].push({ fullPath, displayName })
  }

  // sort folders and files
  Object.values(groups).forEach((list) =>
    list.sort((a, b) => a.displayName.localeCompare(b.displayName))
  )

  return groups
}

function shorten(text: string, type: "file" | "folder") {
  if (type === "folder") {
    const max = 24;
    return text.length > max ? text.slice(0, max) + "…" : text;} 
    else
  { const max = 30;
    return text.length > max ? text.slice(0, max) + "…" : text;
  }}

export function FilterFiles({ allFiles, selectedFiles, selectFiles }: FilterFilesProps) {
  const toggle = (id: string) => {
    const set = new Set(selectedFiles)
    set.has(id) ? set.delete(id) : set.add(id)
    selectFiles(Array.from(set))
  }

  const selectAll = () => selectFiles(Array.from(allFiles))
  const clearAll = () => selectFiles([])

  const grouped = groupFilesByTopFolder(allFiles)
  const folders = Object.keys(grouped).sort((a, b) => a.localeCompare(b))

  return (
    <div className="flex flex-col p-2 gap-1">
      <div className="p-0 gap-0">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Folder className="h-3 w-3" />
            <span className="text-xs">Files</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {selectedFiles.length} / {Array.from(allFiles).length}
          </span>
            <Button
              variant="secondary"
              onClick={selectAll}
              className="h-7 px-2 text-[8px] bg-gray-200 hover:bg-gray-300 text-gray-900"
            >
              Select all
            </Button>
            <Button
              variant="secondary"
              onClick={clearAll}
              className="h-7 px-2 text-[8px] bg-gray-200 hover:bg-gray-300 text-gray-900"
            >
              Clear all
            </Button>
          </span>
        </span>
      </div>

      <Card className="bg-transparent border-none shadow-none p-0">
        <CardContent className="p-0">
          <ScrollArea className="rounded-md border h-25">
            <Accordion type="multiple" defaultValue={folders}>
              {folders.map((folder) => {
                const files = grouped[folder]
                const isRoot = folder === "(root)"
                const folderLabel = isRoot ? "Root" : folder

                return (
                  <AccordionItem key={folder} value={folder}>
                    <AccordionTrigger className="px-2 py-1 font-normal flex items-center gap-2">
                      <Folder className="h-3 w-3 shrink-0" />
                      <span title={folderLabel} className="truncate text-[10px] flex-1">{shorten(folderLabel, "folder")}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-1">
                      <ul className="divide-y">
                        {files.map(({ fullPath, displayName }) => (
                          <li
                            key={fullPath}
                            className="flex items-center gap-2 py-1"
                          >
                            <Checkbox
                              className="h-3 w-3 shrink-0"
                              checked={selectedFiles.includes(fullPath)}
                              onCheckedChange={() => toggle(fullPath)}
                              aria-label={`Select ${fullPath}`}
                            />
                            <span className="truncate text-[10px] flex-1" title={displayName} >
                              {shorten(displayName, "file")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
