"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { FileText } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StockSearchInput } from "@/components/search/stock-search-input"
import type { StockSearchResult } from "@/types/stock"

export default function ReportRequestPage() {
  return (
    <Suspense fallback={
      <PageContainer>
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageContainer>
    }>
      <ReportRequestContent />
    </Suspense>
  )
}

function ReportRequestContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tickerParam = searchParams.get("ticker")

  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null)

  // ticker 파라미터가 있으면 해당 종목 자동 선택
  useQuery({
    queryKey: ["stock-search-prefill", tickerParam],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(tickerParam!)}`)
      const data = await res.json() as { results: StockSearchResult[] }
      const found = data.results.find((s) => s.ticker === tickerParam!.toUpperCase()) ?? null
      if (found) setSelectedStock(found)
      return found
    },
    enabled: !!tickerParam && !selectedStock,
  })

  const submitMutation = useMutation({
    mutationFn: async (stock: StockSearchResult) => {
      const res = await fetch("/api/report-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockId: stock.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "요청에 실패했습니다.")
      return data
    },
    onSuccess: () => {
      toast.success("분석 요청이 등록되었습니다.")
      router.push("/reports")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  if (status === "loading") {
    return (
      <PageContainer>
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageContainer>
    )
  }

  if (status === "unauthenticated") {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">AI 분석 요청</h2>
          <p className="text-muted-foreground mb-6">로그인하면 AI 종목 분석을 요청할 수 있어요</p>
          <Button onClick={() => router.push("/auth/login")}>로그인</Button>
        </div>
      </PageContainer>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStock) {
      toast.error("종목을 선택해주세요.")
      return
    }
    submitMutation.mutate(selectedStock)
  }

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold mb-6">AI 분석 요청</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">분석할 종목 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <StockSearchInput
                value={selectedStock}
                onChange={setSelectedStock}
                placeholder="분석을 요청할 종목을 검색하세요..."
              />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 요청은 관리자 승인 후 AI가 분석을 생성합니다.</p>
                <p>• 하루 최대 3건까지 요청할 수 있습니다.</p>
                <p>• 이미 진행 중인 종목은 중복 요청할 수 없습니다.</p>
              </div>

              <Button
                type="submit"
                disabled={!selectedStock || submitMutation.isPending}
                className="self-end"
              >
                {submitMutation.isPending ? "요청 중..." : "분석 요청하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
