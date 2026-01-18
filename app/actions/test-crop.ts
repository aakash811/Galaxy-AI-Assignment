"use server";

import { cropImageTask } from "@/trigger/crop-image-task";

export async function testCrop() {
  const run = await cropImageTask.trigger({
    imageUrl: "https://images.unsplash.com/photo-1549692520-acc6669e2f0c",
    xPercent: 10,
    yPercent: 10,
    widthPercent: 50,
    heightPercent: 50,
  });

  return {
    runId: run.id,
    status: "triggered",
  };
}
