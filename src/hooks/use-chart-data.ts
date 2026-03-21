"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { calculateHeikinAshi } from "@/lib/utils/technical-indicators"
import type { ChartData } from "@/types/stock"

export function useChartData(ticker: string, period: string) {
  const { data, isLoading, isError } = useQuery<ChartData>({
    queryKey: ["chart", ticker, period],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/chart?period=${period}`)
      if (!res.ok) throw new Error("차트 데이터 로드 실패")
      return res.json()
    },
    staleTime: 24 * 60 * 60 * 1000,
  })

  const haData = useMemo(() => {
    if (!data?.data?.length) return []
    return calculateHeikinAshi(data.data)
  }, [data])

  return { data, haData, isLoading, isError }
}
