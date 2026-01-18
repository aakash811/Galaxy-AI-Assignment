import { task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

import { llmTask } from "./llm-task"
import { cropImageTask } from "./crop-image-task"
import { extractFrameTask } from "./extract-frame-task"

/* ----------------------------- Schemas ----------------------------- */

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "text",
    "uploadImage",
    "uploadVideo",
    "llm",
    "cropImage",
    "extractFrame",
  ]),
  data: z.record(z.unknown()),
})

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
})

const workflowExecutionInputSchema = z.object({
  workflowId: z.string(),
  runId: z.string(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  nodeIds: z.array(z.string()).optional(),
})

export type WorkflowExecutionInput = z.infer<
  typeof workflowExecutionInputSchema
>

/* ----------------------- Graph Helper Functions -------------------- */

function buildExecutionGraph(
  nodes: z.infer<typeof nodeSchema>[],
  edges: z.infer<typeof edgeSchema>[],
  targetNodeIds?: string[]
) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const dependencies = new Map<string, Set<string>>()
  const outputs = new Map<string, Record<string, unknown>>()

  nodes.forEach((node) => dependencies.set(node.id, new Set()))

  edges.forEach((edge) => {
    // Only add dependency if source node exists
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      dependencies.get(edge.target)?.add(edge.source)
    }
  })


  let nodesToExecute: Set<string>

  if (targetNodeIds?.length) {
    nodesToExecute = new Set()

    const includeWithDeps = (id: string) => {
      if (nodesToExecute.has(id)) return
      nodesToExecute.add(id)
      dependencies.get(id)?.forEach(includeWithDeps)
    }

    targetNodeIds.forEach(includeWithDeps)
  } else {
    nodesToExecute = new Set(nodes.map((n) => n.id))
  }

  return { nodeMap, dependencies, outputs, nodesToExecute }
}

function getReadyNodes(
  nodesToExecute: Set<string>,
  dependencies: Map<string, Set<string>>,
  completed: Set<string>,
  running: Set<string>
) {
  const ready: string[] = []

  nodesToExecute.forEach((id) => {
    if (completed.has(id) || running.has(id)) return

    const deps = dependencies.get(id)
    if (!deps || deps.size === 0) {
      ready.push(id)
      return
    }

    // Only consider deps that are actually executable
    const relevantDeps = [...deps].filter((d) => nodesToExecute.has(d))

    if (relevantDeps.every((d) => completed.has(d))) {
      ready.push(id)
    }
  })

  return ready
}

/* --------------------------- Task ---------------------------------- */

export const workflowExecutionTask = task({
  id: "workflow-execution",
  maxDuration: 600,

  run: async (payload: WorkflowExecutionInput) => {
    const { workflowId, runId, nodes, edges, nodeIds } =
      workflowExecutionInputSchema.parse(payload)

    const { nodeMap, dependencies, outputs, nodesToExecute } =
      buildExecutionGraph(nodes, edges, nodeIds)

    const completedNodes = new Set<string>()
    const runningNodes = new Set<string>()
    const results: Record<
      string,
      { success: boolean; output?: unknown; error?: string }
    > = {}

    while (completedNodes.size < nodesToExecute.size) {
      const readyNodes = getReadyNodes(
        nodesToExecute,
        dependencies,
        completedNodes,
        runningNodes
      )

      if (readyNodes.length === 0 && runningNodes.size === 0) {
        console.error("Execution deadlock", {
          remaining: [...nodesToExecute].filter(
            (id) => !completedNodes.has(id)
          ),
        })
        break
      }

      await Promise.all(
        readyNodes.map(async (nodeId) => {
          runningNodes.add(nodeId)
          const node = nodeMap.get(nodeId)

          if (!node) {
            completedNodes.add(nodeId)
            runningNodes.delete(nodeId)
            results[nodeId] = { success: false, error: "Node not found" }
            return
          }

          try {
            const nodeInputs: Record<string, unknown> = { ...node.data }

            edges.forEach((edge) => {
              if (
                edge.target === nodeId &&
                edge.targetHandle &&
                outputs.has(edge.source)
              ) {
                const sourceOutput = outputs.get(edge.source)
                if (sourceOutput && edge.sourceHandle) {
                  nodeInputs[edge.targetHandle] =
                    sourceOutput[edge.sourceHandle]
                }
              }
              console.log({
                completed: [...completedNodes],
                running: [...runningNodes],
                ready: readyNodes,
              })
            })

            let result: unknown

            switch (node.type) {
              case "text":
                outputs.set(nodeId, { text: nodeInputs.text ?? "" })
                result = { text: nodeInputs.text ?? "" }
                break

              case "uploadImage":
              case "uploadVideo":
                const url = nodeInputs.imageUrl || nodeInputs.videoUrl
                outputs.set(nodeId, { url })
                result = { url }
                break

              case "llm":
                const llm = await llmTask.triggerAndWait({
                  model: (nodeInputs.model as string) || "llama-3.3-70b-versatile",
                  systemPrompt: nodeInputs.systemPrompt as string,
                  userMessage: (nodeInputs.userMessage as string) || "",
                  images: nodeInputs.images as string[],
                })
                if (!llm.ok) throw new Error("LLM execution failed")
                outputs.set(nodeId, { text: llm.output?.result })
                result = llm.output
                break

              case "cropImage":
                const crop = await cropImageTask.triggerAndWait({
                  imageUrl: nodeInputs.imageUrl as string,
                  xPercent: Number(nodeInputs.xPercent ?? 0),
                  yPercent: Number(nodeInputs.yPercent ?? 0),
                  widthPercent: Number(nodeInputs.widthPercent ?? 100),
                  heightPercent: Number(nodeInputs.heightPercent ?? 100),
                })
                if (!crop.ok) throw new Error("Crop failed")
                outputs.set(nodeId, { imageUrl: crop.output?.resultUrl })
                result = crop.output
                break

              case "extractFrame":
                const frame = await extractFrameTask.triggerAndWait({
                  videoUrl: nodeInputs.videoUrl as string,
                  timestamp: nodeInputs.timestamp as number | string,
                })
                if (!frame.ok) throw new Error("Frame extraction failed")
                outputs.set(nodeId, { imageUrl: frame.output?.resultUrl })
                result = frame.output
                break
            }

            results[nodeId] = { success: true, output: result }
          } catch (err) {
            results[nodeId] = {
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
            }
          } finally {
            runningNodes.delete(nodeId)
            completedNodes.add(nodeId)
          }
        })
      )
    }

    const success = Object.values(results).every((r) => r.success)

    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: success ? "success" : "failed",
        completedAt: new Date(),
      },
    })

    return {
      success,
      workflowId,
      runId,
      results,
      completedNodes: [...completedNodes],
    }
  },
})
