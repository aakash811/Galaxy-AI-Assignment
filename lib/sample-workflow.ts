import type { WorkflowNode, WorkflowEdge } from "@/types/workflow"

// Pre-built sample workflow demonstrating all node types and features
export const sampleWorkflow = {
  name: "Sample Workflow - All Features Demo",
  description: "Demonstrates all node types, parallel execution, and input chaining",
  nodes: [
    // Text nodes for prompts
    {
      id: "text-system-prompt",
      type: "text" as const,
      position: { x: 50, y: 50 },
      data: {
        label: "System Prompt",
        text: "You are a helpful assistant that describes images in detail. Be concise but thorough.",
      },
    },
    {
      id: "text-user-message",
      type: "text" as const,
      position: { x: 50, y: 200 },
      data: {
        label: "User Message",
        text: "Describe this image and identify any objects or people in it.",
      },
    },

    // Image upload node
    {
      id: "upload-image-1",
      type: "uploadImage" as const,
      position: { x: 50, y: 350 },
      data: {
        label: "Upload Image",
      },
    },

    // Video upload node (parallel path)
    {
      id: "upload-video-1",
      type: "uploadVideo" as const,
      position: { x: 400, y: 350 },
      data: {
        label: "Upload Video",
      },
    },

    // LLM node receiving inputs
    {
      id: "llm-describe",
      type: "llm" as const,
      position: { x: 250, y: 150 },
      data: {
        label: "Describe Image",
        model: "gemini-1.5-flash",
        systemPrompt: "",
        userMessage: "",
        images: [],
      },
    },

    // Crop image node
    {
      id: "crop-image-1",
      type: "cropImage" as const,
      position: { x: 50, y: 550 },
      data: {
        label: "Crop to Center",
        xPercent: 25,
        yPercent: 25,
        widthPercent: 50,
        heightPercent: 50,
      },
    },

    // Extract frame from video
    {
      id: "extract-frame-1",
      type: "extractFrame" as const,
      position: { x: 400, y: 550 },
      data: {
        label: "Extract Middle Frame",
        timestamp: "50%",
      },
    },

    // Second LLM to process cropped image
    {
      id: "llm-cropped",
      type: "llm" as const,
      position: { x: 50, y: 750 },
      data: {
        label: "Analyze Cropped",
        model: "gemini-1.5-flash",
        systemPrompt: "",
        userMessage: "What is in the center of this image?",
        images: [],
      },
    },

    // Third LLM to process extracted frame
    {
      id: "llm-frame",
      type: "llm" as const,
      position: { x: 400, y: 750 },
      data: {
        label: "Analyze Frame",
        model: "gemini-1.5-flash",
        systemPrompt: "",
        userMessage: "Describe this video frame.",
        images: [],
      },
    },
  ] as WorkflowNode[],

  edges: [
    // System prompt -> LLM
    {
      id: "edge-system-llm",
      source: "text-system-prompt",
      target: "llm-describe",
      sourceHandle: "output",
      targetHandle: "system_prompt",
      animated: true,
    },
    // User message -> LLM
    {
      id: "edge-message-llm",
      source: "text-user-message",
      target: "llm-describe",
      sourceHandle: "output",
      targetHandle: "user_message",
      animated: true,
    },
    // Image -> LLM
    {
      id: "edge-image-llm",
      source: "upload-image-1",
      target: "llm-describe",
      sourceHandle: "output",
      targetHandle: "images",
      animated: true,
    },
    // Image -> Crop
    {
      id: "edge-image-crop",
      source: "upload-image-1",
      target: "crop-image-1",
      sourceHandle: "output",
      targetHandle: "image_url",
      animated: true,
    },
    // Video -> Extract Frame
    {
      id: "edge-video-frame",
      source: "upload-video-1",
      target: "extract-frame-1",
      sourceHandle: "output",
      targetHandle: "video_url",
      animated: true,
    },
    // Cropped -> Second LLM
    {
      id: "edge-crop-llm",
      source: "crop-image-1",
      target: "llm-cropped",
      sourceHandle: "output",
      targetHandle: "images",
      animated: true,
    },
    // Extracted frame -> Third LLM
    {
      id: "edge-frame-llm",
      source: "extract-frame-1",
      target: "llm-frame",
      sourceHandle: "output",
      targetHandle: "images",
      animated: true,
    },
  ] as WorkflowEdge[],

  viewport: { x: 0, y: 0, zoom: 0.75 },
}

export function getSampleWorkflowNodes(): WorkflowNode[] {
  return sampleWorkflow.nodes
}

export function getSampleWorkflowEdges(): WorkflowEdge[] {
  return sampleWorkflow.edges
}
