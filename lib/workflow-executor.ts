import type { WorkflowNode, WorkflowEdge } from "@/types/workflow"

interface ExecutionContext {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  outputs: Map<string, Record<string, unknown>>
  onNodeStart?: (nodeId: string) => void
  onNodeComplete?: (nodeId: string, result: unknown) => void
  onNodeError?: (nodeId: string, error: Error) => void
}

// Validate workflow is a DAG (no cycles)
export function validateDAG(nodes: WorkflowNode[], edges: WorkflowEdge[]): { valid: boolean; error?: string } {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  const adjacencyList = new Map<string, string[]>()
  nodes.forEach((node) => adjacencyList.set(node.id, []))
  edges.forEach((edge) => {
    const targets = adjacencyList.get(edge.source) || []
    targets.push(edge.target)
    adjacencyList.set(edge.source, targets)
  })

  function hasCycle(nodeId: string): boolean {
    if (!visited.has(nodeId)) {
      visited.add(nodeId)
      recursionStack.add(nodeId)

      const neighbors = adjacencyList.get(nodeId) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) {
          return true
        }
        if (recursionStack.has(neighbor)) {
          return true
        }
      }
    }
    recursionStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (hasCycle(node.id)) {
      return { valid: false, error: "Workflow contains a cycle" }
    }
  }

  return { valid: true }
}

// Get topological order for execution
export function getExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const inDegree = new Map<string, number>()
  const adjacencyList = new Map<string, string[]>()

  nodes.forEach((node) => {
    inDegree.set(node.id, 0)
    adjacencyList.set(node.id, [])
  })

  edges.forEach((edge) => {
    const targets = adjacencyList.get(edge.source) || []
    targets.push(edge.target)
    adjacencyList.set(edge.source, targets)

    const degree = inDegree.get(edge.target) || 0
    inDegree.set(edge.target, degree + 1)
  })

  const queue: string[] = []
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId)
  })

  const order: string[] = []
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    order.push(nodeId)

    const neighbors = adjacencyList.get(nodeId) || []
    for (const neighbor of neighbors) {
      const degree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, degree)
      if (degree === 0) queue.push(neighbor)
    }
  }

  return order
}

// Get input values for a node from connected sources
export function getNodeInputs(
  nodeId: string,
  edges: WorkflowEdge[],
  outputs: Map<string, Record<string, unknown>>,
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {}

  edges
    .filter((edge) => edge.target === nodeId)
    .forEach((edge) => {
      const sourceOutput = outputs.get(edge.source)
      if (sourceOutput && edge.targetHandle) {
        // Get the output from source node's handle
        const outputKey = edge.sourceHandle || "output"
        inputs[edge.targetHandle] = sourceOutput[outputKey]
      }
    })

  return inputs
}

// Check if connection is valid based on data types
export function isValidConnection(
  sourceNode: WorkflowNode,
  sourceHandle: string,
  targetNode: WorkflowNode,
  targetHandle: string,
): boolean {
  // Define output types for each node
  const outputTypes: Record<string, Record<string, "text" | "image" | "video">> = {
    text: { output: "text" },
    uploadImage: { output: "image" },
    uploadVideo: { output: "video" },
    llm: { output: "text" },
    cropImage: { output: "image" },
    extractFrame: { output: "image" },
  }

  // Define accepted input types for each handle
  const inputTypes: Record<string, Record<string, ("text" | "image" | "video")[]>> = {
    llm: {
      system_prompt: ["text"],
      user_message: ["text"],
      images: ["image"],
    },
    cropImage: {
      image_url: ["image"],
      x_percent: ["text"],
      y_percent: ["text"],
      width_percent: ["text"],
      height_percent: ["text"],
    },
    extractFrame: {
      video_url: ["video"],
      timestamp: ["text"],
    },
  }

  const sourceOutputType = outputTypes[sourceNode.type]?.[sourceHandle]
  const acceptedTypes = inputTypes[targetNode.type]?.[targetHandle]

  if (!sourceOutputType || !acceptedTypes) return true // Allow if not explicitly restricted

  return acceptedTypes.includes(sourceOutputType)
}
