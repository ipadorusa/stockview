"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Newspaper } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NewsTimestamp } from "@/components/common/news-timestamp"
import { SentimentBadge } from "@/components/news/sentiment-badge"
import { NewsLink } from "@/components/news/news-link"
import type { NewsItem } from "@/types/news"

const CATEGORY_LABEL: Record<string, string> = {
  KR_MARKET: "한국", US_MARKET: "미국", INDUSTRY: "산업", ECONOMY: "경제",
}

const CATEGORY_STYLE: Record<string, string> = {
  KR_MARKET: "bg-[var(--badge-market-kr-bg)] text-[var(--badge-market-kr)] border-transparent",
  US_MARKET: "bg-[var(--badge-market-us-bg)] text-[var(--badge-market-us)] border-transparent",
  INDUSTRY: "bg-[var(--badge-sector-bg)] text-[var(--badge-sector)] border-transparent",
  ECONOMY: "bg-[var(--badge-news-bg)] text-[var(--badge-news)] border-transparent",
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

/** 이미지 로드 실패(502 등) 시 fallback으로 전환하는 래퍼 */
function NewsImage({ src, alt, sizes, className, fallbackClassName }: { src: string; alt: string; sizes: string; className?: string; fallbackClassName?: string }) {
  const [error, setError] = useState(false)
  if (error) return <ImageFallback className={fallbackClassName} />
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} unoptimized onError={() => setError(true)} />
}

function StockTags({ stocks }: { stocks: NewsItem["relatedStocks"] }) {
  const router = useRouter()
  if (!stocks?.length) return null
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {stocks.slice(0, 5).map((s) => (
        <Badge
          key={s.ticker}
          variant="outline"
          className={`text-xs px-1.5 py-0 cursor-pointer hover:bg-accent ${s.market === "US" ? "border-blue-400 text-blue-600 dark:border-blue-400 dark:text-blue-400" : ""}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/stock/${s.ticker}`) }}
        >
          {s.ticker}
        </Badge>
      ))}
    </div>
  )
}

export function NewsCard({ news, variant = "compact" }: NewsCardProps) {
  // 본문 excerpt: content 우선, 없으면 summary
  const excerpt = news.content || news.summary || null

  if (variant === "minimal") {
    return (
      <NewsLink href={news.url} title={news.title} source={news.source} category={news.category}
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
      </NewsLink>
    )
  }

  if (variant === "compact") {
    return (
      <div className="card-interactive overflow-hidden">
        <NewsLink href={news.url} title={news.title} source={news.source} category={news.category} className="active:!opacity-100 block p-4">
          <div className="flex gap-3">
            {news.imageUrl ? (
              <div className="relative w-20 h-16 shrink-0 rounded overflow-hidden">
                <NewsImage src={news.imageUrl} alt={news.title} sizes="80px" className="object-cover" fallbackClassName="w-20 h-16 shrink-0" />
              </div>
            ) : (
              <ImageFallback className="w-20 h-16 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0 ${CATEGORY_STYLE[news.category] ?? ""}`}
                >
                  {CATEGORY_LABEL[news.category]}
                </Badge>
                <SentimentBadge sentiment={news.sentiment} />
                <span className="text-xs text-[var(--fg-muted)]">{news.source}</span>
              </div>
              <p className="text-sm font-medium line-clamp-2 text-[var(--fg-primary)]">{news.title}</p>
              <NewsTimestamp date={news.publishedAt} className="text-xs text-[var(--fg-muted)] mt-1" />
              <StockTags stocks={news.relatedStocks} />
            </div>
          </div>
        </NewsLink>
      </div>
    )
  }

  // featured variant
  return (
    <div className="card-interactive overflow-hidden">
      <NewsLink href={news.url} title={news.title} source={news.source} category={news.category} className="active:!opacity-100 block">
        {news.imageUrl ? (
          <div className="relative w-full aspect-[5/3]">
            <NewsImage src={news.imageUrl} alt={news.title} sizes="100vw" className="object-cover" fallbackClassName="w-full h-24" />
          </div>
        ) : (
          <ImageFallback className="w-full h-24" />
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={`text-xs ${CATEGORY_STYLE[news.category] ?? ""}`}
            >
              {CATEGORY_LABEL[news.category]}
            </Badge>
            <SentimentBadge sentiment={news.sentiment} />
            <span className="text-xs text-[var(--fg-muted)]">{news.source}</span>
            <ExternalLink className="h-3 w-3 text-[var(--fg-muted)] ml-auto" />
          </div>
          <p className="font-semibold line-clamp-2 text-[var(--fg-primary)]">{news.title}</p>
          {excerpt && <p className="text-sm text-[var(--fg-secondary)] line-clamp-3 mt-1">{excerpt}</p>}
          <NewsTimestamp date={news.publishedAt} className="text-xs text-[var(--fg-muted)] mt-2" />
          <StockTags stocks={news.relatedStocks} />
        </div>
      </NewsLink>
    </div>
  )
}
