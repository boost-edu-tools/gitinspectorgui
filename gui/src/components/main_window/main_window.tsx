"use client"

import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { Overview } from "@/components/main_window/authors/author_statistics"
import { Timeline } from "@/components/main_window/authors/activity_timeline"
import { UnifiedFilesView } from "@/components/main_window/files/file_statistics_main"

import type { SelectedFullProps } from "@/components/types"


type SelectedProps = Pick<
  SelectedFullProps,
  | "allAuthors"
  | "selectedAuthors"
  | "allFiles"
  | "selectedFiles"
  | "filterData"
  | "selectedRepo"
  | "startCommitHash"
  | "endCommitHash"
>;

export function AppMainWindow({
  allAuthors,
  selectedAuthors,
  allFiles,
  selectedFiles,
  filterData,
  selectedRepo,
  startCommitHash,
  endCommitHash
}: SelectedProps) {

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Current Analysis</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>{selectedRepo}</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col pt-0">

          <Tabs defaultValue="authors" className="max-w w-full">
            <TabsList className="w-full p-0 bg-background justify-start border-b rounded-none">
              <TabsTrigger
                className="rounded-none bg-background h-full data-[state=active]:shadow-none border border-transparent border-b-border data-[state=active]:border-border data-[state=active]:border-b-background -mb-[2px] rounded-t"
                value="authors"
              >
                Authors
              </TabsTrigger>
              <TabsTrigger
                className="rounded-none bg-background h-full data-[state=active]:shadow-none border border-transparent border-b-border data-[state=active]:border-border data-[state=active]:border-b-background -mb-[2px] rounded-t"
                value="files"
              >
                Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="authors" className="py-0">
              <div className="mt-4 px-8">
                <div className="p-4">
                  <Timeline
                    allAuthors={allAuthors}
                    selectedAuthors={selectedAuthors}
                    filterData={filterData}
                    selectedRepo={selectedRepo}
                    startCommitHash={startCommitHash}
                    endCommitHash={endCommitHash}
                  />
                </div>
                <div className="p-4">
                  <Overview
                    allAuthors={allAuthors}
                    selectedAuthors={selectedAuthors}
                    filterData={filterData}
                    selectedRepo={selectedRepo}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-4 px-8">
              <div className="p-4">
                <UnifiedFilesView
                  allAuthors={allAuthors}
                  selectedAuthors={selectedAuthors}
                  allFiles={allFiles}
                  selectedFiles={selectedFiles}
                  filterData={filterData}
                  selectedRepo={selectedRepo}
                  startCommitHash={startCommitHash}
                  endCommitHash={endCommitHash}
                />
              </div>
            </TabsContent>
          </Tabs>
        {/* )} */}
      </div>
    </SidebarInset>
  );
}
