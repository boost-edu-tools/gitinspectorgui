
import { DataImport } from "@/components/sidebar/data_import"
import { ListRepos } from "@/components/sidebar/list_repos"
import { FilterData} from "@/components/sidebar/filter/filter_main"
import { Separator } from "@/components/ui/separator"
import { AnalysisProps } from '@/components/types';
import { DataExport } from "@/components/sidebar/data_export"
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({

  allAuthors, 
  selectedAuthors, 
  selectAuthors, 

  allFiles, 
  selectedFiles, 
  selectFiles, 

  filterData, 
  setFilterData, 

  allRepos, 
  selectedRepo, 
  setSelectedRepo,

  startDate,
  endDate,
  startCommitHash,
  endCommitHash,
  onStartDateChange,
  onEndDateChange,
  onStartCommitChange,
  onEndCommitChange,

}:
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

      |"allRepos"
      |"selectedRepo"
      |"setSelectedRepo"

      |"startDate" 
      |"endDate"  
      |"startCommitHash"  
      |"endCommitHash"  
      |"onStartDateChange"  
      |"onEndDateChange"  
      |"onStartCommitChange"  
      |"onEndCommitChange" 
>) {

  return (
    <Sidebar >
      <SidebarContent>
        <DataImport/>
        <Separator className="mt-3" />
        <ListRepos
          allRepos={allRepos}
          selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo}/>
        <Separator className="mt-3" />
        <FilterData
          selectedRepo={selectedRepo}
          allAuthors={allAuthors}
          selectedAuthors={selectedAuthors}
          selectAuthors={selectAuthors} 
          allFiles={allFiles}
          selectedFiles={selectedFiles}
          selectFiles={selectFiles}
          filterData={filterData}
          setFilterData={setFilterData}
          startDate={startDate}
          endDate={endDate}
          startCommitHash={startCommitHash}
          endCommitHash={endCommitHash}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onStartCommitChange={onStartCommitChange}
          onEndCommitChange={onEndCommitChange}/> 
        <Separator className="mt-0" />
        <DataExport/>

      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
