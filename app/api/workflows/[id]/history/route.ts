import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET /api/workflows/[id]/history - Fetch workflow execution history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify workflow ownership
    const workflow = await prisma.workflow.findUnique({
      where: { id, userId: user.id },
      select: { id: true },
    })

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      )
    }

    // Fetch execution history
    const runs = await prisma.workflowRun.findMany({
      where: {
        workflowId: id,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        scope: true,
        createdAt: true,
        completedAt: true,
        errorMessage: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: runs,
    })
  } catch (error) {
    console.error("Failed to fetch workflow history:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch workflow history" },
      { status: 500 }
    )
  }
}
