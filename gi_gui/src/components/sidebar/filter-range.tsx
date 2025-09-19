import * as React from "react"

import { ChevronDownIcon, 
 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"


export function FilterRange() {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)

  return ( 

        <Tabs defaultValue="date" >
          <TabsList className="inline-grid grid-cols-2 w-full h-7 p-0 bg-transparent">
            <TabsTrigger value="date" className="h-7 px-2 py-0 text-[11px] rounded-sm
                 data-[state=active]:bg-muted data-[state=active]:text-foreground
                 data-[state=active]:shadow-none">Data</TabsTrigger>
            <TabsTrigger value="commit" className="h-7 px-2 py-0 text-[11px] rounded-sm
                 data-[state=active]:bg-muted data-[state=active]:text-foreground
                 data-[state=active]:shadow-none">Commits</TabsTrigger>
          </TabsList>
          
        <TabsContent value="date" className="mt-1 p-0">
        <div className="flex gap-0 justify-center">
        <div className="flex flex-col mx-2 my-0">
            <Label className="text-[9px]">
            Start
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                id="date-picker"
                className="text-[10px] w-20 h-8 text-gray-800"
                >
                {date ? date.toLocaleDateString() : "01-07-25"}
                <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={(date) => {
                    setDate(date)
                    setOpen(false)
                }}
                />
            </PopoverContent>
            </Popover>
        </div>

                <div className="flex flex-col mx-2 my-0">
            <Label className="text-[9px]">

            End
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                id="date-picker"
                className="text-[10px] w-20 h-8"
                >
                {date ? date.toLocaleDateString() : "02-09-25"}
                <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={(date) => {
                    setDate(date)
                    setOpen(false)
                }}
                />
            </PopoverContent>
            </Popover>
        </div>
      
        </div>
        </TabsContent>
     
        
        <TabsContent value="commit" className="mt-1 p-0">
        <div className="flex gap-0 justify-center">

        <div className="flex flex-col mx-2 my-0">
            <Label className="text-[9px]">
            Start
            </Label>
            <Button
                variant="outline"

                className="text-[10px] w-20 h-8"
                >
                5f799d5 
                <ChevronDownIcon />
                    
                </Button>

            
        </div>

                <div className="flex flex-col mx-2 my-0">
            <Label className="text-[9px]">
            End
            </Label>
            <Button
                variant="outline"

                className="text-[10px] w-20 h-8"
                >
                4d289m5
                <ChevronDownIcon />
                    
                </Button>
        </div>

        </div>
        </TabsContent>
        </Tabs>

  )
}
