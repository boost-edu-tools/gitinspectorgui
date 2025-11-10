"use client"

import * as React from "react"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { AuthorStatisticsOverview} from "@/components/main_window/authors/author_table"
import { AuthorStatisticsVisualisation } from "@/components/main_window/authors/author_viz"
import { BlameViewMultiTab } from "./files/blame_tabs"
import { FileSatisticsVisualisation } from "./files/file_viz"
import { FileStatisticsTable } from "./files/files_table"

import type { AnalysisProps } from "@/components/types"

export function AppMainWindow({
  selectedRepo,
}: Pick<
  AnalysisProps,
  | "selectedRepo"
>) {

  const [selectedFile, setSelectedFile] = React.useState<string | null>(null)

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
                  <AuthorStatisticsVisualisation
                    selectedRepo={selectedRepo}
                  />
                </div>
                <div className="p-4">
                  <AuthorStatisticsOverview
                    selectedRepo={selectedRepo}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="py-0">
              { selectedFile?  (
                  <div className="space-y-2 py-4 mt-4 px-8">
                    <BlameViewMultiTab
                      selectedRepo={selectedRepo}
                      selectedFile={selectedFile}
                      setSelectedFile={setSelectedFile}
                      onExit={() => setSelectedFile(null)}
                    />
                  </div>) 
                  :
                (<div className="mt-4 px-8">
                  <div className="p-4">
                    <FileSatisticsVisualisation
                      selectedRepo={selectedRepo}
                    />
                  </div>

                  <div className="p-4">
                    <FileStatisticsTable
                      selectedRepo={selectedRepo}
                      setSelectedFile={setSelectedFile}
                    />
                  </div>
                </div>)
              }                           
            </TabsContent>
          </Tabs>
      </div>
    </SidebarInset>
  );
}
