"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { PageContainer } from "@/components/layout/page-container"
import { NewsCard } from "@/components/news/news-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { NewsItem } from "@/types/news"

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "KR_MARKET", label: "한국" },
  { value: "US_MARKET", label: "미국" },
  { value: "INDUSTRY", label: "산업" },
  { value: "ECONOMY", label: "경제" },
]

const SENTIMENTS = [
  { value: "all", label: "전체" },
  { value: "positive", label: "긍정" },
  { value: "negative", label: "부정" },
  { value: "neutral", label: "중립" },
]

export default function NewsPage() {
  const [category, setCategory] = useState("all")
  const [sentiment, setSentiment] = useState("all")
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["news", category, sentiment, page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" })
      if (category !== "all") params.set("category", category)
      if (sentiment !== "all") params.set("sentiment", sentiment)
      if (searchQuery) params.set("q", searchQuery)
      const res = await fetch(`/api/news?${params}`)
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
    setPage(1)
  }

  return (
    <PageContainer>
      <GtmPageView pageData={{ page_name: "news" }} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">뉴스</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            aria-label="뉴스 검색"
            placeholder="뉴스 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-48 sm:w-64 h-9 text-sm"
          />
          <Button type="submit" variant="outline" size="sm">
            검색
          </Button>
        </form>
      </div>

      <Tabs value={category} onValueChange={handleCategoryChange}>
        <TabsList className="mb-4">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* 감성 필터 */}
        <div className="flex gap-1 mb-6">
          {SENTIMENTS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setSentiment(s.value); setPage(1) }}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                sentiment === s.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {CATEGORIES.map((c) => (
          <TabsContent key={c.value} value={c.value}>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {data?.news?.map((item: NewsItem) => (
                    <NewsCard key={item.id} news={item} variant="compact" />
                  ))}
                  {data?.news?.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      {searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다` : "뉴스가 없습니다"}
                    </div>
                  )}
                </div>
                {data?.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</Button>
                    <span className="text-sm text-muted-foreground">{page} / {data.pagination.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>다음</Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  )
}
