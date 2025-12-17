import { DataImportWindow } from "./data_import_window"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { Trash2, GitGraph  } from "lucide-react"
import type { AnalysisProps } from "@/components/types"
import { Button } from "@/components/ui/button"



export function AnalysedRepos({
  allRepos,
  setAllRepos,
  selectedRepo,
  setSelectedRepo,
  path,
  setPath,
  onSettingsSaved,
  isDataImportOpen,
  onDataImportOpenChange

}: Pick<AnalysisProps, "allRepos" | "setAllRepos" | "selectedRepo" | "setSelectedRepo"| "path" | "setPath" | "onSettingsSaved"> & {
  isDataImportOpen: boolean;
  onDataImportOpenChange: (open: boolean) => void;
}) {

  const handleClearAll = () => {
    setAllRepos(new Set())
    setSelectedRepo("")
  }
  return (
    <SidebarGroup>
    <SidebarMenu>
    <div className="flex flex-col p-2 gap-1">
      <SidebarGroupLabel>Analysed repositories</SidebarGroupLabel>

        <span className="flex items-center justify-between gap-2 mt-3">
          <span className="flex items-center gap-2">
            <GitGraph className="h-3 w-3" />
            <span className="text-xs">Repositories</span>
          </span>
          <span className="flex items-center gap-2">
          <DataImportWindow
            buttonSidebar={true}
            setAllRepos={setAllRepos}
            setSelectedRepo={setSelectedRepo}
            path = {path}
            setPath={setPath}
            onSettingsSaved={onSettingsSaved}
            isDialogOpen={isDataImportOpen}
            onOpenChange={onDataImportOpenChange}
          />

          <Button
            variant="ghost"
            size="icon"
            title="Clear all"
            onClick={handleClearAll}
            className="h-5 w-5 text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          </span>
        </span>

        <Card className="bg-transparent border-none shadow-none p-0">
        <CardContent className="p-0">
          <ScrollArea className="rounded-md border h-25">
          <ul className="divide-y">
            {Array.from(allRepos)
              .sort((a, b) => a.localeCompare(b))
              .map((item) => {
                const parts = item.split(/[\\/]/).filter(Boolean)
                const repoName = parts.pop()
                const parent = parts.pop()
                const display = parent ? `${parent}/${repoName}` : repoName
                const isActive = item === selectedRepo

                return (
                  <li key={item} className="flex items-center gap-2 p-1">
                    <button
                      type="button"
                      onClick={() => setSelectedRepo(item)}
                      className={[
                        "flex w-full items-center gap-2 p-1 text-left",
                        "hover:bg-gray-100",
                        isActive ? "bg-gray-200 text-gray-900" : "text-muted-foreground"
                      ].join(" ")}
                      aria-pressed={isActive}
                      title={item}
                    >
                      <span className="truncate text-[10px] max-w-[160px]"
                      title={item}>
                        {display}
                      </span>
                    </button>
                  </li>
                )
              })}
          </ul>
          </ScrollArea>

        </CardContent>
        </Card>

    </div>
    </SidebarMenu>
    </SidebarGroup>
  )}