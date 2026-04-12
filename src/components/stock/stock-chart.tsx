"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useChartData } from "@/hooks/use-chart-data"
import { ChartControls, ChartLegend } from "@/components/stock/chart-controls"
import type { MAType, IndicatorPanel } from "@/components/stock/chart-controls"
import type { ChartPeriod } from "@/types/stock"
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
  calculateKeltnerChannel,
  detectCandlePatterns,
  detectMorningStar,
  detectEveningStar,
  detectHarami,
  detectThreeWhiteSoldiers,
  detectThreeBlackCrows,
} from "@/lib/utils/technical-indicators"

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
  const [showKC, setShowKC] = useState(false)
  const [showHA, setShowHA] = useState(false)
  const [panels, setPanels] = useState<Set<IndicatorPanel>>(new Set())
  const [rsiPeriod, setRsiPeriod] = useState(14)
  const [macdParams, setMacdParams] = useState({ fast: 12, slow: 26, signal: 9 })

  const togglePanel = useCallback((panel: IndicatorPanel) => {
    setPanels((prev) => {
      const next = new Set(prev)
      if (next.has(panel)) next.delete(panel)
      else next.add(panel)
      return next
    })
  }, [])

  const { data, haData, isLoading, isError } = useChartData(ticker, period)

  useEffect(() => {
    if (!chartContainerRef.current || !data?.data?.length) return
    let cancelled = false

    // Cleanup previous charts
    for (const c of chartsRef.current) {
      try { c.remove() } catch { /* already removed */ }
    }
    chartsRef.current = []

    import("lightweight-charts").then((lc) => {
      if (cancelled || !chartContainerRef.current) return
      const { createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries, ColorType } = lc

      function getChartVar(name: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888888"
      }
      function hexAlpha(name: string, alpha: number): string {
        const hex = getChartVar(name)
        const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)
        if (!m) return `rgba(128,128,128,${alpha})`
        return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${alpha})`
      }

      const chartOpts = {
        width: chartContainerRef.current.clientWidth,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" } as const,
          textColor: getChartVar("--chart-hex-text"),
        },
        grid: {
          vertLines: { color: getChartVar("--chart-hex-border-subtle") },
          horzLines: { color: getChartVar("--chart-hex-border-subtle") },
        },
        crosshair: { mode: 1 as const },
        rightPriceScale: { borderColor: getChartVar("--chart-hex-border") },
        timeScale: {
          borderColor: getChartVar("--chart-hex-border"),
          timeVisible: false,
        },
      }

      // ── Main chart ──
      const mainChart = createChart(chartContainerRef.current, {
        ...chartOpts,
        height: 300,
      })
      chartsRef.current.push(mainChart)

      const stockUp = getChartVar("--chart-hex-stock-up")
      const stockDown = getChartVar("--chart-hex-stock-down")

      const candleSeries = mainChart.addSeries(CandlestickSeries, {
        upColor: stockUp,
        downColor: stockDown,
        borderUpColor: stockUp,
        borderDownColor: stockDown,
        wickUpColor: stockUp,
        wickDownColor: stockDown,
      })

      const volumeSeries = mainChart.addSeries(HistogramSeries, {
        color: getChartVar("--chart-hex-text"),
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

      const candleSource = showHA ? haData : data.data
      candleSeries.setData(
        candleSource.map((d, i) => ({
          time: data.data[i].time as import("lightweight-charts").Time,
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
          color: d.close >= d.open ? getChartVar("--chart-hex-volume-up") : getChartVar("--chart-hex-volume-down"),
        }))
      )

      // Helper: add line overlay series
      function addLineSeries(values: (number | null)[], color: string, opts?: { lineStyle?: number; title?: string }) {
        const lineData = values
          .map((v, i) => (v != null ? { time: times[i], value: v } : null))
          .filter((x): x is { time: import("lightweight-charts").Time; value: number } => x !== null)
        if (lineData.length === 0) return
        const s = mainChart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lineStyle: (opts?.lineStyle ?? 0) as 0 | 1 | 2 | 3 | 4,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          title: opts?.title,
        })
        s.setData(lineData)
      }

      // ── MA / EMA overlay ──
      if (maType !== "off" && data.data.length >= 5) {
        const calcFn = maType === "EMA" ? calculateEMA : calculateMA
        const maConfigs = [
          { period: 5, color: getChartVar("--chart-hex-series-4") },
          { period: 20, color: getChartVar("--chart-hex-series-3") },
          { period: 60, color: getChartVar("--chart-hex-series-1") },
        ]
        for (const mc of maConfigs) {
          if (data.data.length < mc.period) continue
          addLineSeries(calcFn(closes, mc.period), mc.color)
        }
      }

      // ── Bollinger Bands overlay ──
      if (showBB && data.data.length >= 20) {
        const bb = calculateBollingerBands(closes)
        addLineSeries(bb.upper, hexAlpha("--chart-hex-series-3", 0.5))
        addLineSeries(bb.middle, hexAlpha("--chart-hex-series-3", 0.3))
        addLineSeries(bb.lower, hexAlpha("--chart-hex-series-3", 0.5))
      }

      // ── Pivot Points overlay ──
      if (showPivot && data.data.length >= 1) {
        const pivots = calculatePivotPoints(highs, lows, closes)
        const lastPivot = pivots[pivots.length - 1]
        if (lastPivot) {
          const pivotLines = [
            { value: lastPivot.pp, color: hexAlpha("--chart-hex-series-4", 0.7), style: 0, title: "PP" },
            { value: lastPivot.r1, color: hexAlpha("--chart-hex-stock-up", 0.5), style: 2, title: "R1" },
            { value: lastPivot.r2, color: hexAlpha("--chart-hex-stock-up", 0.3), style: 3, title: "R2" },
            { value: lastPivot.s1, color: hexAlpha("--chart-hex-stock-down", 0.5), style: 2, title: "S1" },
            { value: lastPivot.s2, color: hexAlpha("--chart-hex-stock-down", 0.3), style: 3, title: "S2" },
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
            color: "transparent",
            lineWidth: 1 as const,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          })
          sarSeries.setData(
            sarValues.map((p) => ({ time: times[p.index], value: p.value }))
          )
          import("lightweight-charts").then(({ createSeriesMarkers: csm }) => {
            const sarMarkers = sarValues.map((p) => ({
              time: times[p.index] as import("lightweight-charts").Time,
              position: p.isUpTrend ? "belowBar" as const : "aboveBar" as const,
              color: p.isUpTrend ? getChartVar("--chart-hex-stock-up") : getChartVar("--chart-hex-stock-down"),
              shape: "circle" as const,
              size: 0.5,
              text: "",
            }))
            csm(sarSeries, sarMarkers)
          })
        }
      }

      // ── Keltner Channel overlay ──
      if (showKC && data.data.length >= 20) {
        const kc = calculateKeltnerChannel(highs, lows, closes)
        addLineSeries(kc.upper, hexAlpha("--chart-hex-series-5", 0.5))
        addLineSeries(kc.middle, hexAlpha("--chart-hex-series-5", 0.3))
        addLineSeries(kc.lower, hexAlpha("--chart-hex-series-5", 0.5))
      }

      // ── Fibonacci Retracement overlay ──
      if (showFib && data.data.length >= 5) {
        const fibLevels = calculateFibonacciLevels(highs, lows)
        const fibColors = [
          hexAlpha("--chart-hex-stock-up", 0.4), hexAlpha("--chart-hex-series-7", 0.4), hexAlpha("--chart-hex-series-4", 0.4),
          hexAlpha("--chart-hex-series-1", 0.4), hexAlpha("--chart-hex-stock-down", 0.4), hexAlpha("--chart-hex-series-3", 0.4),
          hexAlpha("--chart-hex-series-6", 0.4),
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
        const allPatterns = [
          ...detectCandlePatterns(opens, highs, lows, closes),
          ...detectMorningStar(opens, highs, lows, closes),
          ...detectEveningStar(opens, highs, lows, closes),
          ...detectHarami(opens, closes),
          ...detectThreeWhiteSoldiers(opens, highs, lows, closes),
          ...detectThreeBlackCrows(opens, highs, lows, closes),
        ]
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
            color: p.signal === "bullish" ? getChartVar("--chart-hex-stock-up") : getChartVar("--chart-hex-stock-down"),
            shape: p.signal === "bullish" ? "arrowUp" as const : "arrowDown" as const,
            text: p.nameKr,
          }))
          createSeriesMarkers(candleSeries, markers)
        }
      }

      mainChart.timeScale().fitContent()

      // Helper: create sub-panel chart
      function createSubPanel(container: HTMLDivElement | null, height: number) {
        if (!container) return null
        const subChart = createChart(container, { ...chartOpts, height })
        chartsRef.current.push(subChart)
        mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range) subChart.timeScale().setVisibleLogicalRange(range)
        })
        subChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range) mainChart.timeScale().setVisibleLogicalRange(range)
        })
        return subChart
      }

      // Helper: add reference lines to sub panel
      function addRefLines(subChart: ReturnType<typeof createChart>, levels: number[], colors: string[]) {
        const refTimes = [times[0], times[times.length - 1]]
        levels.forEach((level, i) => {
          const s = subChart.addSeries(LineSeries, {
            color: colors[i],
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          })
          s.setData(refTimes.map((t) => ({ time: t, value: level })))
        })
      }

      // Helper: filter nulls from indicator values
      function filterNulls(values: (number | null)[]) {
        return values
          .map((v, i) => (v != null ? { time: times[i], value: v } : null))
          .filter((x): x is NonNullable<typeof x> => x !== null)
      }

      // ── MACD panel ──
      if (panels.has("MACD") && data.data.length >= macdParams.slow) {
        const subChart = createSubPanel(macdContainerRef.current, 120)
        if (subChart) {
          const macd = calculateMACD(closes, macdParams.fast, macdParams.slow, macdParams.signal)
          const histSeries = subChart.addSeries(HistogramSeries, {
            priceFormat: { type: "price", precision: 2, minMove: 0.01 },
            priceScaleId: "macd",
          })
          histSeries.setData(
            macd.histogram
              .map((v, i) => v != null ? { time: times[i], value: v, color: v >= 0 ? getChartVar("--chart-hex-stock-up") : getChartVar("--chart-hex-stock-down") } : null)
              .filter((x): x is NonNullable<typeof x> => x !== null)
          )
          const macdLine = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-series-4"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false, priceScaleId: "macd" })
          macdLine.setData(filterNulls(macd.macdLine))
          const signalLine = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-stock-up"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false, priceScaleId: "macd" })
          signalLine.setData(filterNulls(macd.signal))
          subChart.timeScale().fitContent()
        }
      }

      // ── RSI panel ──
      if (panels.has("RSI") && data.data.length >= rsiPeriod + 1) {
        const subChart = createSubPanel(rsiContainerRef.current, 100)
        if (subChart) {
          const rsiSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-series-3"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          rsiSeries.setData(filterNulls(calculateRSI(closes, rsiPeriod)))
          addRefLines(subChart, [30, 70], [hexAlpha("--chart-hex-stock-down", 0.3), hexAlpha("--chart-hex-stock-up", 0.3)])
          subChart.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } })
          subChart.timeScale().fitContent()
        }
      }

      // ── Stochastic panel ──
      if (panels.has("Stochastic") && data.data.length >= 14) {
        const subChart = createSubPanel(stochContainerRef.current, 100)
        if (subChart) {
          const stoch = calculateStochastic(highs, lows, closes)
          const kSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-stock-down"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          kSeries.setData(filterNulls(stoch.k))
          const dSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-stock-up"), lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
          dSeries.setData(filterNulls(stoch.d))
          addRefLines(subChart, [20, 80], [hexAlpha("--chart-hex-stock-down", 0.3), hexAlpha("--chart-hex-stock-up", 0.3)])
          subChart.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } })
          subChart.timeScale().fitContent()
        }
      }

      // ── OBV panel ──
      if (panels.has("OBV") && data.data.length >= 2) {
        const subChart = createSubPanel(obvContainerRef.current, 100)
        if (subChart) {
          const volumes = data.data.map((d) => d.volume)
          const obvSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-series-1"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          obvSeries.setData(calculateOBV(closes, volumes).map((v, i) => ({ time: times[i], value: v })))
          subChart.timeScale().fitContent()
        }
      }

      // ── ATR panel ──
      if (panels.has("ATR") && data.data.length >= 14) {
        const subChart = createSubPanel(atrContainerRef.current, 100)
        if (subChart) {
          const atrSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-series-4"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          atrSeries.setData(filterNulls(calculateATR(highs, lows, closes)))
          subChart.timeScale().fitContent()
        }
      }

      // ── ROC panel ──
      if (panels.has("ROC") && data.data.length >= 13) {
        const subChart = createSubPanel(rocContainerRef.current, 100)
        if (subChart) {
          const rocSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-series-5"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          rocSeries.setData(filterNulls(calculateROC(closes)))
          addRefLines(subChart, [0], [hexAlpha("--chart-hex-flat", 0.4)])
          subChart.timeScale().fitContent()
        }
      }

      // ── MFI panel ──
      if (panels.has("MFI") && data.data.length >= 15) {
        const subChart = createSubPanel(mfiContainerRef.current, 100)
        if (subChart) {
          const volumes = data.data.map((d) => d.volume)
          const mfiSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-series-6"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          mfiSeries.setData(filterNulls(calculateMFI(highs, lows, closes, volumes)))
          addRefLines(subChart, [20, 80], [hexAlpha("--chart-hex-stock-down", 0.3), hexAlpha("--chart-hex-stock-up", 0.3)])
          subChart.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } })
          subChart.timeScale().fitContent()
        }
      }

      // ── A/D Line panel ──
      if (panels.has("ADLine") && data.data.length >= 2) {
        const subChart = createSubPanel(adLineContainerRef.current, 100)
        if (subChart) {
          const volumes = data.data.map((d) => d.volume)
          const adSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-series-7"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          adSeries.setData(calculateADLine(highs, lows, closes, volumes).map((v, i) => ({ time: times[i], value: v })))
          subChart.timeScale().fitContent()
        }
      }

      // ── ADX panel ──
      if (panels.has("ADX") && data.data.length >= 28) {
        const subChart = createSubPanel(adxContainerRef.current, 120)
        if (subChart) {
          const adxValues = calculateADX(highs, lows, closes)
          const adxSeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-series-4"), lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
          adxSeries.setData(filterNulls(adxValues.map((v) => v.adx)))
          const plusDISeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-stock-up"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          plusDISeries.setData(filterNulls(adxValues.map((v) => v.plusDI)))
          const minusDISeries = subChart.addSeries(LineSeries, { color: getChartVar("--chart-hex-stock-down"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          minusDISeries.setData(filterNulls(adxValues.map((v) => v.minusDI)))
          addRefLines(subChart, [25], [hexAlpha("--chart-hex-flat", 0.4)])
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
      cancelled = true
      for (const c of chartsRef.current) {
        try { c.remove() } catch { /* noop */ }
      }
      chartsRef.current = []
    }
  }, [data, haData, showHA, maType, showBB, showKC, showFib, showPatterns, showPivot, showSAR, panels, rsiPeriod, macdParams])

  return (
    <div className="w-full">
      <ChartControls
        ticker={ticker} period={period} setPeriod={setPeriod}
        maType={maType} setMAType={setMAType}
        showBB={showBB} setShowBB={setShowBB}
        showFib={showFib} setShowFib={setShowFib}
        showPatterns={showPatterns} setShowPatterns={setShowPatterns}
        showPivot={showPivot} setShowPivot={setShowPivot}
        showSAR={showSAR} setShowSAR={setShowSAR}
        showKC={showKC} setShowKC={setShowKC}
        showHA={showHA} setShowHA={setShowHA}
        panels={panels} togglePanel={togglePanel}
      />

      {/* 차트 영역 */}
      <div className="relative">
        {showHA && (
          <div className="absolute top-1 left-1 z-10 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded pointer-events-none">
            평균가 기반 차트 (하이킨아시)
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg z-10 animate-pulse">
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
        <div ref={chartContainerRef} className="w-full min-h-[300px]" />
      </div>

      {/* Sub-panels */}
      {panels.has("MACD") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
            <span>MACD</span>
            <select
              value={`${macdParams.fast},${macdParams.slow},${macdParams.signal}`}
              onChange={(e) => {
                const [f, s, sg] = e.target.value.split(",").map(Number)
                setMacdParams({ fast: f, slow: s, signal: sg })
              }}
              className="bg-transparent border border-border rounded px-1 text-[10px] cursor-pointer"
            >
              <option value="12,26,9">12,26,9</option>
              <option value="8,17,9">8,17,9</option>
              <option value="5,35,5">5,35,5</option>
            </select>
          </div>
          <div ref={macdContainerRef} className="w-full" />
        </div>
      )}
      {panels.has("RSI") && (
        <div className="mt-1">
          <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
            <span>RSI</span>
            <select
              value={rsiPeriod}
              onChange={(e) => setRsiPeriod(Number(e.target.value))}
              className="bg-transparent border border-border rounded px-1 text-[10px] cursor-pointer"
            >
              <option value={7}>7</option>
              <option value={14}>14</option>
              <option value={21}>21</option>
            </select>
          </div>
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

      <ChartLegend period={period} maType={maType} showBB={showBB} showKC={showKC} showFib={showFib} />
    </div>
  )
}
