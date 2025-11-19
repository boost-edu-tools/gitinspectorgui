import * as React from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function DataExport() {
  const [exportFormat, setExportFormat] = React.useState<"csv" | "html" | "json">("csv")

  const handleExport = (format: "csv" | "html" | "json") => {
    console.log("Export as", format)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Data export</SidebarGroupLabel>

      <SidebarMenu>
        <SidebarMenuItem className="px-2 py-2">
          <div className="flex flex-col gap-3">


            <RadioGroup
              value={exportFormat}
              onValueChange={(val) => setExportFormat(val as "csv" | "html" | "json")}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="csv" id="export-csv" />
                <Label htmlFor="export-csv" className="text-xs">
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="html" id="export-html" />
                <Label htmlFor="export-html" className="text-xs">
                  HTML
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="json" id="export-json" />
                <Label htmlFor="export-json" className="text-xs">
                  JSON
                </Label>
              </div>
            </RadioGroup>

            <Button
              size="sm"
              variant="secondary"
              className="w-full gap-1 bg-gray-200 hover:bg-gray-300 text-gray-900"
              onClick={() => handleExport(exportFormat)}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
