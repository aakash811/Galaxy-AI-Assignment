import type { Node, XYPosition } from "@xyflow/react"
import type { NodeDataMap, NodeType, WorkflowNode } from "@/types/workflow"

export function createWorkflowNode<T extends NodeType>(
  type: T,
  id: string,
  position: XYPosition,
  data: NodeDataMap[T]
): Extract<WorkflowNode, { type: T }> {
  return {
    id,
    type,
    position,
    data,
  } as Extract<WorkflowNode, { type: T }>
}
