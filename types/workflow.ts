import type { Node, Edge } from "@xyflow/react"

// Node data types
export interface TextNodeData extends Record<string, unknown> {
  label?: string
  text: string
}

export interface ImageUploadNodeData extends Record<string, unknown> {
  label?: string
  imageUrl?: string
  fileName?: string
  fileSize?: number
}

export interface VideoUploadNodeData extends Record<string, unknown> {
  label?: string
  videoUrl?: string
  fileName?: string
  fileSize?: number
}

export interface LLMNodeData extends Record<string, unknown> {
  label?: string
  model: string
  systemPrompt: string
  userMessage: string
  images: string[]
  result?: string
  runId?: string
  isRunning?: boolean
}

export interface CropImageNodeData extends Record<string, unknown> {
  label?: string
  imageUrl?: string
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  resultUrl?: string
  isRunning?: boolean
}

export interface ExtractFrameNodeData extends Record<string, unknown> {
  label?: string
  videoUrl?: string
  timestamp: number | string
  resultUrl?: string
  isRunning?: boolean
}

// Union type for all node data
export type NodeData =
  | TextNodeData
  | ImageUploadNodeData
  | VideoUploadNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData

// Custom node types
export type TextNode = Node<TextNodeData, "text">
export type ImageUploadNode = Node<ImageUploadNodeData, "uploadImage">
export type VideoUploadNode = Node<VideoUploadNodeData, "uploadVideo">
export type LLMNode = Node<LLMNodeData, "llm">
export type CropImageNode = Node<CropImageNodeData, "cropImage">
export type ExtractFrameNode = Node<ExtractFrameNodeData, "extractFrame">

// export type WorkflowNode = TextNode | ImageUploadNode | VideoUploadNode | LLMNode | CropImageNode | ExtractFrameNode

export type WorkflowEdge = Edge

// Node type enum
export type NodeType = "text" | "uploadImage" | "uploadVideo" | "llm" | "cropImage" | "extractFrame"

export interface NodeDataMap {
  text: TextNodeData
  uploadImage: ImageUploadNodeData
  uploadVideo: VideoUploadNodeData
  llm: LLMNodeData
  cropImage: CropImageNodeData
  extractFrame: ExtractFrameNodeData
}

export type WorkflowNode = {
  [K in NodeType]: Node<NodeDataMap[K], K>
}[NodeType]

// Connection type constraints
export interface ConnectionConstraint {
  sourceTypes: NodeType[]
  targetHandle: string
}

// Handle types
export type HandleType = "text" | "image" | "video"

// Workflow run status
export type RunStatus = "pending" | "running" | "success" | "failed" | "partial"

// Workflow run scope
export type RunScope = "full" | "partial" | "single"

// Workflow run entry
export interface WorkflowRun {
  id: string
  workflowId: string
  status: RunStatus
  scope: RunScope
  startedAt: Date
  completedAt?: Date
  durationMs?: number
  errorMessage?: string
  nodeExecutions?: NodeExecution[]
}

// Node execution entry
export interface NodeExecution {
  id: string
  runId: string
  nodeId: string
  nodeType: string
  status: RunStatus
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  startedAt?: Date
  completedAt?: Date
  durationMs?: number
  errorMessage?: string
}

// Workflow state for Zustand store
export interface WorkflowState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport: { x: number; y: number; zoom: number }
  selectedNodes: string[]
  runningNodes: Set<string>
  history: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }[]
  historyIndex: number
}

// Supported Gemini models
export const GEMINI_MODELS = [
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Fast and efficient" },
  { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B", description: "Lightweight model" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Best for complex tasks" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash (Exp)", description: "Latest experimental" },
] as const

export const GROQ_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    name: "LLaMA 3.3 70B (Text)",
    description: "High-quality text generation",
    supportsVision: false,
  },
  {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    name: "llama-4-scout-17b-16e-instruct (Vision)",
    description: "Text + image understanding",
    supportsVision: true,
  },
]

export type GeminiModel = (typeof GEMINI_MODELS)[number]["id"]
