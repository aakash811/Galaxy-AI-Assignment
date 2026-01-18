"use client"

import type React from "react"

import { useCallback, useRef } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useWorkflowStore } from "@/stores/workflow-store"
import type { NodeType, WorkflowNode } from "@/types/workflow"

// Node type components (placeholders for now)
import { TextNode } from "@/components/nodes/text-node"
import { ImageUploadNode } from "@/components/nodes/image-upload-node"
import { VideoUploadNode } from "@/components/nodes/video-upload-node"
import { LLMNode } from "@/components/nodes/llm-node"
import { CropImageNode } from "@/components/nodes/crop-image-node"
import { ExtractFrameNode } from "@/components/nodes/extract-frame-node"

// Define custom node types
const nodeTypes = {
  text: TextNode,
  uploadImage: ImageUploadNode,
  uploadVideo: VideoUploadNode,
  llm: LLMNode,
  cropImage: CropImageNode,
  extractFrame: ExtractFrameNode,
}

function WorkflowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useRef<ReactFlowInstance<WorkflowNode> | null>(null)

  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange)
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange)
  const onConnect = useWorkflowStore((state) => state.onConnect)
  const addNode = useWorkflowStore((state) => state.addNode)
  const setSelectedNodes = useWorkflowStore((state) => state.setSelectedNodes)
  const deleteSelectedNodes = useWorkflowStore((state) => state.deleteSelectedNodes)
  const setViewport = useWorkflowStore((state) => state.setViewport)

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow") as NodeType
      if (!type || !reactFlowWrapper.current || !reactFlowInstance.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      addNode(type, position)
    },
    [addNode],
  )

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: WorkflowNode[] }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id))
    },
    [setSelectedNodes],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelectedNodes()
      }
    },
    [deleteSelectedNodes],
  )

  return (
    <div ref={reactFlowWrapper} className="h-full w-full" onKeyDown={onKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as OnNodesChange<WorkflowNode>}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onConnect={onConnect as OnConnect}
        onInit={(instance) => {
          reactFlowInstance.current = instance as ReactFlowInstance<WorkflowNode>
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelectionChange={onSelectionChange}
        onMoveEnd={(_, viewport) => setViewport(viewport)}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "oklch(0.65 0.25 285)", strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: "oklch(0.65 0.25 285)", strokeWidth: 2 }}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionMode={"partial" as any}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="oklch(0.25 0.02 285)" />
        <Controls className="bg-card! border-border! rounded-lg! overflow-hidden [&>button]:bg-card! [&>button]:border-border! [&>button]:text-foreground! [&>button:hover]:bg-secondary!" />
        <MiniMap
          className="bg-card! border-border!"
          nodeColor="oklch(0.65 0.25 285)"
          maskColor="oklch(0.11 0.01 285 / 0.8)"
        />
      </ReactFlow>
    </div>
  )
}

export function WorkflowCanvas() {
  return <WorkflowCanvasInner />
}
