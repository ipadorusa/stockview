/**
 * 키워드 기반 뉴스 감성 분류 (고도화)
 * - 부정 접두사 패턴 ("~전환 실패", "~에도 불구")
 * - 구문 패턴 인식
 * - 키워드 30+30개 확대
 */

type Sentiment = "positive" | "negative" | "neutral"

const POSITIVE_KR = [
  "상승", "호실적", "신고가", "급등", "강세", "호재", "흑자", "성장",
  "사상최고", "반등", "수혜", "호황", "돌파", "최고치", "서프라이즈",
  "매수", "기대감", "확대", "개선", "회복", "순매수", "상한가",
  "실적개선", "호조", "역대최대", "수출증가", "흑자전환", "목표가상향",
  "투자확대", "신사업",
]
const NEGATIVE_KR = [
  "하락", "적자", "급락", "약세", "악재", "폭락", "손실", "부진",
  "실적부진", "쇼크", "위기", "불안", "최저", "투매", "공포",
  "매도", "하한가", "적자전환", "감소", "축소", "하향", "순매도",
  "실적악화", "경고", "리스크", "파산", "부도", "목표가하향",
  "수출감소", "실적쇼크",
]

const POSITIVE_EN = [
  "surge", "beat", "record", "rally", "gain", "soar", "bullish",
  "upgrade", "outperform", "breakout", "strong", "boom", "growth",
  "profit", "recovery", "buy", "upside", "optimism", "exceed",
  "all-time high", "momentum", "positive", "accelerate", "expand",
  "top pick", "overweight", "outpace", "robust", "dividend hike",
  "earnings beat",
]
const NEGATIVE_EN = [
  "crash", "miss", "decline", "drop", "plunge", "bearish", "sell-off",
  "downgrade", "underperform", "slump", "weak", "fear", "recession",
  "loss", "cut", "sell", "downside", "pessimism", "warning",
  "layoff", "bankruptcy", "default", "collapse", "negative",
  "underweight", "headwind", "slowdown", "deficit", "earnings miss",
  "guidance cut",
]

// 부정 접두사/반전 패턴 (한국어)
const NEGATION_PATTERNS_KR: Array<{ pattern: RegExp; flip: "positive" | "negative" }> = [
  { pattern: /상승.*전환.*실패/, flip: "negative" },
  { pattern: /성장.*둔화/, flip: "negative" },
  { pattern: /기대.*미달/, flip: "negative" },
  { pattern: /회복.*불투명/, flip: "negative" },
  { pattern: /에도\s*불구.*하락/, flip: "negative" },
  { pattern: /에도\s*불구.*부진/, flip: "negative" },
  { pattern: /하락.*반전/, flip: "positive" },
  { pattern: /위기.*극복/, flip: "positive" },
  { pattern: /적자.*탈출/, flip: "positive" },
  { pattern: /부진.*탈피/, flip: "positive" },
]

// 부정 접두사/반전 패턴 (영어)
const NEGATION_PATTERNS_EN: Array<{ pattern: RegExp; flip: "positive" | "negative" }> = [
  { pattern: /despite.*gain/i, flip: "negative" },
  { pattern: /fail.*to.*recover/i, flip: "negative" },
  { pattern: /growth.*slow/i, flip: "negative" },
  { pattern: /beat.*expectation/i, flip: "positive" },
  { pattern: /defy.*downturn/i, flip: "positive" },
  { pattern: /recover.*from.*loss/i, flip: "positive" },
]

export function classifySentiment(title: string): Sentiment {
  const lower = title.toLowerCase()

  // 1. 구문 패턴 우선 체크
  for (const { pattern, flip } of NEGATION_PATTERNS_KR) {
    if (pattern.test(title)) return flip
  }
  for (const { pattern, flip } of NEGATION_PATTERNS_EN) {
    if (pattern.test(lower)) return flip
  }

  // 2. 키워드 카운트
  let positive = 0
  let negative = 0

  for (const kw of POSITIVE_KR) {
    if (title.includes(kw)) positive++
  }
  for (const kw of NEGATIVE_KR) {
    if (title.includes(kw)) negative++
  }
  for (const kw of POSITIVE_EN) {
    if (lower.includes(kw)) positive++
  }
  for (const kw of NEGATIVE_EN) {
    if (lower.includes(kw)) negative++
  }

  if (positive > negative) return "positive"
  if (negative > positive) return "negative"
  return "neutral"
}
