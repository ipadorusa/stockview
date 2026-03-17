"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ChartData, ChartPeriod } from "@/types/stock"
import {
  calculateMA,
  calculateEMA,
  calculateBollingerBands,
  calculateMACD,
  calculateRSI,
  calculateStochastic,
  calculateOBV,
  calculateATR,
  calculateFibonacciLevels,
  calculateROC,
  calculateMFI,
  calculateADLine,
  calculatePivotPoints,
  calculateADX,
  calculateParabolicSAR,
  detectCandlePatterns,
  detectMorningStar,
  detectEveningStar,
  detectHarami,
  detectThreeWhiteSoldiers,
  detectThreeBlackCrows,
} from "@/lib/utils/technical-indicators"

const PERIOD_LABELS: Record<ChartPeriod, string> = {
  "1W": "1주",
  "2W": "2주",
  "3W": "3주",
  "1M": "1개월",
  "3M": "3개월",
  "6M": "6개월",
  "1Y": "1년",
}

type MAType = "off" | "SMA" | "EMA"
type IndicatorPanel = "MACD" | "RSI" | "Stochastic" | "OBV" | "ATR" | "ROC" | "MFI" | "ADLine" | "ADX"

interface StockChartProps {
  ticker: string
}

export function StockChart({ ticker }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const macdContainerRef = useRef<HTMLDivElement>(null)
  const rsiContainerRef = useRef<HTMLDivElement>(null)
  const stochContainerRef = useRef<HTMLDivElement>(null)
  const obvContainerRef = useRef<HTMLDivElement>(null)
  const atrContainerRef = useRef<HTMLDivElement>(null)
  const rocContainerRef = useRef<HTMLDivElement>(null)
  const mfiContainerRef = useRef<HTMLDivElement>(null)
  const adLineContainerRef = useRef<HTMLDivElement>(null)
  const adxContainerRef = useRef<HTMLDivElement>(null)
  const chartsRef = useRef<Array<ReturnType<typeof import("lightweight-charts").createChart>>>([])

  const [period, setPeriod] = useState<ChartPeriod>("3M")
  const [maType, setMAType] = useState<MAType>("off")
  const [showBB, setShowBB] = useState(false)
  const [showFib, setShowFib] = useState(false)
  const [showPatterns, setShowPatterns] = useState(false)
  const [showPivot, setShowPivot] = useState(false)
  const [showSAR, setShowSAR] = useState(false)
  const [panels, setPanels] = useState<Set<IndicatorPanel>>(new Set())

  const togglePanel = useCallback((panel: IndicatorPanel) => {
    setPanels((prev) => {
      const next = new Set(prev)
      if (next.has(panel)) next.delete(panel)
      else next.add(panel)
      return next
    })
  }, [])

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
    if (!chartContainerRef.current || !data?.data?.length) return

    // Cleanup previous charts
    for (const c of chartsRef.current) {
      try { c.remove() } catch { /* already removed */ }
    }
    chartsRef.current = []

    import("lightweight-charts").then((lc) => {
      const { createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries, ColorType } = lc
      if (!chartContainerRef.current) return

      const isDark = document.documentElement.classList.contains("dark")

      const chartOpts = {
        width: chartContainerRef.current.clientWidth,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" } as const,
          textColor: isDark ? "#9ca3af" : "#6b7280",
        },
        grid: {
          vertLines: { color: isDark ? "#374151" : "#f3f4f6" },
          horzLines: { color: isDark ? "#374151" : "#f3f4f6" },
        },
        crosshair: { mode: 1 as const },
        rightPriceScale: { borderColor: isDark ? "#374151" : "#e5e7eb" },
        timeScale: {
          borderColor: isDark ? "#374151" : "#e5e7eb",
          timeVisible: false,
        },
      }

      // ── Main chart ──
      const mainChart = createChart(chartContainerRef.current, {
        ...chartOpts,
        height: 300,
      })
      chartsRef.current.push(mainChart)

      const candleSeries = mainChart.addSeries(CandlestickSeries, {
        upColor: "#ef4444",
        downColor: "#3b82f6",
        borderUpColor: "#ef4444",
        borderDownColor: "#3b82f6",
        wickUpColor: "#ef4444",
        wickDownColor: "#3b82f6",
      })

      const volumeSeries = mainChart.addSeries(HistogramSeries, {
        color: "#6b7280",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      })
      mainChart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      })

      const times = data.data.map((d) => d.time as import("lightweight-charts").Time)
      const closes = data.data.map((d) => d.close)
      const highs = data.data.map((d) => d.high)
      const lows = data.data.map((d) => d.low)

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

      // ── MA / EMA overlay ──
      if (maType !== "off" && data.data.length >= 5) {
        const calcFn = maType === "EMA" ? calculateEMA : calculateMA
        const maConfigs = [
          { period: 5, color: "#f59e0b" },
          { period: 20, color: "#8b5cf6" },
          { period: 60, color: "#10b981" },
        ]
        for (const mc of maConfigs) {
          if (data.data.length < mc.period) continue
          const values = calcFn(closes, mc.period)
          const lineData = values
            .map((v, i) => (v != null ? { time: times[i], value: v } : null))
            .filter((x): x is { time: import("lightweight-charts").Time; value: number } => x !== null)
          if (lineData.length > 0) {
            const s = mainChart.addSeries(LineSeries, {
              color: mc.color,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            })
            s.setData(lineData)
          }
        }
      }

      // ── Bollinger Bands overlay ──
      if (showBB && data.data.length >= 20) {
        const bb = calculateBollingerBands(closes)
        const bbColors = [
          { values: bb.upper, color: "rgba(147,51,234,0.5)" },
          { values: bb.middle, color: "rgba(147,51,234,0.3)" },
          { values: bb.lower, color: "rgba(147,51,234,0.5)" },
        ]
        for (const { values, color } of bbColors) {
          const lineData = values
            .map((v, i) => (v != null ? { time: times[i], value: v } : null))
            .filter((x): x is { time: import("lightweight-charts").Time; value: number } => x !== null)
          if (lineData.length > 0) {
            const s = mainChart.addSeries(LineSeries, {
              color,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            })
            s.setData(lineData)
          }
        }
      }

      // ── Pivot Points overlay ──
      if (showPivot && data.data.length >= 1) {
        const pivots = calculatePivotPoints(highs, lows, closes)
        // 마지막 봉의 피봇 포인트만 수평선으로 표시
        const lastPivot = pivots[pivots.length - 1]
        if (lastPivot) {
          const pivotLines = [
            { value: lastPivot.pp, color: "rgba(251,191,36,0.7)", style: 0, title: "PP" },
            { value: lastPivot.r1, color: "rgba(239,68,68,0.5)", style: 2, title: "R1" },
            { value: lastPivot.r2, color: "rgba(239,68,68,0.3)", style: 3, title: "R2" },
            { value: lastPivot.s1, color: "rgba(59,130,246,0.5)", style: 2, title: "S1" },
            { value: lastPivot.s2, color: "rgba(59,130,246,0.3)", style: 3, title: "S2" },
          ]
          const pivotTimes = [times[0], times[times.length - 1]]
          for (const pl of pivotLines) {
            const s = mainChart.addSeries(LineSeries, {
              color: pl.color,
              lineWidth: 1,
              lineStyle: pl.style as 0 | 1 | 2 | 3 | 4,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              title: pl.title,
            })
            s.setData(pivotTimes.map((t) => ({ time: t, value: pl.value })))
          }
        }
      }

      // ── Parabolic SAR overlay ──
      if (showSAR && data.data.length >= 2) {
        const sarValues = calculateParabolicSAR(highs, lows)
        if (sarValues.length > 0) {
          const sarSeries = mainChart.addSeries(LineSeries, {
            color: "rgba(0,0,0,0)",  // 선 숨김, 마커만 표시
            lineWidth: 1 as const,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          })
          sarSeries.setData(
            sarValues.map((p) => ({ time: times[p.index], value: p.value }))
          )
          // 위/아래 마커로 추세 표시
          import("lightweight-charts").then(({ createSeriesMarkers: csm }) => {
            const sarMarkers = sarValues.map((p) => ({
              time: times[p.index] as import("lightweight-charts").Time,
              position: p.isUpTrend ? "belowBar" as const : "aboveBar" as const,
              color: p.isUpTrend ? "#ef4444" : "#3b82f6",
              shape: "circle" as const,
              size: 0.5,
              text: "",
            }))
            csm(sarSeries, sarMarkers)
          })
        }
      }

      // ── Fibonacci Retracement overlay ──
      if (showFib && data.data.length >= 5) {
        const fibLevels = calculateFibonacciLevels(highs, lows)
        const fibColors = [
          "rgba(239,68,68,0.4)",   // 0%
          "rgba(249,115,22,0.4)",  // 23.6%
          "rgba(234,179,8,0.4)",   // 38.2%
          "rgba(34,197,94,0.4)",   // 50%
          "rgba(59,130,246,0.4)",  // 61.8%
          "rgba(139,92,246,0.4)",  // 78.6%
          "rgba(236,72,153,0.4)",  // 100%
        ]
        const fibTimes = [times[0], times[times.length - 1]]
        fibLevels.forEach((fib, idx) => {
          const s = mainChart.addSeries(LineSeries, {
            color: fibColors[idx] || "rgba(128,128,128,0.4)",
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            title: fib.label,
          })
          s.setData(fibTimes.map((t) => ({ time: t, value: fib.price })))
        })
      }

      // ── Candle Pattern markers ──
      if (showPatterns && data.data.length >= 3) {
        const opens = data.data.map((d) => d.open)
        // 기본 패턴 + 확장 패턴 합산
        const allPatterns = [
          ...detectCandlePatterns(opens, highs, lows, closes),
          ...detectMorningStar(opens, highs, lows, closes),
          ...detectEveningStar(opens, highs, lows, closes),
          ...detectHarami(opens, closes),
          ...detectThreeWhiteSoldiers(opens, highs, lows, closes),
          ...detectThreeBlackCrows(opens, highs, lows, closes),
        ]
        // 같은 인덱스 중복 제거 (첫 번째 패턴 우선)
        const seen = new Set<number>()
        const dedupedPatterns = allPatterns.filter((p) => {
          if (seen.has(p.index)) return false
          seen.add(p.index)
          return true
        })
        if (dedupedPatterns.length > 0) {
          const markers = dedupedPatterns.map((p) => ({
            time: times[p.index] as import("lightweight-charts").Time,
            position: p.signal === "bullish" ? "belowBar" as const : "aboveBar" as const,
            color: p.signal === "bullish" ? "#ef4444" : "#3b82f6",
            shape: p.signal === "bullish" ? "arrowUp" as const : "arrowDown" as const,
            text: p.nameKr,
          }))
          createSeriesMarkers(candleSeries, markers)
        }
      }

      mainChart.timeScale().fitContent()

      // Helper: create sub-panel chart
      function createSubPanel(
        container: HTMLDivElement | null,
        height: number
      ) {
        if (!container) return null
        const subChart = createChart(container, { ...chartOpts, height })
        chartsRef.current.push(subChart)

        // Sync time scales
        mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range) subChart.timeScale().setVisibleLogicalRange(range)
        })
        subChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range) mainChart.timeScale().setVisibleLogicalRange(range)
        })

        return subChart
      }

      // ── MACD panel ──
      if (panels.has("MACD") && data.data.length >= 26) {
        const subChart = createSubPanel(macdContainerRef.current, 120)
        if (subChart) {
          const macd = calculateMACD(closes)

          const histSeries = subChart.addSeries(HistogramSeries, {
            priceFormat: { type: "price", precision: 2, minMove: 0.01 },
            priceScaleId: "macd",
          })
          histSeries.setData(
            macd.histogram
              .map((v, i) =>
                v != null
                  ? { time: times[i], value: v, color: v >= 0 ? "#ef4444" : "#3b82f6" }
                  : null
              )
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          const macdLine = subChart.addSeries(LineSeries, {
            color: "#f59e0b",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            priceScaleId: "macd",
          })
          macdLine.setData(
            macd.macdLine
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          const signalLine = subChart.addSeries(LineSeries, {
            color: "#ef4444",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            priceScaleId: "macd",
          })
          signalLine.setData(
            macd.signal
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          subChart.timeScale().fitContent()
        }
      }

      // ── RSI panel ──
      if (panels.has("RSI") && data.data.length >= 15) {
        const subChart = createSubPanel(rsiContainerRef.current, 100)
        if (subChart) {
          const rsiValues = calculateRSI(closes)

          const rsiSeries = subChart.addSeries(LineSeries, {
            color: "#8b5cf6",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          rsiSeries.setData(
            rsiValues
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          // 30/70 reference lines
          const refTimes = [times[0], times[times.length - 1]]
          for (const level of [30, 70]) {
            const refSeries = subChart.addSeries(LineSeries, {
              color: level === 70 ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)",
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            })
            refSeries.setData(refTimes.map((t) => ({ time: t, value: level })))
          }

          subChart.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } })
          subChart.timeScale().fitContent()
        }
      }

      // ── Stochastic panel ──
      if (panels.has("Stochastic") && data.data.length >= 14) {
        const subChart = createSubPanel(stochContainerRef.current, 100)
        if (subChart) {
          const stoch = calculateStochastic(highs, lows, closes)

          const kSeries = subChart.addSeries(LineSeries, {
            color: "#3b82f6",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          kSeries.setData(
            stoch.k
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          const dSeries = subChart.addSeries(LineSeries, {
            color: "#ef4444",
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          dSeries.setData(
            stoch.d
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          // 20/80 reference lines
          const refTimes = [times[0], times[times.length - 1]]
          for (const level of [20, 80]) {
            const refSeries = subChart.addSeries(LineSeries, {
              color: level === 80 ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)",
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            })
            refSeries.setData(refTimes.map((t) => ({ time: t, value: level })))
          }

          subChart.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } })
          subChart.timeScale().fitContent()
        }
      }

      // ── OBV panel ──
      if (panels.has("OBV") && data.data.length >= 2) {
        const subChart = createSubPanel(obvContainerRef.current, 100)
        if (subChart) {
          const volumes = data.data.map((d) => d.volume)
          const obvValues = calculateOBV(closes, volumes)

          const obvSeries = subChart.addSeries(LineSeries, {
            color: "#10b981",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          obvSeries.setData(
            obvValues.map((v, i) => ({ time: times[i], value: v }))
          )

          subChart.timeScale().fitContent()
        }
      }

      // ── ATR panel ──
      if (panels.has("ATR") && data.data.length >= 14) {
        const subChart = createSubPanel(atrContainerRef.current, 100)
        if (subChart) {
          const atrValues = calculateATR(highs, lows, closes)

          const atrSeries = subChart.addSeries(LineSeries, {
            color: "#f59e0b",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          atrSeries.setData(
            atrValues
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          subChart.timeScale().fitContent()
        }
      }

      // ── ROC panel ──
      if (panels.has("ROC") && data.data.length >= 13) {
        const subChart = createSubPanel(rocContainerRef.current, 100)
        if (subChart) {
          const rocValues = calculateROC(closes)

          const rocSeries = subChart.addSeries(LineSeries, {
            color: "#06b6d4",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          rocSeries.setData(
            rocValues
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          // 0 기준선
          const refTimes = [times[0], times[times.length - 1]]
          const zeroSeries = subChart.addSeries(LineSeries, {
            color: "rgba(156,163,175,0.4)",
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          })
          zeroSeries.setData(refTimes.map((t) => ({ time: t, value: 0 })))

          subChart.timeScale().fitContent()
        }
      }

      // ── MFI panel ──
      if (panels.has("MFI") && data.data.length >= 15) {
        const subChart = createSubPanel(mfiContainerRef.current, 100)
        if (subChart) {
          const volumes = data.data.map((d) => d.volume)
          const mfiValues = calculateMFI(highs, lows, closes, volumes)

          const mfiSeries = subChart.addSeries(LineSeries, {
            color: "#a855f7",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          mfiSeries.setData(
            mfiValues
              .map((v, i) => (v != null ? { time: times[i], value: v } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          // 20/80 과매도/과매수선
          const refTimes = [times[0], times[times.length - 1]]
          for (const level of [20, 80]) {
            const refSeries = subChart.addSeries(LineSeries, {
              color: level === 80 ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)",
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            })
            refSeries.setData(refTimes.map((t) => ({ time: t, value: level })))
          }

          subChart.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } })
          subChart.timeScale().fitContent()
        }
      }

      // ── A/D Line panel ──
      if (panels.has("ADLine") && data.data.length >= 2) {
        const subChart = createSubPanel(adLineContainerRef.current, 100)
        if (subChart) {
          const volumes = data.data.map((d) => d.volume)
          const adValues = calculateADLine(highs, lows, closes, volumes)

          const adSeries = subChart.addSeries(LineSeries, {
            color: "#f97316",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          adSeries.setData(adValues.map((v, i) => ({ time: times[i], value: v })))

          subChart.timeScale().fitContent()
        }
      }

      // ── ADX panel ──
      if (panels.has("ADX") && data.data.length >= 28) {
        const subChart = createSubPanel(adxContainerRef.current, 120)
        if (subChart) {
          const adxValues = calculateADX(highs, lows, closes)

          // ADX 선
          const adxSeries = subChart.addSeries(LineSeries, {
            color: "#f59e0b",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          adxSeries.setData(
            adxValues
              .map((v, i) => (v.adx != null ? { time: times[i], value: v.adx } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          // +DI 선
          const plusDISeries = subChart.addSeries(LineSeries, {
            color: "#ef4444",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          plusDISeries.setData(
            adxValues
              .map((v, i) => (v.plusDI != null ? { time: times[i], value: v.plusDI } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          // -DI 선
          const minusDISeries = subChart.addSeries(LineSeries, {
            color: "#3b82f6",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          minusDISeries.setData(
            adxValues
              .map((v, i) => (v.minusDI != null ? { time: times[i], value: v.minusDI } : null))
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )

          // 25 기준선 (추세 유의미 구분)
          const refTimes = [times[0], times[times.length - 1]]
          const refSeries = subChart.addSeries(LineSeries, {
            color: "rgba(156,163,175,0.4)",
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          })
          refSeries.setData(refTimes.map((t) => ({ time: t, value: 25 })))

          subChart.timeScale().fitContent()
        }
      }

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        if (!chartContainerRef.current) return
        const w = chartContainerRef.current.clientWidth
        for (const c of chartsRef.current) {
          try { c.applyOptions({ width: w }) } catch { /* noop */ }
        }
      })
      resizeObserver.observe(chartContainerRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    })

    return () => {
      for (const c of chartsRef.current) {
        try { c.remove() } catch { /* noop */ }
      }
      chartsRef.current = []
    }
  }, [data, maType, showBB, showFib, showPatterns, showPivot, showSAR, panels])

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

        {/* MA type toggle */}
        {(["SMA", "EMA"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMAType(maType === t ? "off" : t)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              maType === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}

        {/* 추세 오버레이 */}
        {([
          { key: "BB", label: "BB", active: showBB, toggle: () => setShowBB(!showBB) },
          { key: "Pivot", label: "Pivot", active: showPivot, toggle: () => setShowPivot(!showPivot) },
          { key: "Fib", label: "Fib", active: showFib, toggle: () => setShowFib(!showFib) },
          { key: "SAR", label: "SAR", active: showSAR, toggle: () => setShowSAR(!showSAR) },
          { key: "Patterns", label: "패턴", active: showPatterns, toggle: () => setShowPatterns(!showPatterns) },
        ]).map(({ key, label, active, toggle }) => (
          <button
            key={key}
            onClick={toggle}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}

        <div className="w-px h-4 bg-border mx-1" />

        {/* 서브 패널 토글 */}
        {([
          { panel: "MACD", label: "MACD" },
          { panel: "RSI", label: "RSI" },
          { panel: "Stochastic", label: "Stoch" },
          { panel: "OBV", label: "OBV" },
          { panel: "ATR", label: "ATR" },
          { panel: "ROC", label: "ROC" },
          { panel: "MFI", label: "MFI" },
          { panel: "ADLine", label: "A/D" },
          { panel: "ADX", label: "ADX" },
        ] as { panel: IndicatorPanel; label: string }[]).map(({ panel, label }) => (
          <button
            key={panel}
            onClick={() => togglePanel(panel)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              panels.has(panel)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
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

      {/* Sub-panels */}
      {panels.has("MACD") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">MACD (12,26,9)</div>
          <div ref={macdContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("RSI") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">RSI (14)</div>
          <div ref={rsiContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("Stochastic") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">Stochastic (14,3)</div>
          <div ref={stochContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("OBV") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">OBV</div>
          <div ref={obvContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("ATR") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">ATR (14)</div>
          <div ref={atrContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("ROC") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">ROC (12)</div>
          <div ref={rocContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("MFI") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">MFI (14)</div>
          <div ref={mfiContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("ADLine") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">A/D Line</div>
          <div ref={adLineContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("ADX") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5">ADX (14) — <span className="text-amber-500">ADX</span> <span className="text-red-500">+DI</span> <span className="text-blue-500">-DI</span></div>
          <div ref={adxContainerRef} className="w-full" />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
        <span>최근 {PERIOD_LABELS[period]} 일봉</span>
        <span>·</span>
        <span>상승 <span className="text-red-500">빨강</span> / 하락 <span className="text-blue-500">파랑</span></span>
        {maType !== "off" && (
          <>
            <span>·</span>
            <span>{maType}:</span>
            <span className="text-amber-500">5</span>
            <span className="text-violet-500">20</span>
            <span className="text-emerald-500">60</span>
          </>
        )}
        {showBB && (
          <>
            <span>·</span>
            <span className="text-purple-500">BB(20,2)</span>
          </>
        )}
        {showFib && (
          <>
            <span>·</span>
            <span className="text-orange-400">Fibonacci</span>
          </>
        )}
      </div>
    </div>
  )
}
