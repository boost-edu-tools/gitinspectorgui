
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {Folder} from "lucide-react"
import { AnalysisProps } from '@/components/types';

export function ListRepos({
  allRepos, 
  selectedRepo, 
  setSelectedRepo}: 
  Pick<AnalysisProps, 
  'allRepos' 
  | 'selectedRepo' 
  | 'setSelectedRepo' >){
  
return (
  <SidebarGroup className="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>Analysed repositories</SidebarGroupLabel>

    <SidebarMenu className="space-y-0.5">
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
                <Folder />
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



