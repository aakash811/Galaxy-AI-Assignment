import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const runId = searchParams.get("runId")

  if (!runId) {
    return NextResponse.json({ status: "ERROR" }, { status: 400 })
  }

  const res = await fetch(
    `https://api.trigger.dev/api/v3/runs/${runId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TRIGGER_SECRET_KEY}`,
        Accept: "application/json",
      },
    }
  )

  const run = await res.json()

  return NextResponse.json({
    isCompleted: run.isCompleted,
    isSuccess: run.isSuccess,
    isFailed: run.isFailed,
    // 🔥 THIS is where the result actually lives
    result: run?.output?.result ?? null,
  })
}
