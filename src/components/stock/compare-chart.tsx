"use client"

import { useRef, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartDataPoint {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CompareChartProps {
  tickers: string[]
  names: string[]
}

function getChartVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888888"
}

async function fetchChartData(ticker: string): Promise<ChartDataPoint[]> {
  const res = await fetch(`/api/stocks/${ticker}/chart?period=3M`)
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

export function CompareChart({ tickers, names }: CompareChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null)

  const chartQueries = tickers.map((ticker, i) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ["compare-chart", ticker],
      queryFn: () => fetchChartData(ticker),
      enabled: !!ticker,
      staleTime: 5 * 60 * 1000,
    })
  )

  const allLoaded = chartQueries.every((q) => !q.isLoading)
  const allData = chartQueries.map((q) => q.data ?? [])

  const cancelledRef = useRef(false)

  const renderChart = useCallback(async () => {
    if (!chartContainerRef.current || !allLoaded) return
    if (allData.every((d) => d.length === 0)) return

    const lc = await import("lightweight-charts")
    if (cancelledRef.current || !chartContainerRef.current) return
    const { createChart, LineSeries, ColorType } = lc

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const borderColor = getChartVar("--chart-hex-border")
    const COLORS = [
      getChartVar("--chart-hex-series-1"),
      getChartVar("--chart-hex-series-2"),
      getChartVar("--chart-hex-series-3"),
      getChartVar("--chart-hex-series-4"),
    ]

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: getChartVar("--chart-hex-text"),
      },
      grid: {
        vertLines: { color: getChartVar("--chart-hex-border-subtle") },
        horzLines: { color: getChartVar("--chart-hex-border-subtle") },
      },
      rightPriceScale: {
        borderColor,
      },
      timeScale: {
        borderColor,
        timeVisible: false,
      },
      crosshair: { mode: 1 },
    })

    chartRef.current = chart

    // Add normalized (%) line for each stock
    allData.forEach((data, i) => {
      if (data.length === 0) return
      const basePrice = data[0].close
      if (basePrice === 0) return

      const series = chart.addSeries(LineSeries, {
        color: COLORS[i % COLORS.length],
        lineWidth: 2,
        title: names[i] ?? tickers[i],
        priceFormat: {
          type: "custom",
          formatter: (price: number) => `${price >= 0 ? "+" : ""}${price.toFixed(2)}%`,
        },
      })

      const normalizedData = data.map((d) => ({
        time: d.time,
        value: ((d.close - basePrice) / basePrice) * 100,
      }))

      series.setData(normalizedData as Parameters<typeof series.setData>[0])
    })

    chart.timeScale().fitContent()

    // Resize observer
    const observer = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    })
    observer.observe(chartContainerRef.current)

    return () => observer.disconnect()
  }, [allLoaded, allData, tickers, names])

  useEffect(() => {
    cancelledRef.current = false
    renderChart()
    return () => {
      cancelledRef.current = true
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [renderChart])

  if (!allLoaded) {
    return <Skeleton className="h-[300px] w-full rounded-lg" />
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">가격 비교 차트</h2>
      <p className="text-xs text-muted-foreground">3개월 수익률(%) 기준 정규화</p>
      <div ref={chartContainerRef} className="w-full rounded-lg border" />
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {tickers.map((ticker, i) => (
          <div key={ticker} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ backgroundColor: `var(--chart-series-${(i % 4) + 1})` }}
            />
            <span className="text-xs text-muted-foreground">
              {names[i] ?? ticker}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
