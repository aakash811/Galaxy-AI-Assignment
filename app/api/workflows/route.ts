import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createWorkflowSchema } from "@/lib/validations/workflow"
import { getCurrentUser } from "@/lib/auth"

// GET /api/workflows - List all workflows for user
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        isSample: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: workflows })
  } catch (error) {
    console.error("Failed to fetch workflows:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch workflows" }, { status: 500 })
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createWorkflowSchema.parse(body)

    const workflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        description: validatedData.description,
      },
    })

    return NextResponse.json({ success: true, data: workflow }, { status: 201 })
  } catch (error) {
    console.error("Failed to create workflow:", error)
    return NextResponse.json({ success: false, error: "Failed to create workflow" }, { status: 500 })
  }
}
