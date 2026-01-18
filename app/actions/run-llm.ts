"use server"

import { llmTask } from "@/trigger/llm-task"

export async function runLLMNode(input: {
  model: string
  systemPrompt?: string
  userMessage: string
  images?: string[]
}) {
  const run = await llmTask.trigger({
    model: input.model,
    systemPrompt: input.systemPrompt,
    userMessage: input.userMessage,
    images: input.images,
  })

  console.log("Triggered LLM task run:", run)

  return {
    runId: run.id,
  }
}
