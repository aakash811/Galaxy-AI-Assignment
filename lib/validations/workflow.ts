import { z } from "zod"

// Node position schema
export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

// Base node data schema
export const baseNodeDataSchema = z.object({
  label: z.string().optional(),
})

// Text node data
export const textNodeDataSchema = baseNodeDataSchema.extend({
  text: z.string().default(""),
})

// Image upload node data
export const imageUploadNodeDataSchema = baseNodeDataSchema.extend({
  imageUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
})

// Video upload node data
export const videoUploadNodeDataSchema = baseNodeDataSchema.extend({
  videoUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
})

// LLM node data
export const llmNodeDataSchema = baseNodeDataSchema.extend({
  model: z.string().default("llama-3.3-70b-versatile"),
  systemPrompt: z.string().default(""),
  userMessage: z.string().default(""),
  images: z.array(z.string().url()).default([]),
  result: z.string().optional(),
})

// Crop image node data
export const cropImageNodeDataSchema = baseNodeDataSchema.extend({
  imageUrl: z.string().url().optional(),
  xPercent: z.number().min(0).max(100).default(0),
  yPercent: z.number().min(0).max(100).default(0),
  widthPercent: z.number().min(0).max(100).default(100),
  heightPercent: z.number().min(0).max(100).default(100),
  resultUrl: z.string().url().optional(),
})

// Extract frame node data
export const extractFrameNodeDataSchema = baseNodeDataSchema.extend({
  videoUrl: z.string().url().optional(),
  timestamp: z.union([z.number(), z.string()]).default(0),
  resultUrl: z.string().url().optional(),
})

// Node types enum
export const nodeTypeSchema = z.enum(["text", "uploadImage", "uploadVideo", "llm", "cropImage", "extractFrame"])

// Generic node schema
export const nodeSchema = z.object({
  id: z.string(),
  type: nodeTypeSchema,
  position: positionSchema,
  data: z.union([
    textNodeDataSchema,
    imageUploadNodeDataSchema,
    videoUploadNodeDataSchema,
    llmNodeDataSchema,
    cropImageNodeDataSchema,
    extractFrameNodeDataSchema,
  ]),
})

// Edge schema
export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  animated: z.boolean().default(true),
})

// Viewport schema
export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
})

// Workflow schema
export const workflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  viewport: viewportSchema.optional(),
})

// Create workflow input
export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255).default("Untitled Workflow"),
  description: z.string().optional(),
})

// Update workflow input
export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
  viewport: viewportSchema.optional(),
})

// Workflow run input
export const runWorkflowSchema = z.object({
  workflowId: z.string(),
  nodeIds: z.array(z.string()).optional(), // If empty, run entire workflow
})

// Export/Import schema
export const workflowExportSchema = workflowSchema.extend({
  exportedAt: z.string().datetime(),
  version: z.string().default("1.0.0"),
})

export type Position = z.infer<typeof positionSchema>
export type NodeType = z.infer<typeof nodeTypeSchema>
export type TextNodeData = z.infer<typeof textNodeDataSchema>
export type ImageUploadNodeData = z.infer<typeof imageUploadNodeDataSchema>
export type VideoUploadNodeData = z.infer<typeof videoUploadNodeDataSchema>
export type LLMNodeData = z.infer<typeof llmNodeDataSchema>
export type CropImageNodeData = z.infer<typeof cropImageNodeDataSchema>
export type ExtractFrameNodeData = z.infer<typeof extractFrameNodeDataSchema>
export type WorkflowNode = z.infer<typeof nodeSchema>
export type WorkflowEdge = z.infer<typeof edgeSchema>
export type Viewport = z.infer<typeof viewportSchema>
export type Workflow = z.infer<typeof workflowSchema>
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>
export type RunWorkflowInput = z.infer<typeof runWorkflowSchema>
export type WorkflowExport = z.infer<typeof workflowExportSchema>
