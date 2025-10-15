import { FilterRange } from "@/components/sidebar/filter/filter_range"
import { FilterAuthors } from "@/components/sidebar/filter/filter_authors"
import { FilterFiles } from "@/components/sidebar/filter/filter_files"
import { Calendar} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { SelectedFullProps } from '@/components/types'

type selectedProps = Pick<
  SelectedFullProps,
  "selectedRepo"  | "allAuthors" | "selectedAuthors" | "selectAuthors" | "allFiles"| "selectedFiles" |
  "selectFiles" | "filterData" | "setFilterData" | "startDate"| "endDate" | "startCommitHash" | 
  "endCommitHash" | "onStartDateChange" | "onEndDateChange" | "onStartCommitChange" | "onEndCommitChange" 
>;

export function FilterData({
    selectedRepo, 
    allAuthors, 
    selectedAuthors, 
    selectAuthors, 
    allFiles, 
    selectedFiles, 
    selectFiles, 
    filterData, 
    setFilterData,
    startDate,
    endDate,
    startCommitHash,
    endCommitHash,
    onStartDateChange,
    onEndDateChange,
    onStartCommitChange,
    onEndCommitChange,
}: selectedProps)  {
  
  return (

     <SidebarGroup>
      <div className="flex items-center justify-between w-full py-0">
      <SidebarGroupLabel>Filter data</SidebarGroupLabel>
      <Switch checked={filterData} onCheckedChange={setFilterData} />
      </div>  
      <SidebarMenu> 

                  <FilterAuthors
                    allAuthors={allAuthors}
                    selectedAuthors={selectedAuthors}
                    selectAuthors={selectAuthors} />

                  <FilterFiles 
                    allFiles={allFiles}
                    selectedFiles={selectedFiles}
                    selectFiles={selectFiles} />

            <a className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-muted">
              <span className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">Date/Commit Range</span>
              </span>
            </a>
                  <FilterRange
                  selectedRepo={selectedRepo}
                  selectedAuthors={selectedAuthors}
                  startDate={startDate}
                  endDate={endDate}
                  startCommitHash={startCommitHash}
                  endCommitHash={endCommitHash}
                  onStartDateChange={onStartDateChange}
                  onEndDateChange={onEndDateChange}
                  onStartCommitChange={onStartCommitChange}
                  onEndCommitChange={onEndCommitChange}/>
      
    </SidebarMenu>
    </SidebarGroup>
  )
}
