import * as React from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import settings from "@/data/Settings.json"
import {
  retrieveRepositories,
  createAnalysisParameters,
  runInitialAnalysis,
  rerunAnalysis,
  verifyFilter,
  loadSettingsJson,
  saveSettingsJson,
} from "@/lib/api"

import type { AnalysisProps} from "@/components/types"

type Mode = "include" | "exclude"

function ModeButton({
  mode,
  onToggle,
  ariaLabel,
}: {
  mode: Mode
  onToggle: () => void
  ariaLabel: string
}) {
  const isInclude = mode === "include"
  const Icon = isInclude ? Plus : Minus
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onToggle}
      className={
        "h-9 w-9 shrink-0 rounded-l-md border-r inline-flex items-center justify-center " +
        (isInclude
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
          : "bg-red-500/10 text-red-600 border-red-500/30")
      }
      title={isInclude ? "Include" : "Exclude"}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function ToggleRuleRow({
  id,
  label,
  placeholder,
  value,
  mode,
  onChange,
  onToggle,
}: {
  id: string
  label: string
  placeholder?: string
  value: string
  mode: Mode
  onChange: (v: string) => void
  onToggle: () => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex rounded-md border">
        <ModeButton mode={mode} onToggle={onToggle} ariaLabel={`${label} mode`} />
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

export function DataImport({
    setAllRepos,
    setSelectedRepo}
   : 
   Pick<AnalysisProps, 
   "setAllRepos"
   | "setSelectedRepo">  
) {

  const defaultState = React.useMemo(
    () => ({
      path: "",
      searchDepth: String(settings.search_depth ?? 5),
      maxComputeResources: String(settings.max_compute_resources ?? 90),

      fileTypesMode: (settings.file_types_filter.include === true ? "include" : "exclude") as Mode,
      fileTypes: String(settings.file_types_filter.value),

      pathsMode: (settings.path_filter.include === true ? "include" : "exclude") as Mode,
      paths: String(settings.path_filter.value),

      authorNameMode:(settings.author_names_filter.include === true ? "include" : "exclude") as Mode,
      authorNames: String(settings.author_names_filter.value),

      authorEmailMode: (settings.author_emails_filter.include === true ? "include" : "exclude") as Mode,
      authorEmails: String(settings.author_emails_filter.value),

      commitHashMode: (settings.commit_hash_filter.include === true ? "include" : "exclude") as Mode,
      commitHashes: String(settings.commit_hash_filter.value),

      commitMessageMode: (settings.commit_message_filter.include === true ? "include" : "exclude") as Mode,
      commitMessages: String(settings.commit_message_filter.value),
    }),
    []
  )

  const [path, setPath] = React.useState(defaultState.path)

  const [searchDepth, setSearchDepth] = React.useState(defaultState.searchDepth)
  const [maxComputeResources, setMaxComputeResources] = React.useState(defaultState.maxComputeResources)

  const [fileTypesMode, setFileTypesMode] = React.useState<Mode>(defaultState.fileTypesMode)
  const [fileTypes, setFileTypes] = React.useState(defaultState.fileTypes)

  const [pathsMode, setPathsMode] = React.useState<Mode>(defaultState.pathsMode)
  const [paths, setPaths] = React.useState(defaultState.paths)

  const [authorNameMode, setAuthorNameMode] = React.useState<Mode>(defaultState.authorNameMode)
  const [authorNames, setAuthorNames] = React.useState(defaultState.authorNames)

  const [authorEmailMode, setAuthorEmailMode] = React.useState<Mode>(defaultState.authorEmailMode)
  const [authorEmails, setAuthorEmails] = React.useState(defaultState.authorEmails)

  const [commitHashMode, setCommitHashMode] = React.useState<Mode>(defaultState.commitHashMode)
  const [commitHashes, setCommitHashes] = React.useState(defaultState.commitHashes)

  const [commitMessageMode, setCommitMessageMode] = React.useState<Mode>(defaultState.commitMessageMode)
  const [commitMessages, setCommitMessages] = React.useState(defaultState.commitMessages)

  const onReset = () => {
    setPath(defaultState.path)
    setSearchDepth(defaultState.searchDepth)
    setMaxComputeResources(defaultState.maxComputeResources)
    setFileTypesMode(defaultState.fileTypesMode); setFileTypes(defaultState.fileTypes)
    setPathsMode(defaultState.pathsMode); setPaths(defaultState.paths)
    setAuthorNameMode(defaultState.authorNameMode); setAuthorNames(defaultState.authorNames)
    setAuthorEmailMode(defaultState.authorEmailMode); setAuthorEmails(defaultState.authorEmails)
    setCommitHashMode(defaultState.commitHashMode); setCommitHashes(defaultState.commitHashes)
    setCommitMessageMode(defaultState.commitMessageMode); setCommitMessages(defaultState.commitMessages)
  }

  const onSave = () => {
    // TODO: Remove this test code for a proper implementation
    // This place has been used to trigger all API endpoints for testing purposes
    

    // If no path provided, notify the user
    if (!path || path.trim() === "") {
      alert("Please provide a root path to search for repositories.");
      return;
    }

    (async () => {
      try {
        const depthNum = Number(searchDepth) || 1
        console.log("DataImport: retrieving repositories for", path, "depth", depthNum)
        const repos = await retrieveRepositories(path, depthNum)
        console.log("retrieve_repositories result:", repos)
        setAllRepos(new Set(repos));
        setSelectedRepo(repos[0] || "");


        // Choose a repository for subsequent tests (fallback to provided path)
        const firstRepo = repos && repos.length > 0 ? repos[0] : path

        // 1) createAnalysisParameters
        try {
          const params = await createAnalysisParameters(firstRepo, null, null, null, null, null, null, null, null)
          console.log("createAnalysisParameters result:", params)

          // 2) runInitialAnalysis
          try {
            const initialResult = await runInitialAnalysis(params)
            
            console.log("runInitialAnalysis result:", initialResult)

            

            // 3) rerunAnalysis (use same params for test)
            try {
              const rerunResult = await rerunAnalysis(initialResult, params)
              console.log("rerunAnalysis result:", rerunResult)
            } catch (err) {
              console.error("rerunAnalysis failed:", err)
            }
          } catch (err) {
            console.error("runInitialAnalysis failed:", err)
          }
        } catch (err) {
          console.error("createAnalysisParameters failed:", err)
        }

        // 4) verifyFilter - test with current file types and paths inputs
        try {
          const ftFilter = { include: fileTypesMode === "include", value: fileTypes }
          const pathsFilter = { include: pathsMode === "include", value: paths }
          const verifyFileTypes = await verifyFilter(ftFilter as any, false)
          console.log("verifyFilter (fileTypes) result:", verifyFileTypes)
          const verifyPaths = await verifyFilter(pathsFilter as any, true)
          console.log("verifyFilter (paths) result:", verifyPaths)
        } catch (err) {
          console.error("verifyFilter failed:", err)
        }

        // 5) loadSettingsJson / saveSettingsJson - UNTESTED
        // try {
        //   const settingsPath = `${path.replace(/\\/g, "/")}/Settings.json`
        //   const loaded = await loadSettingsJson(settingsPath)
        //   console.log("loadSettingsJson result:", loaded)
        // } catch (err) {
        //   console.error("loadSettingsJson failed:", err)
        // }

        // try {
        //   const savePath = `${path.replace(/\\/g, "/")}/Settings.saved.json`
        //   const saveRes = await saveSettingsJson(settings as any, savePath)
        //   console.log("saveSettingsJson result:", saveRes)
        // } catch (err) {
        //   console.error("saveSettingsJson failed:", err)
        // }

      } catch (err) {
        console.error("Failed to retrieve repositories:", err)
        alert(`Failed to retrieve repositories: ${String(err)}`)
      }
    })()

    return
  }

  return (
    <SidebarGroup className="mt-3">
      <SidebarGroupLabel>Data import</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="w-full gap-1 bg-gray-200 hover:bg-gray-300 text-gray-900"
                aria-label="Start a new analysis"
              >
                <Plus className="mr-2 h-3 w-3" />
                New analysis
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="w-[92vw] sm:max-w-3xl max-w-[960px] p-0">
              <div className="flex flex-col max-h-[85vh]">
                <div className="px-6 pt-5 pb-3 border-b bg-background">
                  <AlertDialogTitle>Analysis Settings</AlertDialogTitle>
                </div>

                <div className="px-6 py-4 overflow-y-auto space-y-8">
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">General</h3>
                      <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">Required</span>
                    </div>
                    <Separator />
                    <div className="space-y-1.5">
                      <Label htmlFor="path">Root path (folder with Git repo/s)</Label>
                      <Input
                        id="path"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        placeholder="e.g. /home/user/repos"
                      />
                    </div>
                  </section>


                  <Accordion type="multiple" defaultValue={[]}>
                    <AccordionItem value="filters">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">Filters</h3>
                          <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">Optional</span>
                        </div>
                     </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <Separator />
                          <div className="flex justify-end items-center gap-2 text-sm text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Click the <span className="text-emerald-600 font-medium">green +</span> or{" "}
                                    <span className="text-red-600 font-medium">red –</span> button to toggle between
                                    <strong> include</strong> and <strong>exclude</strong> mode for each filter.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ToggleRuleRow
                              id="file-types"
                              label="File types"
                              placeholder="e.g. .ts, .js, .html"
                              value={fileTypes}
                              mode={fileTypesMode}
                              onToggle={() => setFileTypesMode((m) => (m === "include" ? "exclude" : "include"))}
                              onChange={setFileTypes}
                            />
                            <ToggleRuleRow
                              id="paths"
                              label="Paths"
                              placeholder="e.g. ./src/*, ./docs, /workflows/workt*"
                              value={paths}
                              mode={pathsMode}
                              onToggle={() => setPathsMode((m) => (m === "include" ? "exclude" : "include"))}
                              onChange={setPaths}
                            />
                            <ToggleRuleRow
                              id="author-name"
                              label="Author name"
                              placeholder="e.g. John*, Jane"
                              value={authorNames}
                              mode={authorNameMode}
                              onToggle={() => setAuthorNameMode((m) => (m === "include" ? "exclude" : "include"))}
                              onChange={setAuthorNames}
                            />
                            <ToggleRuleRow
                              id="author-email"
                              label="Author email"
                              placeholder="e.g. *@gmail.com, john.joe@github.*"
                              value={authorEmails}
                              mode={authorEmailMode}
                              onToggle={() => setAuthorEmailMode((m) => (m === "include" ? "exclude" : "include"))}
                              onChange={setAuthorEmails}
                            />
                            <ToggleRuleRow
                              id="commit-hash"
                              label="Commit hash"
                              placeholder="e.g. 123456, 121*"
                              value={commitHashes}
                              mode={commitHashMode}
                              onToggle={() => setCommitHashMode((m) => (m === "include" ? "exclude" : "include"))}
                              onChange={setCommitHashes}
                            />
                            <ToggleRuleRow
                              id="commit-message"
                              label="Commit message"
                              placeholder="e.g. docs:*"
                              value={commitMessages}
                              mode={commitMessageMode}
                              onToggle={() => setCommitMessageMode((m) => (m === "include" ? "exclude" : "include"))}
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
                          <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">Optional</span>
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
                              <Label htmlFor="maxComputeResources">Max compute resource allocation (%)</Label>
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
                  <Button variant="secondary" onClick={onReset}>Reset</Button>
                  <AlertDialogAction onClick={onSave}>Save</AlertDialogAction>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarMenuItem>

      </SidebarMenu>
    </SidebarGroup>
  )
}
