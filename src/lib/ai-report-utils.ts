export const SIGNAL_LABELS: Record<string, string> = {
  golden_cross: "골든크로스",
  macd_cross: "MACD 크로스",
  rsi_oversold: "RSI 과매도 반등",
  bollinger_bounce: "볼린저 반등",
  volume_surge: "거래량 급증",
  market_cap_top: "시총 상위",
  user_request: "사용자 요청",
}

export const VERDICT_STYLES: Record<string, { label: string; className: string }> = {
  "긍정": { label: "긍정", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "중립": { label: "중립", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "부정": { label: "부정", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

export function stripReportHeaders(text: string): string {
  return text
    .replace(/\*\*\[(?:한줄요약|투자의견|분석)\]\*\*/g, "")
    .replace(/\[(?:한줄요약|투자의견|분석)\]/g, "")
    .replace(/\*\*/g, "")
    .trim()
}

export function getKSTDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function generateSlug(ticker: string, date: Date): string {
  const d = getKSTDateString(date)
  return `${ticker.toLowerCase()}-${d}`
}
