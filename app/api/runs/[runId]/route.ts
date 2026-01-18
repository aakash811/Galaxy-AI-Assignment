import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/runs/[runId] - Get workflow run status
export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params

    const run = await prisma.workflowRun.findUnique({
      where: { id: runId },
      include: {
        nodeExecutions: true,
      },
    })

    if (!run) {
      return NextResponse.json({ success: false, error: "Run not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: run })
  } catch (error) {
    console.error("Failed to fetch run:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch run" }, { status: 500 })
  }
}

// PATCH /api/runs/[runId] - Update workflow run (called by Trigger.dev callback)
export async function PATCH(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params
    const body = await request.json()

    const run = await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: body.status,
        completedAt: body.status !== "running" ? new Date() : undefined,
        durationMs: body.durationMs,
        errorMessage: body.errorMessage,
      },
    })

    // Update node executions if provided
    if (body.nodeExecutions) {
      for (const execution of body.nodeExecutions) {
        await prisma.nodeExecution.upsert({
          where: { id: execution.id },
          update: {
            status: execution.status,
            outputs: execution.outputs,
            completedAt: execution.completedAt,
            durationMs: execution.durationMs,
            errorMessage: execution.errorMessage,
          },
          create: {
            id: execution.id,
            runId,
            nodeId: execution.nodeId,
            nodeType: execution.nodeType,
            status: execution.status,
            inputs: execution.inputs || {},
            outputs: execution.outputs || {},
            startedAt: execution.startedAt,
            completedAt: execution.completedAt,
            durationMs: execution.durationMs,
            errorMessage: execution.errorMessage,
          },
        })
      }
    }

    return NextResponse.json({ success: true, data: run })
  } catch (error) {
    console.error("Failed to update run:", error)
    return NextResponse.json({ success: false, error: "Failed to update run" }, { status: 500 })
  }
}
