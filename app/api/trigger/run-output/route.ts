import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const runId = searchParams.get("runId")

  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 })
  }

  const res = await fetch(
    `https://api.trigger.dev/api/v3/runs/${runId}/results`, // 🔥 FIXED
    {
      headers: {
        Authorization: `Bearer ${process.env.TRIGGER_SECRET_KEY}`,
      },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error("Trigger results error:", text)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }

  const results = await res.json()

  // Trigger returns array of results; first item is your task output
  const output = results?.[0]?.output ?? null

  return NextResponse.json(output)
}
