"use client"

import { useState, useMemo } from "react"
import type { NodeProps } from "@xyflow/react"
import { useEdges } from "@xyflow/react"
import { BaseNode } from "./base-node"
import { NodeHandle } from "./node-handle"
import { useWorkflowStore } from "@/stores/workflow-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Crop, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CropImageNodeData } from "@/types/workflow"
import { runCropImageNode } from "@/app/actions/run-crop-image"
import { pollTriggerRun } from "@/lib/trigger-poll"



type CropImageNodeProps = NodeProps & {
  data: CropImageNodeData
}

type ImageNodeData = {
  imageUrl?: string
  url?: string
}

const isImageNode = (
  node: { data?: unknown }
): node is { data: ImageNodeData } => {
  const data = (node as any)?.data
  return typeof data?.imageUrl === "string" || typeof data?.url === "string"
}

export function CropImageNode({ id, data }: CropImageNodeProps) {
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

  const hasImageConnection = connectedHandles.has("image_url")
  const hasXConnection = connectedHandles.has("x_percent")
  const hasYConnection = connectedHandles.has("y_percent")
  const hasWidthConnection = connectedHandles.has("width_percent")
  const hasHeightConnection = connectedHandles.has("height_percent")

  const resolveImageInput = (): string => {
    const edge = edges.find(
      (e) => e.target === id && e.targetHandle === "image_url"
    )

    if (!edge) return data?.imageUrl ?? ""

    const sourceNode = useWorkflowStore
      .getState()
      .nodes.find((n) => n.id === edge.source)

    // ✅ IMPORTANT: only HTTPS URLs
    return (
      (sourceNode?.data as any)?.imageUrl ?? ""
    )
  }
  
  const handleRun = async () => {
    setIsRunning(true)
    setNodeRunning(id, true)

    try {
      const imageUrl = resolveImageInput()
      console.log("CROP NODE RECEIVED:", imageUrl)


      if (!imageUrl) {
        throw new Error("No image URL provided")
      }

      const { runId } = await runCropImageNode({
        imageUrl,
        xPercent: data.xPercent,
        yPercent: data.yPercent,
        widthPercent: data.widthPercent,
        heightPercent: data.heightPercent,
      })

      updateNodeData(id, {
        resultUrl: "Cropping image, please wait...",
        runId,
      })

      const resultUrl = await pollTriggerRun(runId)

      updateNodeData(id, {
        resultUrl,
      })
    } catch (err) {
      console.error(err)
      updateNodeData(id, {
        resultUrl: "❌ Crop failed",
      })
    } finally {
      setIsRunning(false)
      setNodeRunning(id, false)
    }
  }


  return (
    <BaseNode
      id={id}
      type="cropImage"
      title="Crop Image"
      icon={<Crop className="h-4 w-4" />}
      isRunning={isRunning}
      onRun={handleRun}
      canRun={!!data?.imageUrl || hasImageConnection}
    >
      <div className="space-y-3">
        {/* Image input */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Image URL</Label>
          <NodeHandle id="image_url" handleType="target" dataType="image" isConnected={hasImageConnection} />
        </div>

        {/* Crop parameters */}
        <div className="grid grid-cols-2 gap-2">
          {/* X percent */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">X %</Label>
              <NodeHandle id="x_percent" handleType="target" dataType="text" isConnected={hasXConnection} />
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={data?.xPercent ?? 0}
              onChange={(e) => updateNodeData(id, { xPercent: Number(e.target.value) })}
              className={cn("h-8 bg-input text-sm nodrag", hasXConnection && "opacity-50 cursor-not-allowed")}
              disabled={hasXConnection}
            />
          </div>

          {/* Y percent */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Y %</Label>
              <NodeHandle id="y_percent" handleType="target" dataType="text" isConnected={hasYConnection} />
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={data?.yPercent ?? 0}
              onChange={(e) => updateNodeData(id, { yPercent: Number(e.target.value) })}
              className={cn("h-8 bg-input text-sm nodrag", hasYConnection && "opacity-50 cursor-not-allowed")}
              disabled={hasYConnection}
            />
          </div>

          {/* Width percent */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Width %</Label>
              <NodeHandle id="width_percent" handleType="target" dataType="text" isConnected={hasWidthConnection} />
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={data?.widthPercent ?? 100}
              onChange={(e) => updateNodeData(id, { widthPercent: Number(e.target.value) })}
              className={cn("h-8 bg-input text-sm nodrag", hasWidthConnection && "opacity-50 cursor-not-allowed")}
              disabled={hasWidthConnection}
            />
          </div>

          {/* Height percent */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Height %</Label>
              <NodeHandle id="height_percent" handleType="target" dataType="text" isConnected={hasHeightConnection} />
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={data?.heightPercent ?? 100}
              onChange={(e) => updateNodeData(id, { heightPercent: Number(e.target.value) })}
              className={cn("h-8 bg-input text-sm nodrag", hasHeightConnection && "opacity-50 cursor-not-allowed")}
              disabled={hasHeightConnection}
            />
          </div>
        </div>

        {/* Result preview */}
        {data?.resultUrl && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Result</Label>
            <img
              src={data.resultUrl || "/placeholder.svg"}
              alt="Cropped result"
              className="w-full h-32 object-cover rounded-lg border border-border"
            />
          </div>
        )}

        {/* Running indicator */}
        {isRunning && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cropping...</span>
          </div>
        )}

        {/* Output handle */}
        <div className="flex justify-end pt-2">
          <NodeHandle id="output" handleType="source" dataType="image" label="output" />
        </div>
      </div>
    </BaseNode>
  )
}
