import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  FileText
} from "lucide-react"
import type { AnalysisProps } from "@/components/types"

type FilterFilesProps = Pick<AnalysisProps, "allFiles" | "selectedFiles" | "selectFiles">

type FileTreeFile = {
  name: string
  fullPath: string
}

type FileTreeFolder = {
  name: string
  path: string
  displayName: string
  folders: FileTreeFolder[]
  files: FileTreeFile[]
  descendantFiles: string[]
}

type MutableFolder = {
  name: string
  path: string
  folders: Map<string, MutableFolder>
  files: FileTreeFile[]
}

function createMutableFolder(name: string, path: string): MutableFolder {
  return { name, path, folders: new Map(), files: [] }
}

function buildFileTree(files: Iterable<string>): FileTreeFolder {
  const root = createMutableFolder("(root)", "")

  for (const fullPath of files) {
    const segments = fullPath.split("/")
    const fileName = segments.pop()
    if (!fileName) continue

    let current = root
    const pathSegments: string[] = []

    for (const segment of segments) {
      pathSegments.push(segment)
      const childPath = pathSegments.join("/")
      if (!current.folders.has(segment)) {
        current.folders.set(segment, createMutableFolder(segment, childPath))
      }
      current = current.folders.get(segment)!
    }

    current.files.push({ name: fileName, fullPath })
  }

  const finalize = (folder: MutableFolder): FileTreeFolder => {
    const sortedFolders = Array.from(folder.folders.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(finalize)

    const sortedFiles = folder.files.sort((a, b) => a.name.localeCompare(b.name))

    const descendantFiles = [
      ...sortedFiles.map((file) => file.fullPath),
      ...sortedFolders.flatMap((child) => child.descendantFiles),
    ]

    return {
      name: folder.name,
      path: folder.path,
      displayName: folder.path === "" ? "Root" : folder.name,
      folders: sortedFolders,
      files: sortedFiles,
      descendantFiles,
    }
  }

  return finalize(root)
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".")
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

function getExtensionColor(ext: string): string {
  const colors: Record<string, string> = {
    ts: "text-blue-500",
    tsx: "text-blue-400",
    js: "text-yellow-500",
    jsx: "text-yellow-400",
    py: "text-green-500",
    rs: "text-orange-500",
    json: "text-gray-500",
    md: "text-purple-500",
    css: "text-pink-500",
    html: "text-red-500",
    yaml: "text-teal-500",
    yml: "text-teal-500",
    toml: "text-amber-600",
  }
  return colors[ext] || "text-muted-foreground"
}

export function FilterFiles({ allFiles, selectedFiles, selectFiles }: FilterFilesProps) {
  const tree = useMemo(() => buildFileTree(allFiles), [allFiles])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleExpanded = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const toggleFile = (fullPath: string) => {
    const set = new Set(selectedFiles)
    set.has(fullPath) ? set.delete(fullPath) : set.add(fullPath)
    selectFiles(Array.from(set))
  }

  const toggleGroup = (paths: string[]) => {
    if (paths.length === 0) return

    const set = new Set(selectedFiles)
    const allSelected = paths.every((path) => set.has(path))

    paths.forEach((path) => {
      if (allSelected) {
        set.delete(path)
      } else {
        set.add(path)
      }
    })

    selectFiles(Array.from(set))
  }

  const selectAll = () => selectFiles(Array.from(allFiles))
  const clearAll = () => selectFiles([])

  const renderFile = (file: FileTreeFile, depth: number) => {
    const isSelected = selectedFiles.includes(file.fullPath)
    const ext = getFileExtension(file.name)
    const colorClass = getExtensionColor(ext)

    return (
      <li
        key={file.fullPath}
        className="flex items-center gap-2 p-1 cursor-pointer hover:bg-muted/30 whitespace-nowrap"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => toggleFile(file.fullPath)}
        title={file.fullPath}
      >
        <Checkbox
          className="h-3 w-3 shrink-0"
          checked={isSelected}
          onCheckedChange={() => toggleFile(file.fullPath)}
          onClick={(e) => e.stopPropagation()}
        />
        <FileText className={cn("h-3 w-3 shrink-0", colorClass)} />
        <span className="text-[10px]">
          {file.name}
        </span>
      </li>
    )
  }

  const renderFolder = (folder: FileTreeFolder, depth: number): JSX.Element => {
    const folderKey = folder.path || folder.name
    const isExpanded = expandedFolders.has(folderKey)
    const selectedInFolder = folder.descendantFiles.filter((path) =>
      selectedFiles.includes(path)
    ).length
    const totalInFolder = folder.descendantFiles.length
    const folderChecked = totalInFolder === 0
      ? false
      : selectedInFolder === 0
        ? false
        : selectedInFolder === totalInFolder
          ? true
          : "indeterminate"

    const hasChildren = folder.folders.length > 0 || folder.files.length > 0

    return (
      <li key={folderKey}>
        <div
          className="flex items-center gap-2 p-1 cursor-pointer hover:bg-muted/30 whitespace-nowrap"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => hasChildren && toggleExpanded(folderKey)}
          title={folder.path || folder.displayName}
        >
          <Checkbox
            className="h-3 w-3 shrink-0"
            checked={folderChecked}
            onCheckedChange={() => toggleGroup(folder.descendantFiles)}
            onClick={(e) => e.stopPropagation()}
            disabled={totalInFolder === 0}
          />
          
          {hasChildren ? (
            <button
              className="p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(folderKey)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-3" />
          )}

          {isExpanded ? (
            <FolderOpen className="h-3 w-3 shrink-0 text-amber-500" />
          ) : (
            <Folder className="h-3 w-3 shrink-0 text-amber-500/80" />
          )}

          <span className="text-[10px] font-medium">
            {folder.displayName}
          </span>

          <span className="text-[9px] text-muted-foreground shrink-0">
            {selectedInFolder}/{totalInFolder}
          </span>
        </div>

        {isExpanded && (
          <ul className="border-l border-border/30 ml-2">
            {folder.folders.map((subFolder) => renderFolder(subFolder, depth + 1))}
            {folder.files.map((file) => renderFile(file, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

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
          <div className="rounded-md border h-35 overflow-auto">
            {tree.folders.length === 0 && tree.files.length === 0 ? (
              <div >

              </div>
            ) : (
              <ul className="divide-y min-w-max">
                {tree.folders.map((folder) => renderFolder(folder, 0))}
                {tree.files.map((file) => renderFile(file, 0))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
