import {
  Folder,
} from "lucide-react"


import { useState } from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const repos = ["Repo1", "Repo2", "Repo3"]

  
export function ListRepos()
{
  const [selectedRepo, setSelectedRepo] = useState("Repo1");

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Found repositories</SidebarGroupLabel>
      <SidebarMenu>
        {repos.map((item) => (
          <SidebarMenuItem key={item}>
            <SidebarMenuButton 
            onClick={() => setSelectedRepo(item)} 
            asChild
            isActive={item === selectedRepo}>
              <a>
                <Folder/>
                <span>{item}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}

      </SidebarMenu>
    </SidebarGroup>
  )
}

