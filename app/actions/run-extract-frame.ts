"use server"

import { extractFrameTask } from "@/trigger/extract-frame-task"

export async function runExtractFrameNode(input: {
  videoUrl: string
  timestamp?: number | string
}) {
  const run = await extractFrameTask.trigger({
    videoUrl: input.videoUrl,
    timestamp: input.timestamp ?? 0,
  })

  return {
    runId: run.id,
  }
}
