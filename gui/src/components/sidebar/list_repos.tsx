import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Folder, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnalysisProps } from '@/components/types';

export function ListRepos({
  allRepos, 
  setAllRepos,
  selectedRepo, 
  setSelectedRepo
}: Pick<AnalysisProps,
  'allRepos' 
  | 'setAllRepos'
  | 'selectedRepo' 
  | 'setSelectedRepo'
>) {

  const handleClearAll = () => {
    setAllRepos(new Set())
    setSelectedRepo("")
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Analysed repositories</SidebarGroupLabel>

        {allRepos.size > 0 && (
          <Button
            variant="ghost"
            size="icon"
            title="Clear all"
            onClick={handleClearAll}
            className="h-5 w-5 text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <SidebarMenu className="space-y-0.5 border rounded-md max-h-20 overflow-y-auto">

        {Array.from(allRepos).map((item) => {
          const parts = item.split(/[\\/]/).filter(Boolean)
          const repoName = parts.pop()
          const parent = parts.pop()
          const display = parent ? `${parent}/${repoName}` : repoName

          return (
            <SidebarMenuItem key={item}>
              <SidebarMenuButton
                onClick={() => setSelectedRepo(item)}
                asChild
                isActive={item === selectedRepo}
                className="h-4 py-1 data-[active=true]:bg-gray-200 data-[active=true]:text-gray-900"
              >
                <a title={item}>
                  <Folder className="mr-1" />
                  <span className="text-xs">{display}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
