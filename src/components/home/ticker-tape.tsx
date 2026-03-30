"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface IndexItem {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

interface TickerTapeProps {
  indices: IndexItem[]
  exchangeRate?: { rate: number; change: number; changePercent: number }
}

function formatValue(v: number) {
  return v >= 100
    ? v.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
    : v.toFixed(2)
}

function symbolToHref(symbol: string): string {
  return "/market"
}

function TickerItem({ item }: { item: IndexItem }) {
  const isUp = item.changePercent > 0
  const isDown = item.changePercent < 0

  return (
    <Link
      href={symbolToHref(item.symbol)}
      className="flex items-center gap-2 px-4 shrink-0 hover:opacity-75 transition-opacity"
    >
      <span className="text-[var(--fg-secondary)]">{item.name}</span>
      <span className="text-[var(--fg-primary)]">{formatValue(item.value)}</span>
      <span
        className={cn(
          isUp && "text-stock-up",
          isDown && "text-stock-down",
          !isUp && !isDown && "text-[var(--fg-muted)]"
        )}
      >
        {item.changePercent >= 0 ? "+" : ""}
        {item.changePercent.toFixed(2)}%
      </span>
    </Link>
  )
}

function ExchangeRateItem({ rate }: { rate: NonNullable<TickerTapeProps["exchangeRate"]> }) {
  const isUp = rate.changePercent > 0
  const isDown = rate.changePercent < 0

  return (
    <Link
      href="/market"
      className="flex items-center gap-2 px-4 shrink-0 hover:opacity-75 transition-opacity"
    >
      <span className="text-[var(--fg-secondary)]">USD/KRW</span>
      <span className="text-[var(--fg-primary)]">{formatValue(rate.rate)}</span>
      <span
        className={cn(
          isUp && "text-stock-up",
          isDown && "text-stock-down",
          !isUp && !isDown && "text-[var(--fg-muted)]"
        )}
      >
        {rate.changePercent >= 0 ? "+" : ""}
        {rate.changePercent.toFixed(2)}%
      </span>
    </Link>
  )
}

function Separator() {
  return <div className="w-px h-4 bg-[var(--border-default)] shrink-0" aria-hidden />
}

export function TickerTape({ indices, exchangeRate }: TickerTapeProps) {
  const items = (
    <>
      {indices.map((item, i) => (
        <span key={item.symbol} className="contents">
          {i > 0 && <Separator />}
          <TickerItem item={item} />
        </span>
      ))}
      {exchangeRate && (
        <>
          <Separator />
          <ExchangeRateItem rate={exchangeRate} />
        </>
      )}
    </>
  )

  return (
    <div
      className="w-full h-9 overflow-hidden font-mono text-xs tabular-nums select-none"
      style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      {/* prefers-reduced-motion: 정적 표시 */}
      <div className="motion-reduce:flex motion-reduce:overflow-x-auto hidden items-center h-full">
        {items}
      </div>

      {/* 무한 스크롤 (애니메이션) */}
      <div
        className="motion-reduce:hidden flex items-center h-full w-max"
        style={{ animation: "ticker-scroll 30s linear infinite" }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.animationPlayState = "paused"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.animationPlayState = "running"
        }}
      >
        {/* 2번 복제 */}
        <div className="flex items-center">{items}</div>
        <div className="flex items-center" aria-hidden>{items}</div>
      </div>
    </div>
  )
}
