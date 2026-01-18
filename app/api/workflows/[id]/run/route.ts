import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runWorkflowSchema } from "@/lib/validations/workflow"
import { getCurrentUser } from "@/lib/auth"
import { tasks } from "@trigger.dev/sdk/v3"
import type { workflowExecutionTask } from "@/trigger/workflow-task"

// POST /api/workflows/[id]/run - Execute a workflow
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { nodeIds } = runWorkflowSchema.parse({ ...body, workflowId: id })

    // Fetch the workflow and verify ownership
    const workflow = await prisma.workflow.findUnique({
      where: { id, userId: user.id },
    })

    if (!workflow) {
      return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 })
    }

    // Determine scope
    const nodes = workflow.nodes as unknown[]
    const scope = !nodeIds ? "full" : nodeIds.length === 1 ? "single" : "partial"

    // Create a workflow run record
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: id,
        userId: user.id,
        status: "running",
        scope,
      },
    })

    // Trigger the workflow execution task
    try {
     const normalizedNodeIds =
      nodeIds && nodeIds.length > 0 ? nodeIds : undefined

      const handle = await tasks.trigger<typeof workflowExecutionTask>(
        "workflow-execution",
        {
          workflowId: id,
          runId: run.id,
          nodes: workflow.nodes as [],
          edges: workflow.edges as [],
          nodeIds: normalizedNodeIds,
        }
      )

      return NextResponse.json({
        success: true,
        data: {
          runId: run.id,
          taskId: handle.id,
          status: "running",
        },
      })
    } catch {
      // If Trigger.dev is not configured, update run as failed
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          errorMessage: "Trigger.dev is not configured",
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          runId: run.id,
          status: "failed",
          error: "Trigger.dev is not configured. Please set up TRIGGER_SECRET_KEY environment variable.",
        },
      })
    }
  } catch (error) {
    console.error("Failed to run workflow:", error)
    return NextResponse.json({ success: false, error: "Failed to run workflow" }, { status: 500 })
  }
}
