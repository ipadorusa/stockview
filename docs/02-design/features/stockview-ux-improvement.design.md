# Design: StockView UX 개선 — 초보 투자자 경험 강화

> Plan 참조: `docs/01-plan/features/stockview-ux-improvement.plan.md`

---

## 1. 구현 순서

```
Day 1: [D1] Pretendard self-host + 스크립트 최적화
       [D2] 브랜드 컬러 그린 + 다크모드 접근성
Day 2: [D3] 모바일 바텀탭 5개 확장
       [D4] glossary.ts 용어 사전 데이터
Day 3-4: [D5] TermTooltip 컴포넌트 강화 + stock-info-grid 연동
Day 5: [D6] 52주 Range Bar
Day 6-7: [D7] 온보딩 바텀시트
Day 8: [D8] 비로그인 CTA 배너
```

---

## 2. 상세 설계

### D1. Pretendard self-host + 스크립트 최적화

#### 변경 파일: `src/app/layout.tsx`

**Before** (line 62-72):
```tsx
<link rel="stylesheet" as="style" crossOrigin="anonymous"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
<script dangerouslySetInnerHTML={{ __html: `window.dataLayer=...` }} />
```

**After**:
```tsx
// 파일 상단에 추가
import localFont from "next/font/local"

const pretendard = localFont({
  src: "../fonts/PretendardVariable.subset.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "45 920",
})

// <html>에 className 추가
<html lang="ko" className={pretendard.variable} suppressHydrationWarning>

// <head>에서 외부 link 삭제, gtag를 afterInteractive로 변경
<Script id="gtag-consent" strategy="afterInteractive">
  {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',analytics_storage:'granted',ad_user_data:'denied',ad_personalization:'denied'});`}
</Script>
```

#### 신규 파일: `src/app/fonts/PretendardVariable.subset.woff2`
- Pretendard GitHub releases v1.3.9에서 다운로드
- `dist/web/variable/` 폴더의 subset woff2 파일 (~300KB)

#### 변경 파일: `src/app/globals.css`

```css
/* --font-sans 변경 */
--font-sans: var(--font-pretendard), -apple-system, BlinkMacSystemFont, system-ui, ...;

/* base layer에 추가 */
@layer base {
  .font-mono {
    font-variant-numeric: tabular-nums;
  }
}
```

---

### D2. 브랜드 컬러 그린 + 다크모드 접근성

#### 변경 파일: `src/app/globals.css`

**:root 블록** (라이트 모드):
```css
/* Before */
--primary: oklch(0.45 0.15 260);        /* 보라/남색 */
--ring: oklch(0.45 0.15 260);

/* After */
--primary: oklch(0.45 0.16 155);        /* 에메랄드 그린 */
--ring: oklch(0.45 0.16 155);
```

**.dark 블록** (다크 모드):
```css
/* Before */
--primary: oklch(0.922 0 0);
--ring: oklch(0.556 0 0);

/* After */
--primary: oklch(0.65 0.18 155);        /* 밝은 에메랄드 */
--ring: oklch(0.65 0.18 155);

/* 접근성 수정: stock-up-bg/stock-down-bg 대비비 4.5:1+ 확보 */
```

**@theme inline 블록** (다크모드 주가 배경색):
```css
/* 다크모드 전용 오버라이드 추가 */
.dark {
  --color-stock-up-bg: #3d1f1f;         /* 기존 #2d1515 → 더 어둡게 */
  --color-stock-down-bg: #1f2d3f;       /* 기존 #1a2332 → 더 어둡게 */
}
```

---

### D3. 모바일 바텀탭 5개 확장

#### 변경 파일: `src/components/layout/bottom-tab-bar.tsx`

**Before** (4탭):
```tsx
const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/market", label: "시장", icon: Globe },
  { href: "/news", label: "뉴스", icon: Newspaper },
  { href: "/mypage", label: "MY", icon: User },
]
```

**After** (5탭):
```tsx
import { Home, Search, Globe, Star, User } from "lucide-react"

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/search", label: "검색", icon: Search, isOverlay: true },
  { href: "/market", label: "시장", icon: Globe },
  { href: "/watchlist", label: "관심", icon: Star },
  { href: "/mypage", label: "MY", icon: User },
]
```

검색 탭 동작:
- `isOverlay: true`인 경우 `href`로 이동하지 않고, 기존 `SearchCommand` 다이얼로그를 오픈
- `onClick` 핸들러에서 `setSearchOpen(true)` 호출
- `SearchCommand`는 이미 `src/components/search/search-command.tsx`에 구현되어 있음

```tsx
export function BottomTabBar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
        <div className="flex items-center justify-around h-14">
          {tabs.map(({ href, label, icon: Icon, isOverlay }) => {
            const isActive = isOverlay ? false
              : href === "/watchlist" ? pathname.startsWith("/watchlist")
              : href === "/mypage" ? pathname.startsWith("/mypage") || pathname.startsWith("/settings")
              : pathname === href

            if (isOverlay) {
              return (
                <button key={href} onClick={() => setSearchOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs text-muted-foreground">
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              )
            }

            return (
              <Link key={href} href={href}
                className={cn("flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
```

**주의**: `SearchCommand`의 import 확인 필요. 현재 `search-command.tsx`가 `cmdk` 기반이므로 `open`/`onOpenChange` props 지원 여부 확인.

---

### D4. 용어 사전 데이터 (`glossary.ts`)

#### 신규 파일: `src/lib/glossary.ts`

기존 `stock-info-grid.tsx`의 `TERMS` 상수를 확장하여 별도 파일로 분리.

```typescript
export interface GlossaryEntry {
  term: string           // 표시 이름
  shortDesc: string      // 1~2문장 설명
  guideHref?: string     // /guide/* 딥링크 (선택)
  evaluate?: (value: number, sectorAvg?: number | null) => "good" | "neutral" | "caution"
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  PER: {
    term: "PER (주가수익비율)",
    shortDesc: "주가를 주당순이익으로 나눈 값이에요. 낮을수록 이익 대비 주가가 저렴한 것을 의미해요.",
    guideHref: "/guide/reading-financials#per",
    evaluate: (value, sectorAvg) => {
      if (!sectorAvg) return "neutral"
      if (value < sectorAvg * 0.7) return "good"
      if (value > sectorAvg * 1.3) return "caution"
      return "neutral"
    },
  },
  PBR: {
    term: "PBR (주가순자산비율)",
    shortDesc: "주가를 주당순자산으로 나눈 값이에요. 1 미만이면 자산 가치보다 싸게 거래되는 것이에요.",
    guideHref: "/guide/reading-financials#pbr",
    evaluate: (value) => {
      if (value < 1) return "good"
      if (value > 3) return "caution"
      return "neutral"
    },
  },
  EPS: {
    term: "EPS (주당순이익)",
    shortDesc: "기업의 순이익을 발행주식수로 나눈 값이에요. 높을수록 수익성이 좋아요.",
    guideHref: "/guide/reading-financials#eps",
  },
  ROE: {
    term: "ROE (자기자본이익률)",
    shortDesc: "자기자본 대비 순이익 비율이에요. 높을수록 주주 자본을 효율적으로 활용하는 기업이에요.",
    guideHref: "/guide/reading-financials#roe",
    evaluate: (value) => {
      if (value >= 0.15) return "good"
      if (value < 0.05) return "caution"
      return "neutral"
    },
  },
  배당수익률: {
    term: "배당수익률",
    shortDesc: "주가 대비 연간 배당금의 비율이에요. 높을수록 배당 수익이 커요.",
    guideHref: "/guide/dividend-investing#yield",
    evaluate: (value) => {
      if (value >= 0.03) return "good"
      if (value < 0.01) return "caution"
      return "neutral"
    },
  },
  부채비율: {
    term: "부채비율",
    shortDesc: "총부채를 자기자본으로 나눈 값이에요. 낮을수록 재무가 안정적이에요.",
    guideHref: "/guide/reading-financials#debt",
    evaluate: (value) => {
      if (value < 100) return "good"
      if (value > 200) return "caution"
      return "neutral"
    },
  },
  베타: {
    term: "베타 (변동성)",
    shortDesc: "시장 대비 주가 변동 크기예요. 1보다 크면 시장보다 출렁이고, 작으면 안정적이에요.",
    guideHref: "/guide/technical-indicators#beta",
  },
}

export const SIGNAL_COLORS = {
  good: "text-emerald-600 dark:text-emerald-400",
  neutral: "text-muted-foreground",
  caution: "text-amber-600 dark:text-amber-400",
} as const
```

**마이그레이션**: `stock-info-grid.tsx`의 기존 `TERMS` 상수를 삭제하고, `GLOSSARY`에서 import.

---

### D5. TermTooltip 컴포넌트 강화

#### 변경 파일: `src/components/common/tooltip-helper.tsx`

기존 `TooltipHelper`를 확장하여 신호등 컬러 + 가이드 링크 + 업종평균 비교 지원.

```tsx
"use client"

import { CircleHelp } from "lucide-react"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { GLOSSARY, SIGNAL_COLORS, type GlossaryEntry } from "@/lib/glossary"
import { cn } from "@/lib/utils"

interface TooltipHelperProps {
  term: string
  description?: string          // 레거시 호환: 직접 description 전달
  value?: number | null         // 현재 값 (신호등용)
  sectorAvg?: number | null     // 업종 평균 (비교용)
}

export function TooltipHelper({ term, description, value, sectorAvg }: TooltipHelperProps) {
  const entry = GLOSSARY[term]
  const desc = description || entry?.shortDesc || ""
  const signal = entry?.evaluate && value != null
    ? entry.evaluate(value, sectorAvg)
    : null

  return (
    <Tooltip>
      <TooltipTrigger className={cn(
        "inline-flex items-center transition-colors",
        signal ? SIGNAL_COLORS[signal] : "text-muted-foreground hover:text-foreground"
      )}>
        <CircleHelp className="h-3.5 w-3.5" />
        <span className="sr-only">{term} 설명</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 p-3" side="top">
        <p className="font-semibold text-sm mb-1">{entry?.term || term}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
        {sectorAvg != null && value != null && (
          <p className="text-xs mt-1.5 text-muted-foreground">
            업종 평균: <span className="font-mono font-medium text-foreground">
              {typeof sectorAvg === "number" && sectorAvg < 1
                ? (sectorAvg * 100).toFixed(1) + "%"
                : sectorAvg.toFixed(1)}
            </span>
          </p>
        )}
        {entry?.guideHref && (
          <Link href={entry.guideHref}
            className="inline-block mt-2 text-xs text-primary hover:underline">
            더 알아보기 →
          </Link>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
```

#### 변경 파일: `src/components/stock/stock-info-grid.tsx`

- `TERMS` 상수 삭제 (glossary.ts로 이동)
- `TooltipHelper`에 `value`, `sectorAvg` props 전달
- `sectorAvg` 데이터는 `StockInfoGridProps`에 추가

```typescript
interface StockInfoGridProps {
  data: { /* 기존 유지 */ }
  fundamental?: { /* 기존 유지 */ } | null
  sectorAvg?: {           // 신규: 업종 평균 데이터
    per?: number | null
    pbr?: number | null
    roe?: number | null
    dividendYield?: number | null
  } | null
  currency?: "KRW" | "USD"
  stockType?: string | null
}
```

호출부 (`/stock/[ticker]/page.tsx`)에서 `sectorAvg` 데이터를 전달해야 함.
→ 기존 `/api/market/sectors/[name]/stocks` 쿼리에서 섹터 평균 계산 가능.
→ 데이터 없으면 `sectorAvg` 미전달 → 신호등/비교 미표시 (graceful degradation).

---

### D6. 52주 Range Bar

#### 변경 파일: `src/components/stock/stock-info-grid.tsx`

52주 고/저가 항목을 텍스트에서 시각적 바로 변경.

```tsx
function Range52w({ low, high, current, currency }: {
  low: number; high: number; current: number; currency: "KRW" | "USD"
}) {
  const range = high - low
  const position = range > 0 ? ((current - low) / range) * 100 : 50

  return (
    <div className="col-span-2 bg-muted/50 rounded-lg p-3">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-muted-foreground">52주 범위</span>
        <TooltipHelper term="52주범위"
          description="최근 52주(1년) 동안의 최저가와 최고가 범위에서 현재 가격의 위치를 보여줘요." />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span className="font-mono">{fv(low, currency)}</span>
        <span className="font-mono">{fv(high, currency)}</span>
      </div>
      <div className="relative h-1.5 bg-muted rounded-full">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-stock-down to-stock-up rounded-full"
          style={{ width: "100%" }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full border-2 border-background shadow-sm"
          style={{ left: `calc(${Math.min(Math.max(position, 2), 98)}% - 6px)` }} />
      </div>
      <p className="text-center text-xs font-mono font-medium mt-1">
        현재 {fv(current, currency)}
      </p>
    </div>
  )
}
```

`StockInfoGrid` 렌더링부에서 `high52w`와 `low52w`가 모두 있을 때 `Range52w` 컴포넌트를 대신 표시.

---

### D7. 온보딩 바텀시트

#### 신규 파일: `src/components/onboarding/onboarding-sheet.tsx`

```tsx
"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const MARKETS = [
  { id: "KR", label: "한국 주식", emoji: "🇰🇷" },
  { id: "US", label: "미국 주식", emoji: "🇺🇸" },
]

const SECTORS = [
  "IT/반도체", "바이오/헬스케어", "금융", "에너지",
  "소비재", "산업재", "통신", "유틸리티",
]

interface OnboardingSheetProps {
  popularStocks: Array<{ ticker: string; name: string; market: string }>
  onComplete: (selections: {
    markets: string[]
    sectors: string[]
    stocks: string[]
  }) => void
}

export function OnboardingSheet({ popularStocks, onComplete }: OnboardingSheetProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1) // 1: 시장, 2: 섹터, 3: 종목
  const [markets, setMarkets] = useState<string[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [stocks, setStocks] = useState<string[]>([])

  useEffect(() => {
    const done = localStorage.getItem("hasCompletedOnboarding")
    if (!done) setOpen(true)
  }, [])

  const handleComplete = () => {
    localStorage.setItem("hasCompletedOnboarding", "true")
    onComplete({ markets, sectors, stocks })
    setOpen(false)
  }

  const handleSkip = () => {
    localStorage.setItem("hasCompletedOnboarding", "true")
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        {/* Step 1: 시장 선택 */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-6 pt-6">
            <h2 className="text-xl font-bold">어떤 시장에 관심 있으세요?</h2>
            <p className="text-muted-foreground text-sm">복수 선택 가능해요</p>
            <div className="flex gap-4">
              {MARKETS.map(m => (
                <button key={m.id}
                  onClick={() => setMarkets(prev =>
                    prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]
                  )}
                  className={cn(
                    "flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all",
                    markets.includes(m.id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}>
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" onClick={handleSkip}>나중에 하기</Button>
              <Button onClick={() => setStep(2)} disabled={markets.length === 0}>다음</Button>
            </div>
          </div>
        )}

        {/* Step 2: 섹터 선택 */}
        {step === 2 && (
          <div className="flex flex-col items-center gap-6 pt-6">
            <h2 className="text-xl font-bold">관심 섹터를 골라주세요</h2>
            <p className="text-muted-foreground text-sm">최대 3개 선택</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {SECTORS.map(s => (
                <Badge key={s} variant={sectors.includes(s) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => setSectors(prev =>
                    prev.includes(s) ? prev.filter(x => x !== s)
                      : prev.length < 3 ? [...prev, s] : prev
                  )}>
                  {s}
                </Badge>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>이전</Button>
              <Button onClick={() => setStep(3)}>다음</Button>
            </div>
          </div>
        )}

        {/* Step 3: 종목 추가 */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-6 pt-6">
            <h2 className="text-xl font-bold">첫 관심종목을 추가해보세요</h2>
            <p className="text-muted-foreground text-sm">나중에 언제든 변경할 수 있어요</p>
            <div className="w-full max-w-sm space-y-2">
              {popularStocks.slice(0, 8).map(s => (
                <button key={s.ticker}
                  onClick={() => setStocks(prev =>
                    prev.includes(s.ticker)
                      ? prev.filter(x => x !== s.ticker)
                      : [...prev, s.ticker]
                  )}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                    stocks.includes(s.ticker)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{s.market}</Badge>
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.ticker}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" onClick={() => setStep(2)}>이전</Button>
              <Button onClick={handleComplete}>
                완료 {stocks.length > 0 && `(${stocks.length}개 선택)`}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

#### 트리거 위치

**옵션 A** (권장): `src/app/page.tsx` 홈에서 로그인 사용자에게 온보딩 표시
- 장점: 가입→로그인→홈 도착 시 자연스러운 플로우
- `useSession()`으로 로그인 확인 + `localStorage` 체크

**옵션 B**: `src/app/auth/register/page.tsx` 가입 완료 후 즉시
- 장점: 가입 직후 즉시 경험
- 단점: 가입 페이지가 "use client"여야 함

**결정**: 옵션 A — 홈에서 트리거. 가입 완료 → 자동 로그인 → 홈 리다이렉트 → 온보딩 시트 표시.

#### 관심종목 추가 API 연동

온보딩 완료 시 `onComplete` 콜백에서:
```typescript
// 선택한 종목들을 관심종목에 일괄 추가
for (const ticker of selections.stocks) {
  await fetch(`/api/watchlist/${ticker}`, { method: "POST" })
}
```

기존 `/api/watchlist/[ticker]` POST 엔드포인트 재활용.

---

### D8. 비로그인 CTA 배너

#### 변경 파일: `src/app/page.tsx`

HeroSection 하단 또는 대체로 비로그인 사용자에게 가이드 유도 배너 표시.

```tsx
// 홈 페이지 상단 (HeroSection 조건부 표시 이후)
{!session && (
  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mx-4 mb-4">
    <p className="font-medium text-sm">주식 투자가 처음이신가요?</p>
    <p className="text-muted-foreground text-xs mt-1">
      초보 투자자를 위한 가이드를 읽고 시작해보세요.
    </p>
    <div className="flex gap-2 mt-3">
      <Link href="/guide" className="text-xs text-primary font-medium hover:underline">
        투자 가이드 보기 →
      </Link>
      <Link href="/auth/register" className="text-xs text-primary font-medium hover:underline">
        무료 회원가입 →
      </Link>
    </div>
  </div>
)}
```

---

## 3. 데이터 흐름

### 업종 평균 데이터 (sectorAvg)

```
/stock/[ticker]/page.tsx (Server Component)
  → getStock(ticker)로 종목 정보 + sector 필드 확보
  → getSectorAverage(sector)로 해당 섹터 평균 PER/PBR/ROE/배당 조회
  → StockInfoGrid에 sectorAvg prop으로 전달
```

`getSectorAverage` 구현:
```typescript
// src/lib/queries.ts에 추가
export async function getSectorAverage(sector: string) {
  const result = await prisma.stock.aggregate({
    where: { sector, isActive: true },
    _avg: { per: true, pbr: true },
  })
  // fundamental 평균도 별도 쿼리
  return { per: result._avg.per, pbr: result._avg.pbr, ... }
}
```

캐싱: ISR revalidate와 동일 주기 (900초). 섹터 평균은 자주 변하지 않으므로 충분.

---

## 4. 파일 변경 요약

| 파일 | 변경 유형 | 항목 |
|------|----------|------|
| `src/app/layout.tsx` | 수정 | D1: 폰트 self-host, 스크립트 최적화 |
| `src/app/globals.css` | 수정 | D1: font-sans, tabular-nums / D2: primary 그린, 접근성 |
| `src/app/fonts/PretendardVariable.subset.woff2` | 신규 | D1: 폰트 파일 |
| `src/components/layout/bottom-tab-bar.tsx` | 수정 | D3: 5탭 확장 |
| `src/lib/glossary.ts` | 신규 | D4: 용어 사전 |
| `src/components/common/tooltip-helper.tsx` | 수정 | D5: 신호등 + 가이드 링크 |
| `src/components/stock/stock-info-grid.tsx` | 수정 | D5: glossary 연동, D6: Range Bar |
| `src/lib/queries.ts` | 수정 | D5: getSectorAverage 추가 |
| `src/app/stock/[ticker]/page.tsx` | 수정 | D5: sectorAvg 전달 |
| `src/components/onboarding/onboarding-sheet.tsx` | 신규 | D7: 온보딩 |
| `src/app/page.tsx` | 수정 | D7: 온보딩 트리거, D8: CTA 배너 |

**신규 파일**: 3개
**수정 파일**: 8개
**삭제 파일**: 0개
