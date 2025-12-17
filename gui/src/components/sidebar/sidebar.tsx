
import { AnalysedRepos } from "./analysed_repos";
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
  commitsIncluded,
  setCommitsIncluded,
  commitsExcluded,
  setCommitsExcluded,

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
      |"commitsIncluded"
      |"setCommitsIncluded"
      |"commitsExcluded"
      |"setCommitsExcluded"
      |"onSettingsSaved"
>) {

  return (
    <Sidebar >
      <SidebarContent>
        <div className={!selectedRepo ? "opacity-50 pointer-events-none" : ""}>
        <AnalysedRepos
          allRepos={allRepos}
          setAllRepos={setAllRepos}
          selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo}
          path = {path}
          setPath={setPath}
          onSettingsSaved={onSettingsSaved}
          />
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
          onEndCommitChange={onEndCommitChange}
          commitsIncluded={commitsIncluded}
          setCommitsIncluded={setCommitsIncluded}
          commitsExcluded={commitsExcluded}
          setCommitsExcluded={setCommitsExcluded}
          /> 
        <Separator className="mt-0" />
        <DataExport/>
      </div>
      </SidebarContent>
      
      <SidebarRail />
    </Sidebar>
  )
}
