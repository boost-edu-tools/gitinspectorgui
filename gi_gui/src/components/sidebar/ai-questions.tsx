import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Bot } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function AiQuestions() {
    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>AI Review Assistance</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>         
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant = "secondary"
                            className="w-full justify-start"
                            aria-label="Start a new analysis"
                            >
                            <Bot className="mr-2 h-4 w-4" />
                            Generate questions
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Settings for AI Question Generation</AlertDialogTitle>
                                <AlertDialogDescription> Number of questions (optional, default = 3)</AlertDialogDescription>
                                    <Input  placeholder={"5"}/>
                                <AlertDialogDescription> Only include work of specific authors (optional) </AlertDialogDescription>
                                    <Input  placeholder={"author1, author2"}/>
                                <AlertDialogDescription> Exclude files (optional) </AlertDialogDescription>
                                    <Input  placeholder={".gitignore, .vscode"}/>
                                <AlertDialogDescription> Specific topic (optional) </AlertDialogDescription>
                                    <Input  placeholder={"Project structure"}/>
                                <AlertDialogDescription> Difficulty level, ranging from 1-3 (optional) </AlertDialogDescription>
                                    <Input  placeholder={"2"}/>
                                

                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction>Generate</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </SidebarMenuItem>
                    </ SidebarMenu>
        </SidebarGroup>
    )
}