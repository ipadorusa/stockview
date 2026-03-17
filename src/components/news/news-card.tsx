import Image from "next/image"
import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewsTimestamp } from "@/components/common/news-timestamp"
import { SentimentBadge } from "@/components/news/sentiment-badge"
import type { NewsItem } from "@/types/news"

const CATEGORY_LABEL: Record<string, string> = {
  KR_MARKET: "한국", US_MARKET: "미국", INDUSTRY: "산업", ECONOMY: "경제",
}

interface NewsCardProps {
  news: NewsItem
  variant?: "featured" | "compact" | "minimal"
}

export function NewsCard({ news, variant = "compact" }: NewsCardProps) {
  if (variant === "minimal") {
    return (
      <a href={news.url} target="_blank" rel="noopener noreferrer"
        className="flex items-start justify-between gap-3 py-3 hover:bg-accent/50 rounded-lg px-2 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <SentimentBadge sentiment={news.sentiment} />
          </div>
          <p className="text-sm line-clamp-2">{news.title}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{news.source}</p>
          <NewsTimestamp date={news.publishedAt} className="text-xs text-muted-foreground" />
        </div>
      </a>
    )
  }

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-shadow overflow-hidden">
        <a href={news.url} target="_blank" rel="noopener noreferrer">
          <CardContent className="p-4">
            <div className="flex gap-3">
              {news.imageUrl && (
                <div className="relative w-20 h-16 shrink-0 rounded overflow-hidden">
                  <Image src={news.imageUrl} alt={news.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{CATEGORY_LABEL[news.category]}</Badge>
                  <SentimentBadge sentiment={news.sentiment} />
                  <span className="text-xs text-muted-foreground">{news.source}</span>
                </div>
                <p className="text-sm font-medium line-clamp-2">{news.title}</p>
                <NewsTimestamp date={news.publishedAt} className="text-xs text-muted-foreground mt-1" />
              </div>
            </div>
          </CardContent>
        </a>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <a href={news.url} target="_blank" rel="noopener noreferrer">
        {news.imageUrl && (
          <div className="relative w-full h-48">
            <Image src={news.imageUrl} alt={news.title} fill className="object-cover" />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">{CATEGORY_LABEL[news.category]}</Badge>
            <span className="text-xs text-muted-foreground">{news.source}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
          </div>
          <p className="font-semibold line-clamp-2">{news.title}</p>
          {news.summary && <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{news.summary}</p>}
          <NewsTimestamp date={news.publishedAt} className="text-xs text-muted-foreground mt-2" />
        </CardContent>
      </a>
    </Card>
  )
}
