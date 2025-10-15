import {Plus, Folder} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export function DataImport() {

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Data import</SidebarGroupLabel>
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
                  <Plus className="mr-2 h-3 w-3" />
                  New analysis
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Analysis Settings</AlertDialogTitle>
                <AlertDialogDescription> Set Path to Folder with Git Repo(s)</AlertDialogDescription>
                <Input  placeholder={"C:/path/to/repo"}/>
                <AlertDialogDescription> Search depth (optional, default=5) </AlertDialogDescription>
                <Input placeholder="5"/>
                <AlertDialogDescription> File extensions to exclude (optional) </AlertDialogDescription>
                <Input placeholder="*.test, *.min.js"/>
                <AlertDialogDescription> File types to include (optional)</AlertDialogDescription>
                <Input placeholder="*.py, *.js"/>

              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Save</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <div className="min-w-0 px-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
            <Folder className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                /home/user/projects
              </span>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
