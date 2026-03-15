"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/page-container"
import { NewsCard } from "@/components/news/news-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { NewsItem } from "@/types/news"

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "KR_MARKET", label: "한국" },
  { value: "US_MARKET", label: "미국" },
  { value: "INDUSTRY", label: "산업" },
  { value: "ECONOMY", label: "경제" },
]

export default function NewsPage() {
  const [category, setCategory] = useState("all")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["news", category, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" })
      if (category !== "all") params.set("category", category)
      const res = await fetch(`/api/news?${params}`)
      return res.json()
    },
  })

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setPage(1)
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-6">뉴스</h1>

      <Tabs value={category} onValueChange={handleCategoryChange}>
        <TabsList className="mb-6">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
          ))}
        </TabsList>

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
                    <div className="text-center py-16 text-muted-foreground">뉴스가 없습니다</div>
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
