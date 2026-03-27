import { Badge } from "@/components/ui/badge"
import type { NewsSentiment } from "@/types/news"

const SENTIMENT_CONFIG: Record<string, { label: string; className: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  positive: { label: "긍정", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 hover:bg-emerald-100", variant: "secondary" },
  negative: { label: "부정", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-100", variant: "secondary" },
  neutral: { label: "중립", className: "", variant: "secondary" },
}

interface SentimentBadgeProps {
  sentiment?: NewsSentiment | null
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (!sentiment) return null

  const config = SENTIMENT_CONFIG[sentiment]
  if (!config) return null

  return (
    <Badge variant={config.variant} className={`text-xs px-1.5 py-0 ${config.className}`}>
      {config.label}
    </Badge>
  )
}
