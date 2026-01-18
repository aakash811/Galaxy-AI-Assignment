"use client"

export async function pollTriggerRun(runId: string) {
  while (true) {
    const res = await fetch(`/api/trigger/poll?runId=${runId}`);
    const data = await res.json();
    console.log("Polled run status:", data);
    if (data.isCompleted) {
      if (data.isFailed) {
        throw new Error("LLM task failed");
      }
      return data.result ?? "";
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
}
