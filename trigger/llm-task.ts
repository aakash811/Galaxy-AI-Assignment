import { task, logger } from "@trigger.dev/sdk/v3"
import Groq from "groq-sdk"
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions"
import { z } from "zod"

const llmInputSchema = z.object({
  model: z.string().default("llama-3.3-70b-versatile"),
  systemPrompt: z.string().optional(),
  userMessage: z.string(),
  images: z
    .array(
      z.string().refine(
        (v) => v.startsWith("data:image/"),
        "Invalid image data URL"
      )
    )
    .optional(),
})

export type LLMTaskInput = z.infer<typeof llmInputSchema>

export const llmTask = task({
  id: "llm-execution",
  maxDuration: 120,

 run: async (payload: LLMTaskInput) => {
  const { model, systemPrompt, userMessage, images } =
    llmInputSchema.parse(payload)

  logger.info("LLM task started", { model })

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
  })

  const messages: ChatCompletionMessageParam[] = []

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    })
  }

  messages.push({
    role: "user",
    content: [
      {
        type: "text",
        text: userMessage,
      },
      ...(images?.map((image) => ({
        type: "image_url" as const,
        image_url: {
          url: image,
        },
      })) ?? []),
    ],    
  })

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
  })

  return {
    success: true,
    result: completion.choices[0]?.message?.content ?? "",
    model,
    tokensUsed: completion.usage?.total_tokens,
  }
}

})
