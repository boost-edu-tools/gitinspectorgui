"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Overview } from "@/components/analysis/summary/overview"
import { Timeline } from "@/components/analysis/summary/timeline"

import { CommitsTable } from "@/components/analysis/detailed/commits"

import { FilesViewer } from "@/components/analysis/detailed/files"

export function AppMainWindow() {
  return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Current Analysis</BreadcrumbLink>
                </BreadcrumbItem>
                
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbLink >Repo1</BreadcrumbLink>

                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Tabs defaultValue="summary" className="max-w w-full">
            <TabsList className="w-full p-0 bg-background justify-start border-b rounded-none">
              <TabsTrigger 
              className="rounded-none bg-background h-full data-[state=active]:shadow-none border border-transparent border-b-border data-[state=active]:border-border data-[state=active]:border-b-background -mb-[2px] rounded-t"
              value="summary">Summary</TabsTrigger>
              <TabsTrigger 
              className = "rounded-none bg-background h-full data-[state=active]:shadow-none border border-transparent border-b-border data-[state=active]:border-border data-[state=active]:border-b-background -mb-[2px] rounded-t"
              value="detailed">Detailed</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview" className="h-7 px-2 text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="timeline" className="h-7 px-2 text-xs">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <Overview/>

                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <Timeline/>

                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="detailed" className="mt-4">
              <Tabs defaultValue="commits" className="w-full">
                <TabsList>
                  <TabsTrigger value="commits" className="h-7 px-2 text-xs">Commits</TabsTrigger>
                  <TabsTrigger value="files"className="h-7 px-2 text-xs">Files</TabsTrigger>
                </TabsList>

                <TabsContent value="commits" className="mt-4">
                  <CommitsTable/>
                </TabsContent>

                <TabsContent value="files" className="mt-4">
                  <FilesViewer/>
                </TabsContent>

                
                
              </Tabs>
            </TabsContent>


          </Tabs>
        </div>
      </SidebarInset>

  )
}
