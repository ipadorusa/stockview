/**
 * Trading calendar — KR/US holiday detection for cron skip logic.
 * Update annually with new holiday dates.
 */

/** KR 공휴일 (주식시장 휴장일). 음력 공휴일은 매년 날짜가 바뀌므로 수동 업데이트 필요 */
const KR_HOLIDAYS_2025 = [
  "2025-01-01", // 신정
  "2025-01-28", "2025-01-29", "2025-01-30", // 설날
  "2025-03-01", // 삼일절
  "2025-05-05", // 어린이날
  "2025-05-06", // 부처님 오신 날
  "2025-06-06", // 현충일
  "2025-08-15", // 광복절
  "2025-10-03", // 개천절
  "2025-10-05", "2025-10-06", "2025-10-07", // 추석
  "2025-10-09", // 한글날
  "2025-12-25", // 성탄절
]

const KR_HOLIDAYS_2026 = [
  "2026-01-01", // 신정
  "2026-02-16", "2026-02-17", "2026-02-18", // 설날
  "2026-03-01", // 삼일절 (일요일 → 3/2 대체)
  "2026-03-02", // 대체공휴일
  "2026-05-05", // 어린이날
  "2026-05-24", // 부처님 오신 날
  "2026-06-06", // 현충일
  "2026-08-15", // 광복절
  "2026-09-24", "2026-09-25", "2026-09-26", // 추석
  "2026-10-03", // 개천절
  "2026-10-09", // 한글날
  "2026-12-25", // 성탄절
]

/** US Federal Holidays (stock market closures) */
const US_HOLIDAYS_2025 = [
  "2025-01-01", // New Year's Day
  "2025-01-20", // MLK Day
  "2025-02-17", // Presidents' Day
  "2025-04-18", // Good Friday
  "2025-05-26", // Memorial Day
  "2025-06-19", // Juneteenth
  "2025-07-04", // Independence Day
  "2025-09-01", // Labor Day
  "2025-11-27", // Thanksgiving
  "2025-12-25", // Christmas
]

const US_HOLIDAYS_2026 = [
  "2026-01-01", // New Year's Day
  "2026-01-19", // MLK Day
  "2026-02-16", // Presidents' Day
  "2026-04-03", // Good Friday
  "2026-05-25", // Memorial Day
  "2026-06-19", // Juneteenth
  "2026-07-03", // Independence Day (observed)
  "2026-09-07", // Labor Day
  "2026-11-26", // Thanksgiving
  "2026-12-25", // Christmas
]

const KR_HOLIDAYS = new Set([...KR_HOLIDAYS_2025, ...KR_HOLIDAYS_2026])
const US_HOLIDAYS = new Set([...US_HOLIDAYS_2025, ...US_HOLIDAYS_2026])

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0]
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

export function isKrHoliday(date: Date = new Date()): boolean {
  return isWeekend(date) || KR_HOLIDAYS.has(toDateStr(date))
}

export function isUsHoliday(date: Date = new Date()): boolean {
  return isWeekend(date) || US_HOLIDAYS.has(toDateStr(date))
}

export function isTradingDay(market: "KR" | "US", date: Date = new Date()): boolean {
  return market === "KR" ? !isKrHoliday(date) : !isUsHoliday(date)
}
