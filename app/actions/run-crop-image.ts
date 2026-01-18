"use server"

import { cropImageTask } from "@/trigger/crop-image-task"

export async function runCropImageNode(input: {
  imageUrl: string
  xPercent?: number
  yPercent?: number
  widthPercent?: number
  heightPercent?: number
}) {
  const run = await cropImageTask.trigger({
    imageUrl: input.imageUrl,
    xPercent: input.xPercent ?? 0,
    yPercent: input.yPercent ?? 0,
    widthPercent: input.widthPercent ?? 100,
    heightPercent: input.heightPercent ?? 100,
  })

  return {
    runId: run.id,
  }
}
