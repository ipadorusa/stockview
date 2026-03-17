import { Badge } from "@/components/ui/badge"
import type { NewsSentiment } from "@/types/news"

const SENTIMENT_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  positive: { label: "긍정", variant: "default" },
  negative: { label: "부정", variant: "destructive" },
  neutral: { label: "중립", variant: "secondary" },
}

interface SentimentBadgeProps {
  sentiment?: NewsSentiment | null
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (!sentiment || sentiment === "neutral") return null

  const config = SENTIMENT_CONFIG[sentiment]
  if (!config) return null

  return (
    <Badge variant={config.variant} className="text-xs px-1.5 py-0">
      {config.label}
    </Badge>
  )
}
