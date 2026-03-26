import { ollamaChat, getOllamaModel } from "@/lib/ollama"
import { groqChat, getGroqModel } from "@/lib/groq"

export type { ChatMessage } from "@/lib/ollama"

export async function generateChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    return groqChat(messages)
  }
  return ollamaChat(messages)
}

export function getLLMProvider(): string {
  if (process.env.GROQ_API_KEY) return `groq:${getGroqModel()}`
  return `ollama:${getOllamaModel()}`
}
