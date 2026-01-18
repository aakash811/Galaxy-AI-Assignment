"use client"

import type React from "react"

import { useWorkflowStore } from "@/stores/workflow-store"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, Type, ImageIcon, VideoIcon, BrainCircuit, Crop, Film, Sparkles } from "lucide-react"
import { useState } from "react"
import type { NodeType } from "@/types/workflow"
import { sampleWorkflow } from "@/lib/sample-workflow"

interface NodeTypeButton {
  type: NodeType
  label: string
  description: string
  icon: React.ReactNode
}

const nodeTypes: NodeTypeButton[] = [
  {
    type: "text",
    label: "Text",
    description: "Simple text input",
    icon: <Type className="h-5 w-5" />,
  },
  {
    type: "uploadImage",
    label: "Upload Image",
    description: "Upload and process images",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    type: "uploadVideo",
    label: "Upload Video",
    description: "Upload and process videos",
    icon: <VideoIcon className="h-5 w-5" />,
  },
  {
    type: "llm",
    label: "Run Any LLM",
    description: "Execute LLM with prompts",
    icon: <BrainCircuit className="h-5 w-5" />,
  },
  {
    type: "cropImage",
    label: "Crop Image",
    description: "Crop images with parameters",
    icon: <Crop className="h-5 w-5" />,
  },
  {
    type: "extractFrame",
    label: "Extract Frame",
    description: "Extract frame from video",
    icon: <Film className="h-5 w-5" />,
  },
]

export function LeftSidebar() {
  const leftSidebarOpen = useWorkflowStore((state) => state.leftSidebarOpen)
  const addNode = useWorkflowStore((state) => state.addNode)
  const loadWorkflow = useWorkflowStore((state) => state.loadWorkflow)
  const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredNodes = nodeTypes.filter(
    (node) =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddNode = (type: NodeType) => {
    // Add node at center of viewport with some randomness
    const position = {
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
    }
    addNode(type, position)
  }

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const handleLoadSampleWorkflow = () => {
    loadWorkflow({
      nodes: sampleWorkflow.nodes,
      edges: sampleWorkflow.edges,
      viewport: sampleWorkflow.viewport,
    })
    setWorkflowName(sampleWorkflow.name)
  }

  if (!leftSidebarOpen) return null

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 bg-input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Sample Workflow Button */}
      <div className="px-4 pb-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 hover:text-primary bg-transparent"
          onClick={handleLoadSampleWorkflow}
        >
          <Sparkles className="h-4 w-4" />
          Load Sample Workflow
        </Button>
      </div>

      {/* Quick Access Section */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick Access</h3>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {filteredNodes.map((node) => (
            <button
              key={node.type}
              draggable
              onDragStart={(e) => handleDragStart(e, node.type)}
              onClick={() => handleAddNode(node.type)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                "bg-transparent hover:bg-sidebar-accent",
                "transition-colors duration-150",
                "cursor-grab active:cursor-grabbing",
                "group",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md",
                  "bg-secondary text-muted-foreground",
                  "group-hover:bg-primary/20 group-hover:text-primary",
                  "transition-colors duration-150",
                )}
              >
                {node.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{node.label}</p>
                <p className="text-xs text-muted-foreground truncate">{node.description}</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground text-center">Drag or click to add nodes</p>
      </div>
    </aside>
  )
}
