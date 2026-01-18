"use client"

import type React from "react"

import { useWorkflowStore } from "@/stores/workflow-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Play,
  Save,
  Undo2,
  Redo2,
  Download,
  Upload,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
} from "lucide-react"
import { useState, useRef } from "react"
import { UserButton, useUser } from "@clerk/nextjs"

export function TopBar() {
  const { user, isLoaded } = useUser()
  const {
    workflowId,
    workflowName,
    setWorkflowName,
    isSaved,
    setIsSaved,
    leftSidebarOpen,
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    undo,
    redo,
    history,
    historyIndex,
    nodes,
    edges,
    viewport,
    getWorkflowData,
    loadWorkflow,
  } = useWorkflowStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(workflowName)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1
  const hasNodes = nodes.length > 0

  const handleNameSubmit = () => {
    if (editName.trim()) {
      setWorkflowName(editName.trim())
    } else {
      setEditName(workflowName)
    }
    setIsEditing(false)
  }

  const handleRunWorkflow = async () => {
    if (!hasNodes || isRunning || !workflowId) return
    setIsRunning(true)

    try {
      const response = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const result = await response.json()
      if (!result.success) {
        console.error("Failed to run workflow:", result.error)
      }
    } catch (error) {
      console.error("Failed to run workflow:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSaveWorkflow = async () => {
    setIsSaving(true)

    try {
      const method = workflowId ? "PATCH" : "POST"
      const url = workflowId ? `/api/workflows/${workflowId}` : "/api/workflows"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          nodes,
          edges,
          viewport,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setIsSaved(true)
        if (!workflowId && result.data?.id) {
          useWorkflowStore.getState().setWorkflowId(result.data.id)
        }
      }
    } catch (error) {
      console.error("Failed to save workflow:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    const data = getWorkflowData()
    const exportData = {
      ...data,
      name: workflowName,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, "-").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.nodes && data.edges) {
          loadWorkflow({
            nodes: data.nodes,
            edges: data.edges,
            viewport: data.viewport,
          })
          if (data.name) {
            setWorkflowName(data.name)
          }
        }
      } catch (error) {
        console.error("Failed to import workflow:", error)
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4">
      {/* Left section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {leftSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">W</span>
          </div>
          <span className="text-sm font-semibold text-foreground">Weavy</span>
        </div>

        <div className="mx-2 h-6 w-px bg-border" />

        {/* Workflow name */}
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
            className="h-8 w-48 bg-input text-sm"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditName(workflowName)
              setIsEditing(true)
            }}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-foreground hover:bg-secondary"
          >
            {workflowName}
            {!isSaved && <span className="text-xs text-muted-foreground">*</span>}
          </button>
        )}
      </div>

      {/* Center section - Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={!canUndo}
          className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={!canRedo}
          className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveWorkflow}
          disabled={isSaved || isSaving}
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>

        <Button
          onClick={handleRunWorkflow}
          disabled={!hasNodes || isRunning}
          size="sm"
          className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Import JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete Workflow</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* User button */}
        {isLoaded && user ? (
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightSidebar}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {rightSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </header>
  )
}
