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
import { AnalysisProps, AnalysisResult } from '@/components/types'

export function FilterData({
  repository,
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
  commitsIncluded,
  setCommitsIncluded,
  commitsExcluded,
  setCommitsExcluded,
}: 
  Pick<AnalysisResult, "repository"> &
  Pick<
    AnalysisProps,
      |"allAuthors"  
      |"selectedAuthors"  
      |"selectAuthors"  
      |"allFiles" 
      |"selectedFiles" 
      |"selectFiles"  
      |"filterData"  
      |"setFilterData"  
      |"startDate" 
      |"endDate"  
      |"startCommitHash"  
      |"endCommitHash"  
      |"onStartDateChange"  
      |"onEndDateChange"  
      |"onStartCommitChange"  
      |"onEndCommitChange" 
      |"commitsIncluded"
      |"setCommitsIncluded"
      |"commitsExcluded"
      |"setCommitsExcluded"
>)  {
  
  return (
     <SidebarGroup>
      <div className="flex items-center justify-between w-full px-2">
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
                    repository={repository}
                    startDate={startDate}
                    endDate={endDate}
                    startCommitHash={startCommitHash}
                    endCommitHash={endCommitHash}
                    onStartDateChange={onStartDateChange}
                    onEndDateChange={onEndDateChange}
                    onStartCommitChange={onStartCommitChange}
                    onEndCommitChange={onEndCommitChange}
                    commitsIncluded={commitsIncluded}
                    setCommitsIncluded={setCommitsIncluded}
                    commitsExcluded={commitsExcluded}
                    setCommitsExcluded={setCommitsExcluded}
                    />
    </SidebarMenu>
    </SidebarGroup>
  )
}
