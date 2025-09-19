import { useState } from "react"
import { Switch } from "@/components/ui/switch"

import { FilterRange } from "@/components/sidebar/filter-range"
import { FilterAuthors } from "@/components/sidebar/filter-authors"

import { Calendar, ChevronDown} from "lucide-react";

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


export function FilterData() {
  const [checked, setChecked] = useState(true);

  return (

     <SidebarGroup>
      <div className="flex items-center justify-between w-full">
      <SidebarGroupLabel>Filter data</SidebarGroupLabel>
      <Switch checked={checked} onCheckedChange={setChecked} />
      </div>  

      <SidebarMenu> 
        
        <Collapsible>
        <CollapsibleTrigger>
        <SidebarMenuItem>
            <SidebarMenuButton asChild>
            <a className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-muted">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Authors</span>
              </span>
              <ChevronDown className="h-4 w-4" />
            </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </CollapsibleTrigger>
                <CollapsibleContent>
                  <FilterAuthors/>
                </CollapsibleContent>
              </Collapsible>      
              
        <Collapsible>
        <CollapsibleTrigger>
        <SidebarMenuItem>
            <SidebarMenuButton asChild>
            <a className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-muted">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Date/Commit Range</span>
              </span>
              <ChevronDown className="h-4 w-4" />
            </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </CollapsibleTrigger>
                <CollapsibleContent>
                  <FilterRange/>
                </CollapsibleContent>
              </Collapsible>
  
      
    </SidebarMenu>
    </SidebarGroup>
    

  )
}
