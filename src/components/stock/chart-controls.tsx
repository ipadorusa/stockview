"use client"

import { trackEvent } from "@/lib/gtm"
import type { ChartPeriod } from "@/types/stock"

const PERIOD_LABELS: Record<ChartPeriod, string> = {
  "1W": "1주",
  "2W": "2주",
  "3W": "3주",
  "1M": "1개월",
  "3M": "3개월",
  "6M": "6개월",
  "1Y": "1년",
}

export type MAType = "off" | "SMA" | "EMA"
export type IndicatorPanel = "MACD" | "RSI" | "Stochastic" | "OBV" | "ATR" | "ROC" | "MFI" | "ADLine" | "ADX"

function ToggleButton({ active, onClick, title, children }: {
  active: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-1 text-xs rounded-md transition-colors ${
        active
          ? "bg-accent text-accent-foreground border border-primary/50"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  )
}

interface ChartControlsProps {
  ticker: string
  period: ChartPeriod
  setPeriod: (p: ChartPeriod) => void
  maType: MAType
  setMAType: (t: MAType) => void
  showBB: boolean
  setShowBB: (v: boolean) => void
  showFib: boolean
  setShowFib: (v: boolean) => void
  showPatterns: boolean
  setShowPatterns: (v: boolean) => void
  showPivot: boolean
  setShowPivot: (v: boolean) => void
  showSAR: boolean
  setShowSAR: (v: boolean) => void
  showKC: boolean
  setShowKC: (v: boolean) => void
  showHA: boolean
  setShowHA: (v: boolean) => void
  panels: Set<IndicatorPanel>
  togglePanel: (p: IndicatorPanel) => void
}

export function ChartControls({
  ticker, period, setPeriod, maType, setMAType,
  showBB, setShowBB, showFib, setShowFib, showPatterns, setShowPatterns,
  showPivot, setShowPivot, showSAR, setShowSAR, showKC, setShowKC,
  showHA, setShowHA, panels, togglePanel,
}: ChartControlsProps) {
  const overlays = [
    { key: "BB", label: "BB", active: showBB, toggle: () => setShowBB(!showBB), tip: "볼린저 밴드: 이동평균 ± 표준편차. 밴드 밖으로 벗어나면 과매수/과매도" },
    { key: "KC", label: "KC", active: showKC, toggle: () => setShowKC(!showKC), tip: "켈트너 채널: EMA ± ATR. 볼린저와 함께 쓰면 스퀴즈(횡보→추세전환) 포착" },
    { key: "Pivot", label: "Pivot", active: showPivot, toggle: () => setShowPivot(!showPivot), tip: "피봇 포인트: 전일 고·저·종가로 당일 지지/저항선 계산" },
    { key: "Fib", label: "Fib", active: showFib, toggle: () => setShowFib(!showFib), tip: "피보나치 되돌림: 23.6%~78.6% 구간에서 지지/저항 확인" },
    { key: "SAR", label: "SAR", active: showSAR, toggle: () => setShowSAR(!showSAR), tip: "파라볼릭 SAR: 추세 반전 포인트. 점이 가격 아래=상승, 위=하락" },
    { key: "Patterns", label: "패턴", active: showPatterns, toggle: () => setShowPatterns(!showPatterns), tip: "캔들 패턴: 도지, 망치형, 장악형 등 10가지 반전 패턴 감지" },
    { key: "HA", label: "HA", active: showHA, toggle: () => setShowHA(!showHA), tip: "하이킨아시: 평균화된 OHLC 값으로 노이즈를 제거하여 추세를 명확하게 표현" },
  ]

  const subPanels: { panel: IndicatorPanel; label: string; tip: string }[] = [
    { panel: "MACD", label: "MACD", tip: "MACD: 단기·장기 EMA 차이. 시그널선 돌파 시 매수/매도 신호" },
    { panel: "RSI", label: "RSI", tip: "RSI: 과매수(70↑) / 과매도(30↓). 현재 가격의 상승·하락 강도" },
    { panel: "Stochastic", label: "Stoch", tip: "스토캐스틱: 일정 기간 고·저 대비 현재 위치. 과매수(80↑)/과매도(20↓)" },
    { panel: "OBV", label: "OBV", tip: "OBV: 거래량 누적. 가격 상승일 +, 하락일 -. 거래량과 가격 추세 비교" },
    { panel: "ATR", label: "ATR", tip: "ATR: 평균 변동폭. 값이 클수록 변동성 큼. 손절/목표가 설정에 활용" },
    { panel: "ROC", label: "ROC", tip: "ROC: 일정 기간 전 대비 변화율(%). 0 위=상승추세, 0 아래=하락추세" },
    { panel: "MFI", label: "MFI", tip: "MFI: 거래량 가중 RSI. 자금 유입(80↑ 과매수) / 유출(20↓ 과매도)" },
    { panel: "ADLine", label: "A/D", tip: "A/D Line: 매집(가격 상단 마감) vs 배분(하단 마감) 누적" },
    { panel: "ADX", label: "ADX", tip: "ADX: 추세 강도(25↑ 추세). +DI>-DI=상승, -DI>+DI=하락" },
  ]

  return (
    <>
      {/* 1행: 기간 선택 */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as ChartPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => { setPeriod(p); trackEvent("chart_period_change", { ticker, period: p }) }}
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

      {/* 2행: 오버레이 지표 */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground mr-1">오버레이</span>
        {(["SMA", "EMA"] as const).map((t) => (
          <ToggleButton key={t} active={maType === t} onClick={() => setMAType(maType === t ? "off" : t)}>
            {t}
          </ToggleButton>
        ))}
        {overlays.map(({ key, label, active, toggle, tip }) => (
          <ToggleButton key={key} active={active} onClick={toggle} title={tip}>
            {label}
          </ToggleButton>
        ))}
      </div>

      {/* 3행: 서브 패널 */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <span className="text-[10px] text-muted-foreground mr-1">패널</span>
        {subPanels.map(({ panel, label, tip }) => (
          <ToggleButton key={panel} active={panels.has(panel)} onClick={() => togglePanel(panel)} title={tip}>
            {label}
          </ToggleButton>
        ))}
      </div>
    </>
  )
}

export function ChartLegend({ period, maType, showBB, showKC, showFib }: {
  period: ChartPeriod
  maType: MAType
  showBB: boolean
  showKC: boolean
  showFib: boolean
}) {
  return (
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
      {showKC && (
        <>
          <span>·</span>
          <span className="text-cyan-500">KC(20,10,1.5)</span>
        </>
      )}
      {showFib && (
        <>
          <span>·</span>
          <span className="text-orange-400">Fibonacci</span>
        </>
      )}
    </div>
  )
}
