"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ChartData, ChartPeriod } from "@/types/stock"
import { calculateMA } from "@/lib/utils/technical-indicators"

const PERIOD_LABELS: Record<ChartPeriod, string> = {
  "1W": "1주",
  "2W": "2주",
  "3W": "3주",
  "1M": "1개월",
  "3M": "3개월",
  "6M": "6개월",
  "1Y": "1년",
}

interface StockChartProps {
  ticker: string
}

export function StockChart({ ticker }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null)
  const [period, setPeriod] = useState<ChartPeriod>("3W")
  const [showMA, setShowMA] = useState(false)

  const { data, isLoading, isError } = useQuery<ChartData>({
    queryKey: ["chart", ticker, period],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/chart?period=${period}`)
      if (!res.ok) throw new Error("차트 데이터 로드 실패")
      return res.json()
    },
    staleTime: 24 * 60 * 60 * 1000,
  })

  useEffect(() => {
    if (!chartContainerRef.current) return

    let chart: ReturnType<typeof import("lightweight-charts").createChart> | null = null

    import("lightweight-charts").then(({ createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType }) => {
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
        upColor: "#ef4444",
        downColor: "#3b82f6",
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

        // MA 오버레이
        if (showMA && data.data.length >= 5) {
          const closes = data.data.map((d) => d.close)
          const times = data.data.map((d) => d.time as import("lightweight-charts").Time)

          const maConfigs = [
            { period: 5, color: "#f59e0b", label: "MA5" },
            { period: 20, color: "#8b5cf6", label: "MA20" },
            { period: 60, color: "#10b981", label: "MA60" },
          ]

          for (const mc of maConfigs) {
            if (data.data.length < mc.period) continue
            const maValues = calculateMA(closes, mc.period)
            const maData = maValues
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is { time: import("lightweight-charts").Time; value: number } => x !== null)

            if (maData.length > 0) {
              const maSeries = chart!.addSeries(LineSeries, {
                color: mc.color,
                lineWidth: 1,
                priceLineVisible: false,
                lastValueVisible: false,
                crosshairMarkerVisible: false,
              })
              maSeries.setData(maData)
            }
          }
        }

        chart.timeScale().fitContent()
      }

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
  }, [data, showMA])

  return (
    <div className="w-full">
      {/* 기간 선택 */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as ChartPeriod[]).map((p) => (
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
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => setShowMA(!showMA)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            showMA
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          MA
        </button>
      </div>

      {/* 차트 영역 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <div className="text-xs text-muted-foreground">차트 로딩 중...</div>
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-[300px] text-sm text-destructive">
            차트를 불러올 수 없습니다
          </div>
        )}
        {!isLoading && !isError && (!data?.data || data.data.length === 0) && (
          <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
            차트 데이터가 없습니다
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>최근 {PERIOD_LABELS[period]} 일봉</span>
        <span>·</span>
        <span>상승 <span className="text-red-500">빨강</span> / 하락 <span className="text-blue-500">파랑</span></span>
        {showMA && (
          <>
            <span>·</span>
            <span className="text-amber-500">MA5</span>
            <span className="text-violet-500">MA20</span>
            <span className="text-emerald-500">MA60</span>
          </>
        )}
      </div>
    </div>
  )
}
