"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface SectorItem {
  id: string
  name: string
  market: string
  stockCount: number
}

async function fetchSectors(market: string): Promise<SectorItem[]> {
  const res = await fetch(`/api/sectors?market=${market}`)
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

interface SectorListProps {
  initialKrSectors: Array<{ name: string; stockCount: number }>
}

export function SectorList({ initialKrSectors }: SectorListProps) {
  const [market, setMarket] = useState<"KR" | "US">("KR")

  const { data: sectors, isLoading } = useQuery({
    queryKey: ["sectors", market],
    queryFn: () => fetchSectors(market),
    staleTime: 30 * 60 * 1000,
    initialData: market === "KR" ? initialKrSectors.map((s, i) => ({ id: String(i), name: s.name, market: "KR", stockCount: s.stockCount })) : undefined,
    enabled: true,
  })

  return (
    <div>
      <Tabs value={market} onValueChange={(v) => setMarket(v as "KR" | "US")} className="mb-6">
        <TabsList>
          <TabsTrigger value="KR">한국</TabsTrigger>
          <TabsTrigger value="US">미국</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : !sectors || sectors.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">섹터 데이터가 없습니다</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">총 {sectors.length}개 섹터</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sectors.map((sector) => (
              <Link
                key={sector.name}
                href={`/sectors/${encodeURIComponent(sector.name)}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/40 hover:shadow-sm transition-all"
              >
                <span className="text-sm font-medium truncate mr-2">{sector.name}</span>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {sector.stockCount}종목
                </Badge>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
