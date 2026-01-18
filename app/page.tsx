import { WorkflowLayout } from "@/components/layout/workflow-layout"
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <WorkflowLayout>
      <WorkflowCanvas />
    </WorkflowLayout>
  )
}
