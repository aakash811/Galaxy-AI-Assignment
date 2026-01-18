"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/stores/workflow-store"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Play, Copy } from "lucide-react"

interface BaseNodeProps {
  id: string
  type: string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isRunning?: boolean
  className?: string
  onRun?: () => void
  canRun?: boolean
}

export function BaseNode({
  id,
  type,
  title,
  icon,
  children,
  isRunning,
  className,
  onRun,
  canRun = false,
}: BaseNodeProps) {
  const deleteNode = useWorkflowStore((state) => state.deleteNode)
  const runningNodes = useWorkflowStore((state) => state.runningNodes)

  const isNodeRunning = isRunning || runningNodes.has(id)

  return (
    <div
      className={cn(
        "min-w-70 max-w-[320px] rounded-xl border bg-node-bg shadow-lg",
        "transition-all duration-200",
        isNodeRunning ? "node-running border-primary" : "border-node-border hover:border-primary/50",
        className,
      )}
    >
      {/* Node header */}
      <div className="flex items-center justify-between border-b border-node-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", "bg-primary/20 text-primary")}>
            {icon}
          </div>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {canRun && onRun && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onRun()
              }}
              disabled={isNodeRunning}
              className="h-7 w-7 text-muted-foreground hover:text-primary"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(id)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteNode(id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Node content */}
      <div className="p-3">{children}</div>
    </div>
  )
}
