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
import { FileStatisticsTable } from "./files/file_table"

import type { AnalysisResult, AnalysisProps } from "@/components/types"



export function AppMainWindow({ repo_analysis, filterData }: {repo_analysis: AnalysisResult } &
  Pick<AnalysisProps,"filterData"> ) {

  const [selectedFile, setSelectedFile] = React.useState<string | null>(null)
  
  const repository = filterData
      ? repo_analysis.repository
      : repo_analysis.original_repository

  return (
    (repository.path === "") ? (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-center">No repository selected. <br /> Click 'New Analysis' on the top right to find repositories to analyze!</p>
      </div>
    ) : (
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
                <BreadcrumbLink>{repo_analysis.repository.name}</BreadcrumbLink>
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
                    repository={repository}
                  />
                </div>
                <div className="p-4">
                  <AuthorStatisticsOverview
                    repository={repository}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="py-0">
              { selectedFile?  (
                  <div className="space-y-2 py-4 mt-4 px-8">
                    <BlameViewMultiTab
                      repository={repository}
                      selectedFile={selectedFile}
                      setSelectedFile={setSelectedFile}
                      onExit={() => setSelectedFile(null)}
                    />
                  </div>) 
                  :
                (<div className="mt-4 px-8">
                  <div className="p-4">
                    <FileSatisticsVisualisation
                      repository={repository}
                    />
                  </div>

                  <div className="p-4">
                    <FileStatisticsTable
                      repository={repository}
                      setSelectedFile={setSelectedFile}
                    />
                  </div>
                </div>)
              }                           
            </TabsContent>
          </Tabs>
      </div>
    </SidebarInset>
  ))
}
