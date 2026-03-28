"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const MARKETS = [
  { id: "KR", label: "한국 주식", emoji: "🇰🇷" },
  { id: "US", label: "미국 주식", emoji: "🇺🇸" },
]

const SECTORS = [
  "IT/반도체",
  "바이오/헬스케어",
  "금융",
  "에너지",
  "소비재",
  "산업재",
  "통신",
  "유틸리티",
]

interface PopularStock {
  ticker: string
  name: string
  market: string
}

interface OnboardingSheetProps {
  popularStocks: PopularStock[]
  onComplete: (selections: {
    markets: string[]
    sectors: string[]
    stocks: string[]
  }) => void
}

export function OnboardingSheet({ popularStocks, onComplete }: OnboardingSheetProps) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false
    return !localStorage.getItem("hasCompletedOnboarding")
  })
  const [step, setStep] = useState(1)
  const [markets, setMarkets] = useState<string[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [stocks, setStocks] = useState<string[]>([])

  const handleComplete = () => {
    localStorage.setItem("hasCompletedOnboarding", "true")
    onComplete({ markets, sectors, stocks })
    setOpen(false)
  }

  const handleSkip = () => {
    localStorage.setItem("hasCompletedOnboarding", "true")
    setOpen(false)
  }

  const toggleMarket = (id: string) =>
    setMarkets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const toggleSector = (s: string) =>
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 3 ? [...prev, s] : prev
    )

  const toggleStock = (ticker: string) =>
    setStocks((prev) =>
      prev.includes(ticker) ? prev.filter((x) => x !== ticker) : [...prev, ticker]
    )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-6">
        <SheetTitle className="sr-only">온보딩</SheetTitle>

        {step === 1 && (
          <div className="flex flex-col items-center gap-6 pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">어떤 시장에 관심 있으세요?</h2>
              <p className="text-muted-foreground text-sm mt-1">복수 선택 가능해요</p>
            </div>
            <div className="flex gap-4">
              {MARKETS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMarket(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all",
                    markets.includes(m.id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" onClick={handleSkip}>
                나중에 하기
              </Button>
              <Button onClick={() => setStep(2)} disabled={markets.length === 0}>
                다음
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">1 / 3 단계</p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center gap-6 pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">관심 섹터를 골라주세요</h2>
              <p className="text-muted-foreground text-sm mt-1">최대 3개 선택</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {SECTORS.map((s) => (
                <Badge
                  key={s}
                  variant={sectors.includes(s) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => toggleSector(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button onClick={() => setStep(3)}>다음</Button>
            </div>
            <p className="text-xs text-muted-foreground">2 / 3 단계</p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-6 pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">첫 관심종목을 추가해보세요</h2>
              <p className="text-muted-foreground text-sm mt-1">
                나중에 언제든 변경할 수 있어요
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2 max-h-[35vh] overflow-y-auto">
              {popularStocks.slice(0, 8).map((s) => (
                <button
                  key={s.ticker}
                  onClick={() => toggleStock(s.ticker)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                    stocks.includes(s.ticker)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {s.market}
                    </Badge>
                    <span className="font-medium text-sm">{s.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.ticker}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" onClick={() => setStep(2)}>
                이전
              </Button>
              <Button onClick={handleComplete}>
                완료{stocks.length > 0 && ` (${stocks.length}개 선택)`}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">3 / 3 단계</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
