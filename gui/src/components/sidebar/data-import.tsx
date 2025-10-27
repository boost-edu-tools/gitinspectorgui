import * as React from "react"
import { Plus, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import settings from "@/data/Settings.json"

type DetectMode =
  | "none"
  | "within-file"
  | "changed-files-same-commit"
  | "all-files-same-commit"
  | "all-files-all-commits"

const DETECT_MODE_LABEL: Record<DetectMode, string> = {
  none: "Do not detect",
  "within-file": "Detect within file",
  "changed-files-same-commit": "Detect across changed files in same commit",
  "all-files-same-commit": "Detect across all files in same commit",
  "all-files-all-commits": "Detect across all files in all commits",
}

function Pill({
  children,
  tone = "primary",
}: {
  children: React.ReactNode
  tone?: "primary" | "muted"
}) {
  return (
    <span
      className={
        "rounded px-1.5 py-0.5 text-[10px] font-medium " +
        (tone === "primary"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground")
      }
    >
      {children}
    </span>
  )
}

export function DataImport() {

  const defaultState = React.useMemo(
    () => ({
      path: settings.path ?? "",

  
      searchDepth: String(settings.search_depth ?? 2),
      nFiles: String(settings.n_files ?? 500),
      showRenames: false as boolean,
      detectMode: "within-file" as DetectMode,

      subfolder: settings.subfolder ?? "",
      includeTypes: Array.isArray(settings.allowed_file_types)
        ? settings.allowed_file_types.join(",")
        : String(settings.allowed_file_types ?? ""),
      excludedExtensions: Array.isArray(settings.ignored_file_extensions)
        ? settings.ignored_file_extensions.join(",")
        : String(settings.ignored_file_extensions ?? ""),
      excludeAuthorNames: "",
      excludeAuthorEmails: "",
      excludeFileNames: "",
      excludeCommitHashes: "",
      excludeCommitMessages: "",
    }),
    []
  )

  // required + defaults
  const [path, setPath] = React.useState(defaultState.path)
  const [searchDepth, setSearchDepth] = React.useState(defaultState.searchDepth)
  const [nFiles, setNFiles] = React.useState(defaultState.nFiles)
  const [showRenames, setShowRenames] = React.useState<boolean>(defaultState.showRenames)
  const [detectMode, setDetectMode] = React.useState<DetectMode>(defaultState.detectMode)

  // optional filters
  const [subfolder, setSubfolder] = React.useState(defaultState.subfolder)
  const [includeTypes, setIncludeTypes] = React.useState(defaultState.includeTypes)

  // optional exclusions (including file extensions to exclude)
  const [excludedExtensions, setExcludedExtensions] = React.useState(defaultState.excludedExtensions)
  const [excludeAuthorNames, setExcludeAuthorNames] = React.useState(defaultState.excludeAuthorNames)
  const [excludeAuthorEmails, setExcludeAuthorEmails] = React.useState(defaultState.excludeAuthorEmails)
  const [excludeFileNames, setExcludeFileNames] = React.useState(defaultState.excludeFileNames)
  const [excludeCommitHashes, setExcludeCommitHashes] = React.useState(defaultState.excludeCommitHashes)
  const [excludeCommitMessages, setExcludeCommitMessages] = React.useState(defaultState.excludeCommitMessages)

  const onReset = () => {
    setPath(defaultState.path)
    setSearchDepth(defaultState.searchDepth)
    setNFiles(defaultState.nFiles)
    setShowRenames(defaultState.showRenames)
    setDetectMode(defaultState.detectMode)

    setSubfolder(defaultState.subfolder)
    setIncludeTypes(defaultState.includeTypes)

    setExcludedExtensions(defaultState.excludedExtensions)
    setExcludeAuthorNames(defaultState.excludeAuthorNames)
    setExcludeAuthorEmails(defaultState.excludeAuthorEmails)
    setExcludeFileNames(defaultState.excludeFileNames)
    setExcludeCommitHashes(defaultState.excludeCommitHashes)
    setExcludeCommitMessages(defaultState.excludeCommitMessages)
  }

  const splitPatterns = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)

  const onSave = () => {
    // build payload, clearly separating required vs optional blocks
    const payload = {
      // Required
      path, // must be explicitly provided
      search_depth: Number(searchDepth),
      n_files: Number(nFiles),
      show_renames: showRenames,
      detect_copy_move: detectMode,

      // Optional filters
      filters: {
        subfolder: subfolder || undefined,
        include_file_types: splitPatterns(includeTypes),
      },

      // Optional exclusions (includes “file extensions to exclude”)
      exclude: {
        file_extensions: splitPatterns(excludedExtensions),
        author_names: splitPatterns(excludeAuthorNames),
        author_emails: splitPatterns(excludeAuthorEmails),
        file_names: splitPatterns(excludeFileNames),
        commit_hashes: splitPatterns(excludeCommitHashes),
        commit_messages: splitPatterns(excludeCommitMessages),
      },
    }

    console.log("Analysis settings saved:", payload)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Data import</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="w-full justify-start"
                aria-label="Start a new analysis"
              >
                <Plus className="mr-2 h-3 w-3" />
                New analysis
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="w-[92vw] sm:max-w-3xl max-w-[960px] p-0">
              <div className="flex flex-col max-h-[85vh]">
                {/* Header (sticky) */}
                <div className="px-6 pt-5 pb-3 border-b bg-background">
                  <AlertDialogTitle>Analysis Settings</AlertDialogTitle>

                </div>

                {/* Body (scrollable) */}
                <div className="px-6 py-4 overflow-y-auto space-y-8">
                  {/* Required section */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">General settings</h3>
                      <Pill>Required</Pill>
                    </div>
                    <Separator />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="path">Root path (folder with Git repo/s)</Label>

                      </div>
                      <Input
                        id="path"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        placeholder="e.g. C:\work\repos or /home/user/repos"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="searchDepth">Search depth</Label>
                          <Pill tone="muted">Default: {defaultState.searchDepth}</Pill>
                        </div>
                        <Input
                          id="searchDepth"
                          inputMode="numeric"
                          value={searchDepth}
                          onChange={(e) => setSearchDepth(e.target.value)}
                          placeholder={defaultState.searchDepth}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="nFiles">Max files per repo</Label>
                          <Pill tone="muted">Default: {defaultState.nFiles}</Pill>
                        </div>
                        <Input
                          id="nFiles"
                          inputMode="numeric"
                          value={nFiles}
                          onChange={(e) => setNFiles(e.target.value)}
                          placeholder={defaultState.nFiles}
                        />
                      </div>



                      <div className="rounded-md border p-3 md:col-span-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="detect-mode">Copy/move</Label>
                        

                        <Select value={detectMode} onValueChange={(v) => setDetectMode(v as DetectMode)}>
                          <SelectTrigger id="detect-mode">
                            <SelectValue placeholder="Select strategy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{DETECT_MODE_LABEL["none"]}</SelectItem>
                            <SelectItem value="within-file">{DETECT_MODE_LABEL["within-file"]}</SelectItem>
                            <SelectItem value="changed-files-same-commit">
                              {DETECT_MODE_LABEL["changed-files-same-commit"]}
                            </SelectItem>
                            <SelectItem value="all-files-same-commit">
                              {DETECT_MODE_LABEL["all-files-same-commit"]}
                            </SelectItem>
                            <SelectItem value="all-files-all-commits">
                              {DETECT_MODE_LABEL["all-files-all-commits"]}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Optional filters */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">Include only specific contributions</h3>
                      <Pill tone="muted">Optional</Pill>
                    </div>
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="subfolder">Subfolder to analyze</Label>
                          <Pill tone="muted">Optional</Pill>
                        </div>
                        <Input
                          id="subfolder"
                          // value={subfolder}
                          onChange={(e) => setSubfolder(e.target.value)}
                          placeholder="e.g. src (leave empty for repo root)"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="includeTypes">Include file types</Label>
                          <Pill tone="muted">Optional</Pill>
                        </div>
                        <Input
                          id="includeTypes"
                          // value={includeTypes}
                          onChange={(e) => setIncludeTypes(e.target.value)}
                          placeholder="e.g. .ts,.tsx,.rs  (empty = include all)"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Optional — Exclude contributions (incl. extensions to exclude) */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">Exclude contributions</h3>
                      <Pill tone="muted">Optional</Pill>
                    </div>
                    <Separator />


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                      <div className="space-y-1.5">
                        <Label htmlFor="ex-author-names">By author name</Label>
                        <Input
                          id="ex-author-names"
                          value={excludeAuthorNames}
                          onChange={(e) => setExcludeAuthorNames(e.target.value)}
                          placeholder="e.g. John, Jane"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ex-author-emails">By author email</Label>
                        <Input
                          id="ex-author-emails"
                          value={excludeAuthorEmails}
                          onChange={(e) => setExcludeAuthorEmails(e.target.value)}
                          placeholder="e.g. *@gmail.com, *@company.org"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ex-files">By file name / path</Label>
                        <Input
                          id="ex-files"
                          value={excludeFileNames}
                          onChange={(e) => setExcludeFileNames(e.target.value)}
                          placeholder="e.g. test*, **/*.spec.ts"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ex-hashes">By commit hash</Label>
                        <Input
                          id="ex-hashes"
                          value={excludeCommitHashes}
                          onChange={(e) => setExcludeCommitHashes(e.target.value)}
                          placeholder="e.g. abc*, 1234????"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <Label htmlFor="ex-messages">By commit message</Label>
                        <Input
                          id="ex-messages"
                          value={excludeCommitMessages}
                          onChange={(e) => setExcludeCommitMessages(e.target.value)}
                          placeholder="e.g. bug*, chore:*"
                        />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Footer (sticky) */}
                <div className="px-6 py-4 border-t bg-background flex items-center justify-end gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button variant="secondary" onClick={onReset}>
                    Reset
                  </Button>
                  <AlertDialogAction onClick={onSave}>Save</AlertDialogAction>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarMenuItem>

        {/* Current path indicator below button */}
        <SidebarMenuItem>
          <div className="min-w-0 px-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
            <Folder className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{path || settings.path || "(no path set)"}</span>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
