"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SectorData {
  name: string
  avgChangePercent: number
  totalMarketCap: number
  stockCount: number
}

interface SectorHeatmapProps {
  sectors: SectorData[]
}

function getHeatmapVar(changePercent: number): string {
  if (changePercent <= -4) return "var(--heatmap-1)"
  if (changePercent <= -3) return "var(--heatmap-2)"
  if (changePercent <= -2) return "var(--heatmap-3)"
  if (changePercent <= -1) return "var(--heatmap-4)"
  if (changePercent < 1)   return "var(--heatmap-5)"
  if (changePercent < 2)   return "var(--heatmap-6)"
  if (changePercent < 3)   return "var(--heatmap-7)"
  if (changePercent < 4)   return "var(--heatmap-8)"
  return "var(--heatmap-9)"
}

// oklch 기반 heatmap 색상: 밝기(L) 값으로 텍스트 색상 결정
// heatmap-5 (flat, gray): L=0.55 → 중간, 나머지도 0.55~0.68 → 모두 흰색 텍스트
function getTextColor(_changePercent: number): string {
  return "#ffffff"
}

export function SectorHeatmap({ sectors }: SectorHeatmapProps) {
  const router = useRouter()

  if (!sectors.length) return null

  const totalMarketCap = sectors.reduce((sum, s) => sum + s.totalMarketCap, 0)

  // fr 단위 계산: 시가총액 비율. 0이면 최소 1fr
  const gridFrs = sectors.map((s) =>
    totalMarketCap > 0 ? Math.max((s.totalMarketCap / totalMarketCap) * 100, 1) : 1
  )

  return (
    <div>
      {/* 데스크톱: CSS Grid 트리맵 */}
      <div
        className="hidden md:grid rounded-xl overflow-hidden"
        style={{
          gridTemplateColumns: gridFrs.map((fr) => `${fr}fr`).join(" "),
          height: "250px",
          gap: "2px",
        }}
      >
        {sectors.map((sector) => {
          const bg = getHeatmapVar(sector.avgChangePercent)
          const textColor = getTextColor(sector.avgChangePercent)
          const isUp = sector.avgChangePercent > 0
          const isDown = sector.avgChangePercent < 0

          return (
            <button
              key={sector.name}
              onClick={() => router.push(`/sectors/${encodeURIComponent(sector.name)}`)}
              className="flex flex-col items-center justify-center px-1 transition-transform hover:scale-[1.02] hover:z-10 relative cursor-pointer"
              style={{
                backgroundColor: bg,
                color: textColor,
                boxShadow: "none",
              }}
              title={`${sector.name}: ${isUp ? "+" : ""}${sector.avgChangePercent.toFixed(2)}% (${sector.stockCount}종목)`}
            >
              <span className="text-xs font-semibold truncate w-full text-center leading-tight px-0.5">
                {sector.name}
              </span>
              <span className="text-xs font-mono font-bold mt-0.5">
                {isUp ? "+" : ""}{sector.avgChangePercent.toFixed(2)}%
              </span>
            </button>
          )
        })}
      </div>

      {/* 모바일: 수평 바 차트 리스트 */}
      <div className="md:hidden space-y-1">
        {sectors.map((sector) => {
          const bg = getHeatmapVar(sector.avgChangePercent)
          const isUp = sector.avgChangePercent > 0
          const isDown = sector.avgChangePercent < 0
          const absMax = 5
          const barPct = Math.min(Math.abs(sector.avgChangePercent) / absMax * 100, 100)

          return (
            <button
              key={sector.name}
              onClick={() => router.push(`/sectors/${encodeURIComponent(sector.name)}`)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <span className="text-sm w-28 text-left truncate text-[var(--fg-primary)]">
                {sector.name}
              </span>
              <div className="flex-1 h-5 rounded-sm bg-[var(--border-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-300"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: bg,
                  }}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-mono w-16 text-right",
                  isUp && "text-stock-up",
                  isDown && "text-stock-down",
                  !isUp && !isDown && "text-[var(--fg-muted)]"
                )}
              >
                {isUp ? "+" : ""}{sector.avgChangePercent.toFixed(2)}%
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
