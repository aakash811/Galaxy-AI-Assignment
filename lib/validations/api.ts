import { z } from "zod"

// LLM execution request
export const llmExecutionSchema = z.object({
  model: z.string(),
  systemPrompt: z.string().optional(),
  userMessage: z.string(),
  images: z.array(z.string().url()).optional(),
})

// Crop image execution request
export const cropImageExecutionSchema = z.object({
  imageUrl: z.string().url(),
  xPercent: z.number().min(0).max(100).default(0),
  yPercent: z.number().min(0).max(100).default(0),
  widthPercent: z.number().min(0).max(100).default(100),
  heightPercent: z.number().min(0).max(100).default(100),
})

// Extract frame execution request
export const extractFrameExecutionSchema = z.object({
  videoUrl: z.string().url(),
  timestamp: z.union([z.number(), z.string()]).default(0),
})

// Transloadit upload response
export const transloaditUploadSchema = z.object({
  assembly_id: z.string(),
  assembly_ssl_url: z.string().url(),
  ok: z.string(),
  results: z.record(
    z.array(
      z.object({
        url: z.string().url(),
        ssl_url: z.string().url(),
        name: z.string(),
        size: z.number(),
        mime: z.string(),
      }),
    ),
  ),
})

// API response schemas
export const apiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
})

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
})

export const apiResponseSchema = z.union([apiSuccessSchema, apiErrorSchema])

export type LLMExecutionInput = z.infer<typeof llmExecutionSchema>
export type CropImageExecutionInput = z.infer<typeof cropImageExecutionSchema>
export type ExtractFrameExecutionInput = z.infer<typeof extractFrameExecutionSchema>
export type TransloaditUploadResponse = z.infer<typeof transloaditUploadSchema>
export type APIResponse = z.infer<typeof apiResponseSchema>
