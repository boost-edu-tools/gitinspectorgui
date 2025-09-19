
import { DataImport } from "@/components/sidebar/data-import"
import { ListRepos } from "@/components/sidebar/list-repos"
import { FilterData} from "@/components/sidebar/filter-data"
import { AiQuestions } from "@/components/sidebar/ai-questions"

import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Separator } from "@radix-ui/react-separator"


export function AppSidebar() {
  return (
    <Sidebar >
      <SidebarContent>
        <DataImport />
        <ListRepos/>
        <Separator className="my-2 h-px bg-border" />
        <FilterData/>
        <AiQuestions/>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
