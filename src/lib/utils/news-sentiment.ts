/**
 * 키워드 기반 뉴스 감성 분류
 */

type Sentiment = "positive" | "negative" | "neutral"

const POSITIVE_KR = [
  "상승", "호실적", "신고가", "급등", "강세", "호재", "흑자", "성장",
  "사상최고", "반등", "수혜", "호황", "돌파", "최고치", "서프라이즈",
]
const NEGATIVE_KR = [
  "하락", "적자", "급락", "약세", "악재", "폭락", "손실", "부진",
  "실적부진", "쇼크", "위기", "불안", "최저", "투매", "공포",
]

const POSITIVE_EN = [
  "surge", "beat", "record", "rally", "gain", "soar", "bullish",
  "upgrade", "outperform", "breakout", "strong", "boom",
]
const NEGATIVE_EN = [
  "crash", "miss", "decline", "drop", "plunge", "bearish", "sell-off",
  "downgrade", "underperform", "slump", "weak", "fear", "recession",
]

export function classifySentiment(title: string): Sentiment {
  const lower = title.toLowerCase()
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
