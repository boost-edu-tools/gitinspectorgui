import * as React from "react"
import { Plus, Minus, Circle, FolderPlus} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { Checkbox } from "@/components/ui/checkbox"

import { retrieveRepositories, loadSettingsJson, saveSettingsJson } from "@/lib/api"

import type { AnalysisProps, Filter } from "@/components/types"

import { open } from "@tauri-apps/plugin-dialog"

function ModeButton({
  include,
  isActive,
  onToggle,
  ariaLabel,
}: {
  include: Boolean
  isActive: Boolean
  onToggle: () => void
  ariaLabel: string
}) {
  const Icon = !isActive ? Circle : include ? Plus : Minus

  const baseClasses =
    "h-9 w-9 shrink-0 rounded-l-md border-r inline-flex items-center justify-center"

  const colorClasses = !isActive
    ? "bg-muted text-muted-foreground border-border"
    : include
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
    : "bg-red-500/10 text-red-600 border-red-500/30"

  const title = !isActive
    ? "Filter inactive"
    : include
    ? "Include"
    : "Exclude"

  return(
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onToggle}
      className={`${baseClasses} ${colorClasses}`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>)
}

function ToggleRuleRow({
  id,
  label,
  placeholder,
  value,
  include,
  onChange,
  onToggle,
}: {
  id: string
  label: string
  placeholder?: string
  value: string
  include: Boolean
  onChange: (v: string) => void
  onToggle: () => void
}) {
  const isActive = value.trim().length > 0

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex rounded-md border">
        <ModeButton
          include={include}
          isActive={isActive}
          onToggle={onToggle}
          ariaLabel={`${label} mode`}
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-0 rounded-l-none"
        />
      </div>
    </div>
  )
}

export function DataImportWindow({
  setAllRepos,
  setSelectedRepo,
  path,
  setPath,
  onSettingsSaved,
  buttonSidebar
}: Pick<AnalysisProps, "setAllRepos" | "setSelectedRepo" | "path" | "setPath" | "onSettingsSaved" | "buttonSidebar">) {

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const defaultState = React.useMemo(
    () => ({
      path: "",
      searchDepth: String(5),
      maxComputeResources: String( 90),
      max_blame_files: 1000,

      fileTypesMode: false,
      fileTypes: "",

      pathsMode: false,
      paths:  "",

      authorNameMode: false,
      authorNames: "",

      authorEmailMode: false,
      authorEmails:  "",

      commitHashMode: false,
      commitHashes: "",

      commitMessageMode: false,
      commitMessages: "",
    }),
    []
  )


  
  const [searchDepth, setSearchDepth] = React.useState(defaultState.searchDepth)
  const [maxComputeResources, setMaxComputeResources] = React.useState(defaultState.maxComputeResources)

  const [fileTypesMode, setFileTypesMode] = React.useState<Boolean>(defaultState.fileTypesMode)
  const [fileTypes, setFileTypes] = React.useState(defaultState.fileTypes)

  const [pathsMode, setPathsMode] = React.useState<Boolean>(defaultState.pathsMode)
  const [paths, setPaths] = React.useState(defaultState.paths)

  const [authorNameMode, setAuthorNameMode] = React.useState<Boolean>(defaultState.authorNameMode)
  const [authorNames, setAuthorNames] = React.useState(defaultState.authorNames)

  const [authorEmailMode, setAuthorEmailMode] = React.useState<Boolean>(defaultState.authorEmailMode)
  const [authorEmails, setAuthorEmails] = React.useState(defaultState.authorEmails)

  const [commitHashMode, setCommitHashMode] = React.useState<Boolean>(defaultState.commitHashMode)
  const [commitHashes, setCommitHashes] = React.useState(defaultState.commitHashes)

  const [commitMessageMode, setCommitMessageMode] = React.useState<Boolean>(defaultState.commitMessageMode)
  const [commitMessages, setCommitMessages] = React.useState(defaultState.commitMessages)

  const [foundRepos, setFoundRepos] = React.useState<string[]>([])
  const [selectedRepos, setSelectedRepos] = React.useState<Set<string>>(new Set())
  const [isCheckingPath, setIsCheckingPath] = React.useState(false)
  const [pathError, setPathError] = React.useState<string | null>(null)

  const [repoSearch, setRepoSearch] = React.useState("")

  const applyLoadedSettings = (loaded: any) => {
    console.log("[DataImport] Applying loaded settings:", loaded)

    setSearchDepth(String(loaded.search_depth ?? defaultState.searchDepth))
    setMaxComputeResources(String(loaded.max_compute_resources ?? defaultState.maxComputeResources))

    setFileTypesMode(loaded.file_types_filter?.include ?? defaultState.fileTypesMode)
    setFileTypes(String(loaded.file_types_filter?.value ?? defaultState.fileTypes))

    setPathsMode(loaded.path_filter?.include ?? defaultState.pathsMode)
    setPaths(String(loaded.path_filter?.value ?? defaultState.paths))

    setAuthorNameMode(loaded.author_names_filter?.include ?? defaultState.authorNameMode)
    setAuthorNames(String(loaded.author_names_filter?.value ?? defaultState.authorNames))

    setAuthorEmailMode(loaded.author_emails_filter?.include ?? defaultState.authorEmailMode)
    setAuthorEmails(String(loaded.author_emails_filter?.value ?? defaultState.authorEmails))

    setCommitHashMode(loaded.commit_hash_filter?.include ?? defaultState.commitHashMode)
    setCommitHashes(String(loaded.commit_hash_filter?.value ?? defaultState.commitHashes))

    setCommitMessageMode(loaded.commit_message_filter?.include ?? defaultState.commitMessageMode)
    setCommitMessages(String(loaded.commit_message_filter?.value ?? defaultState.commitMessages))
  }

  const handleDialogOpen = React.useCallback(async () => {
    if (!path) {
      console.timeLog("[DataImport] No path set yet, using defaults")
      return
    }

    const settingsPath = `${path}/Settings.json`
    console.log("[DataImport] Trying to load settings from:", settingsPath)

    try {
      const loadedSettings = await loadSettingsJson(settingsPath)
      console.log("[DataImport] Loaded settings:", loadedSettings)
      applyLoadedSettings(loadedSettings)
    } catch (err) {
      console.log(
        "[DataImport] Could not load settings, keeping defaults. Error:",
        err
      )
    }
  }, [path, applyLoadedSettings])

  const handleToggleRepo = (repo: string) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev)
      if (next.has(repo)) {
        next.delete(repo)
      } else {
        next.add(repo)
      }
      return next
    })
  }

  const handleToggleAllRepos = () => {
    if (!foundRepos.length) return

    setSelectedRepos((prev) => {
      if (prev.size === foundRepos.length) {
        return new Set()
      }
      return new Set(foundRepos)
    })
  }
  
  const handleBrowseFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select root folder for Git repositories",
      })

      if (!selected) return 
      if (typeof selected === "string") {
        setPath(selected)
        await fetchReposForPath(selected)
      }
    } catch (err) {
      console.error("Failed to open folder dialog:", err)
      setPathError("Failed to open folder dialog.")
    }
  }


  const fetchReposForPath = async (rootPath: string) => {
  if (!rootPath || rootPath.trim() === "") {
    setPathError("Please provide a root path to search for repositories.")
    setFoundRepos([])
    setSelectedRepos(new Set())
    return
  }

  setIsCheckingPath(true)
  setPathError(null)

  try {
    const depthNum = Number(searchDepth) || 1
    console.log("DataImport: retrieving repositories for", rootPath, "depth", depthNum)
    const repos = await retrieveRepositories(rootPath, depthNum)
    console.log("retrieve_repositories result:", repos)

    if (!repos || repos.length === 0) {
      setFoundRepos([])
      setSelectedRepos(new Set())
      setPathError("No Git repositories found in this path.")
    } else {
      setFoundRepos(repos)
      setSelectedRepos(new Set(repos))
    }
  } catch (err) {
    console.error("Failed to retrieve repositories:", err)
    setFoundRepos([])
    setSelectedRepos(new Set())
    setPathError(`Failed to retrieve repositories: ${String(err)}`)
  } finally {
    setIsCheckingPath(false)
  }
}


  const onReset = () => {
    setPath(defaultState.path)
    setSearchDepth(defaultState.searchDepth)
    setMaxComputeResources(defaultState.maxComputeResources)
    setFileTypesMode(defaultState.fileTypesMode)
    setFileTypes(defaultState.fileTypes)
    setPathsMode(defaultState.pathsMode)
    setPaths(defaultState.paths)
    setAuthorNameMode(defaultState.authorNameMode)
    setAuthorNames(defaultState.authorNames)
    setAuthorEmailMode(defaultState.authorEmailMode)
    setAuthorEmails(defaultState.authorEmails)
    setCommitHashMode(defaultState.commitHashMode)
    setCommitHashes(defaultState.commitHashes)
    setCommitMessageMode(defaultState.commitMessageMode)
    setCommitMessages(defaultState.commitMessages)

    setFoundRepos([])
    setSelectedRepos(new Set())
    setPathError(null)
    setRepoSearch("")
  }

  React.useEffect(() => {
  if (!path) return

  const load = async () => {
    try {
      const loadedSettings = await loadSettingsJson(`${path}/Settings.json`)
      applyLoadedSettings(loadedSettings)
      console.log("[DataImport] Loaded settings for path change:", loadedSettings)
    } catch (err) {
      console.log(
        "[DataImport] Could not load settings for path change, keeping defaults. Error:",
        err
      )
    }
  }

  void load()
}, [path])

  const onSave = async () => {
    if (!path || path.trim() === "") {
      alert("Please provide a root path to search for repositories.")
      return
    }

    const finalReposArray =
      selectedRepos.size > 0
        ? Array.from(selectedRepos)
        : foundRepos

    if (!finalReposArray || finalReposArray.length === 0) {
      alert("No repositories selected. Please click 'Set' and select at least one repository.")
      return
    }

    setAllRepos(prev => {
      const updated = new Set(prev);
      finalReposArray.forEach(r => updated.add(r));
      return updated;
    });
    setSelectedRepo(prev => prev || finalReposArray[0]);

    const settingsToSave = {
      repositories: finalReposArray,
      search_depth: Number(searchDepth) ?? defaultState.searchDepth,
      max_compute_resources: Number(maxComputeResources) ?? defaultState.maxComputeResources, 
      max_blame_files: defaultState.max_blame_files,
      file_types_filter: {
        value: fileTypes,
        include: fileTypesMode, 
     } as Filter,
      path_filter: {
        value: paths, 
        include: pathsMode,
      } as Filter,
      author_names_filter: {
        value: authorNames,
        include: authorNameMode,
      } as Filter,
      author_emails_filter: {
        value: authorEmails,
        include: authorEmailMode,
      } as Filter,
      commit_hash_filter: {
        value: commitHashes,
        include: commitHashMode,
      } as Filter,
      commit_message_filter: {    
        value: commitMessages,
        include: commitMessageMode,
      } as Filter,
    }
    try {
      const result = await saveSettingsJson(settingsToSave, `${path}/Settings.json`)
      console.debug("[onSave] saveSettingsJson result:", result)
      console.log("Saved settings:", settingsToSave)
      onSettingsSaved?.();
    } catch (err) {
      console.error("[onSave] Failed to save settings:", err)
      alert("Failed to save settings. Check the console for details.")
    }
  }

  const allSelected = foundRepos.length > 0 && selectedRepos.size === foundRepos.length
  
  const visibleRepos = React.useMemo(() => {
  const q = repoSearch.trim().toLowerCase()
      if (!q) return foundRepos
      return foundRepos.filter((repo) => repo.toLowerCase().includes(q))
    }, [repoSearch, foundRepos])

  return (
      <AlertDialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (open) {
                  onReset()
                  void handleDialogOpen()
                }
              }}
            >
            <AlertDialogTrigger asChild>
              {buttonSidebar ? (
              <Button
                variant="secondary"
                className="h-5 px-2 text-[7px] bg-gray-200 hover:bg-gray-300 text-gray-900"
                aria-label="Start a new analysis"
              >
                <Plus/>
              </Button>): (
              <Button
                variant="secondary"
                className="px-8 py-7 text-base font-semibold bg-gray-200 hover:bg-gray-300 text-gray-900
             rounded-xl shadow-md hover:shadow-lg transition gap-3">
                <FolderPlus className="h-5 w-5" />
                Start Analysis
              </Button>)}
            </AlertDialogTrigger>

            <AlertDialogContent className="w-[92vw] sm:max-w-3xl max-w-[960px] p-0">
              <div className="flex flex-col max-h-[85vh]">
                <div className="px-6 pt-5 pb-3 border-b bg-background">
                  <AlertDialogTitle>Analysis Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    Configure the root path, repository filters, and advanced settings for a new analysis.
                  </AlertDialogDescription>
                </div>

                <div className="px-6 py-4 overflow-y-auto space-y-8">
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">General</h3>
                    </div>
                    <Separator />
                    <div className="space-y-1.5">
                      <Label htmlFor="path">Root path (folder with Git repo/s)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="path"
                          value={path}
                          onChange={(e) => setPath(e.target.value)}
                          onBlur={(e) => {
                            const newPath = e.target.value.trim()
                            if (newPath) {
                              void fetchReposForPath(newPath)
                            }
                          }}
                          className="cursor-text"
                        />

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleBrowseFolder}
                          disabled={isCheckingPath}
                          className="shrink-0"
                        >
                          {isCheckingPath ? "Checking..." : "Browse"}
                        </Button>
                      </div>

                      {pathError && (
                        <p className="text-xs text-red-500 mt-1">{pathError}</p>
                      )}
                      {!pathError && foundRepos.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Found {foundRepos.length} repositories. Select which ones to keep below.
                        </p>
                      )}
                    </div>

                    {foundRepos.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                              Repositories in path
                            </Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              className="h-7 text-xs w-40"
                              placeholder="Search repositories..."
                              value={repoSearch}
                              onChange={(e) => setRepoSearch(e.target.value)}
                            />
                            <Button
                              variant="secondary"
                              type="button"
                              onClick={handleToggleAllRepos}
                              className="text-xs h-7 px-2"
                            >
                              {allSelected ? "Deselect all" : "Select all"}
                            </Button>
                          </div>
                        </div>

                        <div className="border rounded-md max-h-60 overflow-y-auto">
                          <ul className="divide-y">
                            {visibleRepos.map((repo) => (
                              <li
                                key={repo}
                                className="flex items-center gap-2 px-3 py-2 text-sm"
                              >
                                <Checkbox
                                  checked={selectedRepos.has(repo)}
                                  onCheckedChange={() => handleToggleRepo(repo)}
                                  className="mt-0.5"
                                />
                                <span
                                  className="truncate max-w-[180px] block [direction:rtl] text-left"
                                  title={repo}
                                >
                                  {repo}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                  </section>

                  <Accordion type="multiple" defaultValue={["filters"]}>
                    <AccordionItem value="filters" >
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">Filters</h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        
                        <div className="space-y-3">
                          <Separator />
                          <div className="flex flex-col items-start gap-1">
                          <p className="text-xs font-normal text-muted-foreground text-left">
                            A gray circle means the filter is inactive. When you type this will change to a red -, which you can use to exclude, or change to a green + to include.
                            Standard Unix-style glob syntax is supported.
                          </p>
                        </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ToggleRuleRow
                              id="file-types"
                              label="File types"
                              placeholder="e.g. .ts, .js, .html"
                              value={fileTypes}
                              include={fileTypesMode}
                              onToggle={() =>
                                setFileTypesMode((m) => (m === true ? false : true))
                              }
                              onChange={setFileTypes}
                            />
                            <ToggleRuleRow
                              id="paths"
                              label="Paths"
                              placeholder="e.g. ./src/*, ./docs, /workflows/workt*"
                              value={paths}
                              include={pathsMode}
                              onToggle={() =>
                                setPathsMode((m) => (m === true ? false : true))
                              }
                              onChange={setPaths}
                            />
                            <ToggleRuleRow
                              id="author-name"
                              label="Author name"
                              placeholder="e.g. John*, Jane"
                              value={authorNames}
                              include={authorNameMode}
                              onToggle={() =>
                                setAuthorNameMode((m) =>
                                  (m === true ? false : true))
                              }
                              onChange={setAuthorNames}
                            />
                            <ToggleRuleRow
                              id="author-email"
                              label="Author email"
                              placeholder="e.g. *@gmail.com, john.joe@github.*"
                              value={authorEmails}
                              include={authorEmailMode}
                              onToggle={() =>
                                setAuthorEmailMode((m) => (m === true ? false : true))
                              }
                              onChange={setAuthorEmails}
                            />
                            <ToggleRuleRow
                              id="commit-hash"
                              label="Commit hash"
                              placeholder="e.g. 123456, 121*"
                              value={commitHashes}
                              include ={commitHashMode}
                              onToggle={() =>
                                setCommitHashMode((m) => (m === true ? false : true))
                              }
                              onChange={setCommitHashes}
                            />
                            <ToggleRuleRow
                              id="commit-message"
                              label="Commit message"
                              placeholder="e.g. docs:*"
                              value={commitMessages}
                              include={commitMessageMode}
                              onToggle={() =>
                                setCommitMessageMode((m) => (m === true ? false : true))
                              }
                              onChange={setCommitMessages}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="advanced">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">Advanced settings</h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <Separator />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="searchDepth">Search depth</Label>
                              <Input
                                id="searchDepth"
                                inputMode="numeric"
                                value={searchDepth}
                                onChange={(e) => setSearchDepth(e.target.value)}
                                placeholder="2"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="maxComputeResources">
                                Max compute resource allocation (%)
                              </Label>
                              <Input
                                id="maxComputeResources"
                                inputMode="numeric"
                                value={maxComputeResources}
                                onChange={(e) => setMaxComputeResources(e.target.value)}
                                placeholder="500"
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <div className="px-6 py-4 border-t bg-background flex items-center justify-end gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button variant="secondary" onClick={onReset}>
                    Reset
                  </Button>
                  <AlertDialogAction onClick={onSave}
                  disabled={!path || foundRepos.length === 0}
                  >Save</AlertDialogAction>
                </div>
              </div>
            </AlertDialogContent>

            {isCheckingPath && (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        )}

      </AlertDialog>
  )
}
