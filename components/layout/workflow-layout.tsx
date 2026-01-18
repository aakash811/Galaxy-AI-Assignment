"use client"

import type React from "react"
import { useWorkflowStore } from "@/stores/workflow-store"
import { LeftSidebar } from "./left-sidebar"
import { RightSidebar } from "./right-sidebar"
import { TopBar } from "./top-bar"
import { cn } from "@/lib/utils"

interface WorkflowLayoutProps {
  children: React.ReactNode
}

export function WorkflowLayout({ children }: WorkflowLayoutProps) {
  const leftSidebarOpen = useWorkflowStore((state) => state.leftSidebarOpen)
  const rightSidebarOpen = useWorkflowStore((state) => state.rightSidebarOpen)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main
          className={cn(
            "flex-1 overflow-hidden transition-all duration-300",
            leftSidebarOpen ? "ml-0" : "ml-0",
            rightSidebarOpen ? "mr-0" : "mr-0",
          )}
        >
          {children}
        </main>
        <RightSidebar />
      </div>
    </div>
  )
}
