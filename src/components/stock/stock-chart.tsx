"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ChartData } from "@/types/stock"

type Period = "1W" | "2W" | "3W"

const PERIOD_LABELS: Record<Period, string> = {
  "1W": "1주",
  "2W": "2주",
  "3W": "3주",
}

interface StockChartProps {
  ticker: string
}

export function StockChart({ ticker }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null)
  const [period, setPeriod] = useState<Period>("3W")

  const { data, isLoading } = useQuery<ChartData>({
    queryKey: ["chart", ticker, period],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/chart?period=${period}`)
      if (!res.ok) throw new Error("차트 데이터 로드 실패")
      return res.json()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24시간
  })

  // 차트 초기화
  useEffect(() => {
    if (!chartContainerRef.current) return

    let chart: ReturnType<typeof import("lightweight-charts").createChart> | null = null

    import("lightweight-charts").then(({ createChart, CandlestickSeries, HistogramSeries, ColorType }) => {
      if (!chartContainerRef.current) return

      const isDark = document.documentElement.classList.contains("dark")

      chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 300,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: isDark ? "#9ca3af" : "#6b7280",
        },
        grid: {
          vertLines: { color: isDark ? "#374151" : "#f3f4f6" },
          horzLines: { color: isDark ? "#374151" : "#f3f4f6" },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: isDark ? "#374151" : "#e5e7eb" },
        timeScale: {
          borderColor: isDark ? "#374151" : "#e5e7eb",
          timeVisible: false,
        },
      })

      chartRef.current = chart

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#ef4444",       // 상승: 빨강 (한국 관례)
        downColor: "#3b82f6",     // 하락: 파랑
        borderUpColor: "#ef4444",
        borderDownColor: "#3b82f6",
        wickUpColor: "#ef4444",
        wickDownColor: "#3b82f6",
      })

      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "#6b7280",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      })

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      })

      // 데이터 설정
      if (data?.data && data.data.length > 0) {
        candleSeries.setData(
          data.data.map((d) => ({
            time: d.time as import("lightweight-charts").Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        )
        volumeSeries.setData(
          data.data.map((d) => ({
            time: d.time as import("lightweight-charts").Time,
            value: d.volume,
            color: d.close >= d.open ? "#fca5a5" : "#93c5fd",
          }))
        )
        chart.timeScale().fitContent()
      }

      // 반응형: 컨테이너 크기 변경 대응
      const resizeObserver = new ResizeObserver(() => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth })
        }
      })
      resizeObserver.observe(chartContainerRef.current)

      return () => {
        resizeObserver.disconnect()
        chart?.remove()
        chartRef.current = null
      }
    })

    return () => {
      chart?.remove()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <div className="w-full">
      {/* 기간 선택 */}
      <div className="flex gap-1 mb-3">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <div className="text-xs text-muted-foreground">차트 로딩 중...</div>
          </div>
        )}
        {!isLoading && (!data?.data || data.data.length === 0) && (
          <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
            차트 데이터가 없습니다
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        최근 {PERIOD_LABELS[period]} 일봉 · 상승 <span className="text-red-500">빨강</span> / 하락 <span className="text-blue-500">파랑</span>
      </p>
    </div>
  )
}
