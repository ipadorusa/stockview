import { groqChat } from "@/lib/groq"

export type SentimentLabel = "positive" | "negative" | "neutral"

/**
 * Groq API로 뉴스 제목 감성 분석
 * RPM 30 준수를 위해 호출 간 2초 딜레이는 caller 책임
 */
export async function analyzeNewsSentiment(title: string): Promise<SentimentLabel> {
  const prompt = `You are a financial news sentiment classifier. Classify the following news headline into exactly one of: positive, negative, neutral.

Rules:
- "positive": good news for stocks/economy (earnings beat, growth, deals, upgrades)
- "negative": bad news for stocks/economy (losses, layoffs, downgrades, crashes, scandals)
- "neutral": factual/informational without clear positive or negative implication

Respond with ONLY one word: positive, negative, or neutral.

Headline: ${title}`

  const result = await groqChat([
    { role: "system", content: "You are a financial sentiment classifier. Respond with exactly one word." },
    { role: "user", content: prompt },
  ])

  const cleaned = result.trim().toLowerCase()

  if (cleaned.includes("positive")) return "positive"
  if (cleaned.includes("negative")) return "negative"
  return "neutral"
}

/**
 * 배치 감성 분석 (2초 딜레이 포함)
 */
export async function analyzeSentimentBatch(
  items: { id: string; title: string }[]
): Promise<Map<string, SentimentLabel>> {
  const results = new Map<string, SentimentLabel>()

  for (const item of items) {
    try {
      const sentiment = await analyzeNewsSentiment(item.title)
      results.set(item.id, sentiment)
    } catch (e) {
      console.error(`[sentiment] Failed for "${item.title.slice(0, 50)}":`, e)
      results.set(item.id, "neutral") // fallback
    }

    // 2초 딜레이 (Groq RPM 30 준수)
    await new Promise((r) => setTimeout(r, 2000))
  }

  return results
}
