
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
    <SidebarGroup className="group-data-[collapsible=icon]:hidden py-0">
      <SidebarGroupLabel>Found repositories</SidebarGroupLabel>
      <SidebarMenu className="space-y-0.5">
        {Array.from(allRepos).map((item) => (
          <SidebarMenuItem key={item}>
            <SidebarMenuButton 
            onClick={() => setSelectedRepo(item)} 
            asChild
            isActive={item === selectedRepo} className="h-4 py-1">
              <a>
                <Folder/>
                <span  className="text-xs">{item}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

