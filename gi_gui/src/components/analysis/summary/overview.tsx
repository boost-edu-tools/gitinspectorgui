
import { DataTable } from "@/components/analysis/summary/data-table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChevronsUpDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

    
export function Overview() {

    const [selectedFileType, setSelectedFileType] = useState("CSV");

    return (
        <div>
            <DataTable />
            <div className="mt-4 flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger>
                <Button variant="secondary">
                    {selectedFileType}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Choose file type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedFileType("HTML")}>
                    HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFileType("CSV")}>
                    CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFileType("JSON")}>
                    JSON
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="hover:bg-muted/50">
                Export
            </Button>
        </div>
    </div>
)}

