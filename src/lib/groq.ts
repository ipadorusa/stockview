import { withRetry } from "@/lib/utils/retry"
import type { ChatMessage } from "@/lib/ollama"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"

interface GroqChoice {
  message: { role: string; content: string }
  finish_reason: string
}

interface GroqChatResponse {
  choices: GroqChoice[]
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

export async function groqChat(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY is not set")

  const result = await withRetry(
    async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)

      try {
        const res = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: 0.3,
            max_tokens: 2000,
            top_p: 0.9,
          }),
          signal: controller.signal,
        })

        if (res.status === 429) {
          const retryAfter = res.headers.get("retry-after")
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000
          await new Promise((r) => setTimeout(r, waitMs))
          throw new Error(`Groq rate limited (429), retrying after ${waitMs}ms`)
        }

        if (!res.ok) {
          throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`)
        }

        const data = (await res.json()) as GroqChatResponse
        const content = data.choices?.[0]?.message?.content
        if (!content) throw new Error("Groq returned empty response")
        return content
      } finally {
        clearTimeout(timeout)
      }
    },
    { maxRetries: 2, baseDelayMs: 3000, label: "groq-chat" }
  )

  return result
}

export function getGroqModel(): string {
  return GROQ_MODEL
}
