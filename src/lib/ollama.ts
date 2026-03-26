import { withRetry } from "@/lib/utils/retry"

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "exaone3.5:7.8b"

interface OllamaChatResponse {
  message: { role: string; content: string }
  done: boolean
  total_duration?: number
  eval_count?: number
}

export async function ollamaChat(messages: ChatMessage[]): Promise<string> {
  const result = await withRetry(
    async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120_000)

      try {
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages,
            stream: false,
            options: {
              temperature: 0.3,
              num_ctx: 4096,
              num_predict: 1200,
              top_p: 0.9,
              repeat_penalty: 1.1,
            },
            keep_alive: 300,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`)
        }

        const data = (await res.json()) as OllamaChatResponse
        return data.message.content
      } finally {
        clearTimeout(timeout)
      }
    },
    { maxRetries: 1, baseDelayMs: 2000, label: "ollama-chat" }
  )

  return result
}

export function getOllamaModel(): string {
  return OLLAMA_MODEL
}
