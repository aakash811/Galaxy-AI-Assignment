"use client"

import { useState, useMemo, useEffect } from "react"
import type { NodeProps } from "@xyflow/react"
import { useEdges } from "@xyflow/react"
import { BaseNode } from "./base-node"
import { NodeHandle } from "./node-handle"
import { useWorkflowStore } from "@/stores/workflow-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BrainCircuit, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LLMNodeData } from "@/types/workflow"
import { runLLMNode } from "@/app/actions/run-llm"
import { pollTriggerRun } from "@/lib/trigger-poll"

// Move model definitions outside component to prevent recreation on each render
const LLM_MODELS = [
  {
    label: "Gemini Flash 2.0",
    description: "Fast, low-latency responses",
    value: "llama-3.1-8b-instant",
  },
  {
    label: "Gemini Flash Pro 2.0",
    description: "Higher quality with good speed",
    value: "llama-3.1-70b-versatile",
  },
  {
    label: "Gemini Pro 2.0",
    description: "Best quality for complex tasks",
    value: "mixtral-8x7b-32768",
  },
]

type LLMNodeProps = NodeProps & {
  data: LLMNodeData
}

export function LLMNode({ id, data }: LLMNodeProps) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const setNodeRunning = useWorkflowStore((state) => state.setNodeRunning)
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useEdges()
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!data.model) {
      updateNodeData(id, {
        model: LLM_MODELS[0].value, // Default: Llama 3.1 8B
      })
    }
  }, [data.model, id, updateNodeData])

  /* -------------------------------------------------------
   * Detect connected handles
   * ----------------------------------------------------- */
  const connectedHandles = useMemo(() => {
    const set = new Set<string>()
    edges.forEach((edge) => {
      if (edge.target === id && edge.targetHandle) {
        set.add(edge.targetHandle)
      }
    })
    return set
  }, [edges, id])

  const hasSystemPromptConnection = connectedHandles.has("system_prompt")
  const hasUserMessageConnection = connectedHandles.has("user_message")
  const hasImagesConnection = connectedHandles.has("images")

  const isTextNode = (
    node: { data?: unknown }
  ): node is { data: { text: string } } => {
    return typeof (node as any)?.data?.text === "string"
  }

  /* -------------------------------------------------------
   * Resolve inputs from connected nodes
   * ----------------------------------------------------- */
  const resolveTextInput = (handleId: string): string => {
    const edge = edges.find(
      (e) => e.target === id && e.targetHandle === handleId
    )
    if (!edge) return ""

    const sourceNode = nodes.find((n) => n.id === edge.source)
    if (!sourceNode || !isTextNode(sourceNode)) return ""

    return sourceNode.data.text
  }

  const resolveImagesToBase64 = async (): Promise<string[]> => {
    const imageUrls = edges
      .filter((e) => e.target === id && e.targetHandle === "images")
      .map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source)
        return sourceNode?.data?.imageUrl
      })
      .filter(Boolean) as string[]

    return Promise.all(
      imageUrls.map(async (url) => {
        const res = await fetch(url)
        const blob = await res.blob()

        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      })
    )
  }

  /* -------------------------------------------------------
   * Run LLM
   * ----------------------------------------------------- */
  const handleRun = async () => {
    const resolvedSystemPrompt = hasSystemPromptConnection
      ? resolveTextInput("system_prompt")
      : data.systemPrompt ?? ""

    const resolvedUserMessage = hasUserMessageConnection
      ? resolveTextInput("user_message")
      : data.userMessage ?? ""

    const resolvedImages = hasImagesConnection ? await resolveImagesToBase64() : []

    if (!resolvedUserMessage.trim()) {
      updateNodeData(id, {
        result: "⚠️ Please provide a user message or connect a Text node.",
      })
      return
    }

    setIsRunning(true)
    setNodeRunning(id, true)

    try {
      const { runId } = await runLLMNode({
        model: data.model,
        systemPrompt: resolvedSystemPrompt,
        userMessage: resolvedUserMessage,
        images: resolvedImages,
      })

      updateNodeData(id, {
        result: "Running LLM, please wait...",
        runId,
      })

      const result = await pollTriggerRun(runId)
      console.log("LLM run completed with result:", result)
      updateNodeData(id, {
        result,
      })
    } catch (err) {
      console.error("LLM execution failed:", err)
      updateNodeData(id, {
        result: "❌ Failed to run LLM. Check server logs.",
      })
    } finally {
      setIsRunning(false)
      setNodeRunning(id, false)
    }
  }

  /* -------------------------------------------------------
   * UI
   * ----------------------------------------------------- */
  return (
    <BaseNode
      id={id}
      type="llm"
      title="Run Any LLM"
      icon={<BrainCircuit className="h-4 w-4" />}
      isRunning={isRunning}
      onRun={handleRun}
      canRun
    >
      <div className="space-y-3">
        {/* Model selector */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <Select
            value={data.model}
            onValueChange={(value) => updateNodeData(id, { model: value })}
          >
            <SelectTrigger className="h-8 bg-input text-sm nodrag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LLM_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex flex-col">
                    <span>{model.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* System prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              System Prompt
            </Label>
            <NodeHandle
              id="system_prompt"
              handleType="target"
              dataType="text"
              isConnected={hasSystemPromptConnection}
            />
          </div>
          <Textarea
            value={data.systemPrompt || ""}
            onChange={(e) =>
              updateNodeData(id, { systemPrompt: e.target.value })
            }
            disabled={hasSystemPromptConnection}
            className={cn(
              "min-h-15 resize-none bg-input text-sm nodrag",
              hasSystemPromptConnection && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* User message */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              User Message
            </Label>
            <NodeHandle
              id="user_message"
              handleType="target"
              dataType="text"
              isConnected={hasUserMessageConnection}
            />
          </div>
          <Textarea
            value={data.userMessage || ""}
            onChange={(e) =>
              updateNodeData(id, { userMessage: e.target.value })
            }
            disabled={hasUserMessageConnection}
            className={cn(
              "min-h-20 resize-none bg-input text-sm nodrag",
              hasUserMessageConnection && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* Images */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Images (optional)
          </Label>
          <NodeHandle
            id="images"
            handleType="target"
            dataType="image"
            isConnected={hasImagesConnection}
          />
        </div>

        {/* Result */}
        {data.result && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Result</Label>
            <ScrollArea className="h-32 rounded-md border bg-secondary/50 p-2 nodrag">
              <p className="text-sm whitespace-pre-wrap">{data.result}</p>
            </ScrollArea>
          </div>
        )}

        {/* Loader */}
        {isRunning && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Running...</span>
          </div>
        )}

        {/* Output */}
        <div className="flex justify-end pt-2">
          <NodeHandle
            id="output"
            handleType="source"
            dataType="text"
            label="output"
          />
        </div>
      </div>
    </BaseNode>
  )
}