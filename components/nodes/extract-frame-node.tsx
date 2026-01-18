"use client"

import { useState, useMemo } from "react"
import type { NodeProps } from "@xyflow/react"
import { useEdges } from "@xyflow/react"
import { BaseNode } from "./base-node"
import { NodeHandle } from "./node-handle"
import { useWorkflowStore } from "@/stores/workflow-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Film, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExtractFrameNodeData } from "@/types/workflow"
import { runExtractFrameNode } from "@/app/actions/run-extract-frame"
import { pollTriggerRun } from "@/lib/trigger-poll"

type ExtractFrameNodeProps = NodeProps & {
  data: ExtractFrameNodeData
}

export function ExtractFrameNode({ id, data }: ExtractFrameNodeProps) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const setNodeRunning = useWorkflowStore((state) => state.setNodeRunning)
  const edges = useEdges()
  const [isRunning, setIsRunning] = useState(false)

  // Check which handles have connections
  const connectedHandles = useMemo(() => {
    const connected = new Set<string>()
    edges.forEach((edge) => {
      if (edge.target === id && edge.targetHandle) {
        connected.add(edge.targetHandle)
      }
    })
    return connected
  }, [edges, id])

  const hasVideoConnection = connectedHandles.has("video_url")
  const hasTimestampConnection = connectedHandles.has("timestamp")

  const resolveVideoInput = (): string => {
    const edge = edges.find(
      (e) => e.target === id && e.targetHandle === "video_url"
    )

    if (!edge) return data?.videoUrl ?? ""

    const sourceNode = useWorkflowStore
      .getState()
      .nodes.find((n) => n.id === edge.source)

    const sourceData = sourceNode?.data as any

    return (
      sourceData?.videoUrl ??
      sourceData?.url ??
      ""
    )
  }

  const handleRun = async () => {
    setIsRunning(true)
    setNodeRunning(id, true)

    try {
      const videoUrl = resolveVideoInput()
      console.log("EXTRACT FRAME NODE RECEIVED:", videoUrl)

      if (!videoUrl) {
        throw new Error("No video URL provided")
      }

      if (videoUrl.startsWith("blob:")) {
        throw new Error("Blob URLs are not supported")
      }

      const { runId } = await runExtractFrameNode({
        videoUrl,
        timestamp: data.timestamp ?? 0,
      })

      updateNodeData(id, {
        resultUrl: "Extracting frame, please wait...",
        runId,
      })

      const resultUrl = await pollTriggerRun(runId)

      updateNodeData(id, {
        resultUrl,
      })
    } catch (error) {
      console.error("Frame extraction failed:", error)
      updateNodeData(id, {
        resultUrl: "❌ Frame extraction failed",
      })
    } finally {
      setIsRunning(false)
      setNodeRunning(id, false)
    }
  }


  return (
    <BaseNode
      id={id}
      type="extractFrame"
      title="Extract Frame"
      icon={<Film className="h-4 w-4" />}
      isRunning={isRunning}
      onRun={handleRun}
      canRun={!!data?.videoUrl || hasVideoConnection}
    >
      <div className="space-y-3">
        {/* Video input */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Video URL</Label>
          <NodeHandle id="video_url" handleType="target" dataType="video" isConnected={hasVideoConnection} />
        </div>

        {/* Timestamp input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Timestamp</Label>
            <NodeHandle id="timestamp" handleType="target" dataType="text" isConnected={hasTimestampConnection} />
          </div>
          <Input
            type="text"
            value={data?.timestamp ?? 0}
            onChange={(e) => {
              const value = e.target.value
              const numValue = Number(value)
              updateNodeData(id, {
                timestamp: isNaN(numValue) ? value : numValue,
              })
            }}
            placeholder="0 or 50%"
            className={cn("h-8 bg-input text-sm nodrag", hasTimestampConnection && "opacity-50 cursor-not-allowed")}
            disabled={hasTimestampConnection}
          />
          <p className="text-xs text-muted-foreground">Seconds or percentage (e.g., "50%")</p>
        </div>

        {/* Result preview */}
        {data?.resultUrl && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Extracted Frame</Label>
            <img
              src={data.resultUrl || "/placeholder.svg"}
              alt="Extracted frame"
              className="w-full h-32 object-cover rounded-lg border border-border"
            />
          </div>
        )}

        {/* Running indicator */}
        {isRunning && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Extracting...</span>
          </div>
        )}

        {/* Output handle */}
        <div className="flex justify-end pt-2">
          <NodeHandle id="output" handleType="source" dataType="image" label="frame" />
        </div>
      </div>
    </BaseNode>
  )
}
