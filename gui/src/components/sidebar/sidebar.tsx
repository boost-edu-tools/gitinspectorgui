
import { DataImport } from "@/components/sidebar/data-import"
import { ListRepos } from "@/components/sidebar/list-repos"
import { FilterData} from "@/components/sidebar/filter/filter_main"
import { Separator } from "@radix-ui/react-separator"
import { SelectedFullProps } from '@/components/types';
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
}: SelectedFullProps) {
  return (
    <Sidebar >
      <SidebarContent>
        <DataImport/>
        <Separator className="my-0 h-px bg-border" />
        <ListRepos
          allRepos={allRepos}
          selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo}/>
        <Separator className="my-0 h-px bg-border" />
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
