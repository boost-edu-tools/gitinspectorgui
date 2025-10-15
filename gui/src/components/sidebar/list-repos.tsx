
import * as React from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Folder,
} from "lucide-react"
import { SelectedFullProps } from '@/components/types';

type selectedProps = Pick<SelectedFullProps, 'allRepos' | 'selectedRepo' | 'setSelectedRepo' >;
 
export function ListRepos({allRepos, selectedRepo, setSelectedRepo}: selectedProps)
{
  const reposArray = React.useMemo(() => Array.from(allRepos), [allRepos]);
  
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden py-0">
      <SidebarGroupLabel>Found repositories</SidebarGroupLabel>
      <SidebarMenu className="space-y-0.5">
        {reposArray.map((item) => (
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

