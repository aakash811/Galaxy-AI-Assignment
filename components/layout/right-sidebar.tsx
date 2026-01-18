"use client"

import type React from "react"

import { useWorkflowStore } from "@/stores/workflow-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { History, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react"
import { useState } from "react"
import type { RunStatus, WorkflowRun, NodeExecution } from "@/types/workflow"
import { Button } from "@/components/ui/button"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusConfig: Record<RunStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "bg-muted text-muted-foreground",
    label: "Pending",
  },
  running: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    color: "bg-primary/20 text-primary",
    label: "Running",
  },
  success: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "bg-success/20 text-success",
    label: "Success",
  },
  failed: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "bg-error/20 text-error",
    label: "Failed",
  },
  partial: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "bg-warning/20 text-warning",
    label: "Partial",
  },
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()

  if (isToday) {
    return "Today"
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  }

  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

interface RunEntryProps {
  run: WorkflowRun
  isExpanded: boolean
  onToggle: () => void
}

function RunEntry({ run, isExpanded, onToggle }: RunEntryProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Run header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("gap-1", statusConfig[run.status].color)}>
            {statusConfig[run.status].icon}
            {statusConfig[run.status].label}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {run.scope}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTime(run.startedAt)}</span>
          <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
        </div>
      </button>

      {/* Run details */}
      {isExpanded && (
        <div className="border-t border-border bg-background/50 p-3 space-y-3">
          {/* Duration */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Duration</span>
            <span className="text-foreground">{run.durationMs ? formatDuration(run.durationMs) : "-"}</span>
          </div>

          {/* Error message */}
          {run.errorMessage && <div className="rounded bg-error/10 p-2 text-xs text-error">{run.errorMessage}</div>}

          {/* Node executions */}
          {run.nodeExecutions && run.nodeExecutions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Node Executions</p>
              <div className="space-y-1">
                {run.nodeExecutions.map((execution: NodeExecution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between rounded bg-secondary/50 px-2 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("h-2 w-2 rounded-full", {
                          "bg-success": execution.status === "success",
                          "bg-error": execution.status === "failed",
                          "bg-warning": execution.status === "partial",
                          "bg-muted-foreground": execution.status === "pending",
                          "bg-primary animate-pulse": execution.status === "running",
                        })}
                      />
                      <span className="capitalize">{execution.nodeType}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {execution.durationMs ? formatDuration(execution.durationMs) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function RightSidebar() {
  const rightSidebarOpen = useWorkflowStore((state) => state.rightSidebarOpen)
  const workflowId = useWorkflowStore((state) => state.workflowId)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  // Fetch workflow runs
  const {
    data: runsData,
    isLoading,
    mutate,
  } = useSWR(workflowId ? `/api/workflows/${workflowId}` : null, fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds for running workflows
  })

  const runs: WorkflowRun[] = runsData?.data?.workflowRuns || []

  // Group runs by date
  const groupedRuns = runs.reduce(
    (acc, run) => {
      const dateKey = formatDate(run.startedAt)
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(run)
      return acc
    },
    {} as Record<string, WorkflowRun[]>,
  )

  if (!rightSidebarOpen) return null

  return (
    <aside className="flex h-full w-72 flex-col border-l border-sidebar-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Workflow History</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => mutate()} className="h-7 w-7" disabled={isLoading}>
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {!workflowId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No workflow selected</p>
              <p className="text-xs text-muted-foreground/70">Create or open a workflow</p>
            </div>
          ) : isLoading && runs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No runs yet</p>
              <p className="text-xs text-muted-foreground/70">Run your workflow to see history</p>
            </div>
          ) : (
            Object.entries(groupedRuns).map(([date, dateRuns]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground px-1">{date}</h3>
                <div className="space-y-1">
                  {dateRuns.map((run) => (
                    <RunEntry
                      key={run.id}
                      run={run}
                      isExpanded={expandedRun === run.id}
                      onToggle={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
