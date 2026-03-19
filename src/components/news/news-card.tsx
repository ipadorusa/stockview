import Image from "next/image"
import { ExternalLink, Newspaper } from "lucide-react"
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

/** 이미지 없을 때 표시할 fallback 아이콘 플레이스홀더 */
function ImageFallback({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted rounded ${className ?? ""}`}>
      <Newspaper className="h-6 w-6 text-muted-foreground/40" />
    </div>
  )
}

export function NewsCard({ news, variant = "compact" }: NewsCardProps) {
  // 본문 excerpt: content 우선, 없으면 summary
  const excerpt = news.content || news.summary || null

  if (variant === "minimal") {
    return (
      <a href={news.url} target="_blank" rel="noopener noreferrer"
        className="flex items-start justify-between gap-3 py-3 hover:bg-accent/50 rounded-lg px-2 transition-colors group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <SentimentBadge sentiment={news.sentiment} />
          </div>
          <p className="text-sm line-clamp-2">{news.title}</p>
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{excerpt}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{news.source}</p>
          <NewsTimestamp date={news.publishedAt} className="text-xs text-muted-foreground" />
          <ExternalLink className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground ml-auto mt-1 transition-colors" />
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
              {news.imageUrl ? (
                <div className="relative w-20 h-16 shrink-0 rounded overflow-hidden">
                  <Image src={news.imageUrl} alt={news.title} fill sizes="80px" className="object-cover" />
                </div>
              ) : (
                <ImageFallback className="w-20 h-16 shrink-0" />
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

  // featured variant
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <a href={news.url} target="_blank" rel="noopener noreferrer">
        {news.imageUrl ? (
          <div className="relative w-full aspect-[5/3]">
            <Image src={news.imageUrl} alt={news.title} fill sizes="100vw" className="object-cover" />
          </div>
        ) : (
          <ImageFallback className="w-full h-24" />
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">{CATEGORY_LABEL[news.category]}</Badge>
            <span className="text-xs text-muted-foreground">{news.source}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
          </div>
          <p className="font-semibold line-clamp-2">{news.title}</p>
          {excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{excerpt}</p>}
          <NewsTimestamp date={news.publishedAt} className="text-xs text-muted-foreground mt-2" />
        </CardContent>
      </a>
    </Card>
  )
}
