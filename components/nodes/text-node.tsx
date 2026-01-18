"use client"

import type React from "react"
import type { NodeProps } from "@xyflow/react"
import { BaseNode } from "./base-node"
import { NodeHandle } from "./node-handle"
import { Textarea } from "@/components/ui/textarea"
import { useWorkflowStore } from "@/stores/workflow-store"
import { Type } from "lucide-react"
import type { TextNodeData } from "@/types/workflow"

type TextNodeProps = NodeProps & {
  data: TextNodeData
}

export function TextNode({ id, data }: TextNodeProps) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { text: e.target.value })
  }

  return (
    <BaseNode id={id} type="text" title="Text" icon={<Type className="h-4 w-4" />}>
      <div className="space-y-3">
        <Textarea
          value={data?.text || ""}
          onChange={handleTextChange}
          placeholder="Enter text..."
          className="min-h-20 resize-none bg-input text-sm nodrag"
        />

        {/* Output handle */}
        <div className="flex justify-end pt-2">
          <NodeHandle id="output" handleType="source" dataType="text" label="text" />
        </div>
      </div>
    </BaseNode>
  )
}
