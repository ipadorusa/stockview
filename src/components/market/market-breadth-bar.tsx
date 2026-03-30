interface MarketBreadthBarProps {
  advancing: number
  declining: number
  flat: number
  limitUp: number
  limitDown: number
  total: number
}

export function MarketBreadthBar({
  advancing,
  declining,
  flat,
  limitUp,
  limitDown,
  total,
}: MarketBreadthBarProps) {
  if (total === 0) return null

  const advPct = (advancing / total) * 100
  const flatPct = (flat / total) * 100
  const decPct = (declining / total) * 100

  return (
    <div>
      {/* 스택드 바 */}
      <div
        className="flex w-full rounded-full overflow-hidden"
        style={{ height: "40px" }}
        role="img"
        aria-label={`상승 ${advancing} 보합 ${flat} 하락 ${declining}`}
      >
        <div
          className="flex items-center justify-center transition-all duration-[400ms] ease-out"
          style={{
            width: `${advPct}%`,
            backgroundColor: "var(--breadth-advancing)",
          }}
        >
          {advPct >= 8 && (
            <span className="text-xs font-semibold text-white">{advancing}</span>
          )}
        </div>
        <div
          className="flex items-center justify-center transition-all duration-[400ms] ease-out"
          style={{
            width: `${flatPct}%`,
            backgroundColor: "var(--breadth-flat)",
          }}
        >
          {flatPct >= 5 && (
            <span className="text-xs font-semibold text-white">{flat}</span>
          )}
        </div>
        <div
          className="flex items-center justify-center transition-all duration-[400ms] ease-out"
          style={{
            width: `${decPct}%`,
            backgroundColor: "var(--breadth-declining)",
          }}
        >
          {decPct >= 8 && (
            <span className="text-xs font-semibold text-white">{declining}</span>
          )}
        </div>
      </div>

      {/* 범례 텍스트 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-[var(--fg-secondary)]">
        <span>
          <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: "var(--breadth-advancing)" }} />
          상승 <strong className="text-[var(--fg-primary)]">{advancing.toLocaleString()}</strong>
        </span>
        <span className="text-[var(--fg-muted)]">|</span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: "var(--breadth-flat)" }} />
          보합 <strong className="text-[var(--fg-primary)]">{flat.toLocaleString()}</strong>
        </span>
        <span className="text-[var(--fg-muted)]">|</span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: "var(--breadth-declining)" }} />
          하락 <strong className="text-[var(--fg-primary)]">{declining.toLocaleString()}</strong>
        </span>
        {(limitUp > 0 || limitDown > 0) && (
          <>
            <span className="text-[var(--fg-muted)]">·</span>
            <span>상한가 <strong className="text-stock-up">{limitUp.toLocaleString()}</strong></span>
            <span className="text-[var(--fg-muted)]">·</span>
            <span>하한가 <strong className="text-stock-down">{limitDown.toLocaleString()}</strong></span>
          </>
        )}
      </div>
    </div>
  )
}
