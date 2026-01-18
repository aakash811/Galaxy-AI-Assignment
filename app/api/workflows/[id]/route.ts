import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateWorkflowSchema } from "@/lib/validations/workflow"
import { getCurrentUser } from "@/lib/auth"

// GET /api/workflows/[id] - Get a specific workflow
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const workflow = await prisma.workflow.findUnique({
      where: { id, userId: user.id },
      include: {
        workflowRuns: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            nodeExecutions: true,
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: workflow })
  } catch (error) {
    console.error("Failed to fetch workflow:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch workflow" }, { status: 500 })
  }
}

// PATCH /api/workflows/[id] - Update a workflow
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateWorkflowSchema.parse(body)

    // Verify ownership
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id, userId: user.id },
    })

    if (!existingWorkflow) {
      return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 })
    }

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        nodes: validatedData.nodes || undefined,
        edges: validatedData.edges || undefined,
        viewport: validatedData.viewport || undefined,
      },
    })

    return NextResponse.json({ success: true, data: workflow })
  } catch (error) {
    console.error("Failed to update workflow:", error)
    return NextResponse.json({ success: false, error: "Failed to update workflow" }, { status: 500 })
  }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id, userId: user.id },
    })

    if (!existingWorkflow) {
      return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 })
    }

    await prisma.workflow.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete workflow:", error)
    return NextResponse.json({ success: false, error: "Failed to delete workflow" }, { status: 500 })
  }
}
