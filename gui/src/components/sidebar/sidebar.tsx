
import { DataImport } from "@/components/sidebar/data_import"
import { ListRepos } from "@/components/sidebar/list_repos"
import { FilterData} from "@/components/sidebar/filter/filter_main"
import { Separator } from "@/components/ui/separator"
import { AnalysisProps, AnalysisResult } from '@/components/types';
import { DataExport } from "@/components/sidebar/data_export"
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar"


export function AppSidebar({

  path,
  setPath,
  
  repo_analysis,

  allAuthors, 
  selectedAuthors, 
  selectAuthors, 

  allFiles, 
  selectedFiles, 
  selectFiles, 

  filterData, 
  setFilterData, 

  allRepos, 
  setAllRepos,

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
  onSettingsSaved

}:
  {repo_analysis: AnalysisResult } &
  Pick<
    AnalysisProps,

      "path"
      | "setPath"

      |"allAuthors"  
      |"selectedAuthors"  
      |"selectAuthors" 

      |"allFiles" 
      |"selectedFiles" 
      |"selectFiles"  

      |"filterData"  
      |"setFilterData"  

      |"allRepos"
      |"setAllRepos"
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
      |"onSettingsSaved"
>) {

  return (
    <Sidebar >
      <SidebarContent>
        <DataImport
          setAllRepos={setAllRepos}
          setSelectedRepo={setSelectedRepo}
          path = {path}
          setPath={setPath}
          onSettingsSaved={onSettingsSaved}
          />
        <Separator className="mt-3" />
        <ListRepos
          allRepos={allRepos}
          setAllRepos={setAllRepos}
          selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo}/>
        <Separator className="mt-3" />
        <FilterData
          repository={repo_analysis.original_repository}         
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
