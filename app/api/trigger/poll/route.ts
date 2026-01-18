import { runs } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const run = await runs.retrieve(runId);

  console.log("Fetched run status:", run);

  return NextResponse.json({
    isCompleted: run.isCompleted,
    isSuccess: run.isSuccess,
    isFailed: run.isFailed,
    result: run?.output?.result ??  run?.output?.resultUrl ?? null,
  });
}
