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

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

export function AppMainWindow({
  selectedRepo,
}: Pick<
  AnalysisProps,
  | "selectedRepo"
>) {

  const [selectedFile, setSelectedFile] = React.useState<string | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false)
  const [exportFormat, setExportFormat] = React.useState<"csv" | "html" | "json">("csv")


  const handleExport = (format: "csv" | "html" | "json") => {
  console.log("Export as", format)}

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

        <div className="ml-auto flex items-center gap-2 px-10">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            type="button"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Data export</span>
          </Button>

          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogContent className="w-[90vw] max-w-sm">
              <DialogHeader>
                <DialogTitle>Export data</DialogTitle>
                <DialogDescription className="text-xs">
                  Choose the file type you want to export this analysis to.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3">
                <RadioGroup
                  value={exportFormat}
                  onValueChange={(val) =>
                    setExportFormat(val as "csv" | "html" | "json")
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="export-csv" />
                    <Label htmlFor="export-csv" className="text-sm">
                      CSV
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <RadioGroupItem value="html" id="export-html" />
                    <Label htmlFor="export-html" className="text-sm">
                      HTML
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <RadioGroupItem value="json" id="export-json" />
                    <Label htmlFor="export-json" className="text-sm">
                      JSON
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setExportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => handleExport(exportFormat)}
                >
                  Export
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
