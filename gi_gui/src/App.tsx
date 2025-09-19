"use client"

import { AppSidebar } from "@/components/sidebar/sidebar"
import { AppMainWindow } from "@/components/analysis/main-window"
import {
  SidebarProvider,
} from "@/components/ui/sidebar"

import "./App.css"

export default function App() {

  return (
    <SidebarProvider>
      <AppSidebar />
      <AppMainWindow />

    </SidebarProvider>
  )
}
