type MarketStatus = "open" | "closed" | "pre-market" | "after-market" | "holiday"

interface MarketStatusResult {
  status: MarketStatus
  label: string
  market: "KR" | "US"
}

function getKSTHour(): { day: number; hour: number; minute: number } {
  const now = new Date()
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
  return { day: kst.getDay(), hour: kst.getHours(), minute: kst.getMinutes() }
}

function getETHour(): { day: number; hour: number; minute: number } {
  const now = new Date()
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  return { day: et.getDay(), hour: et.getHours(), minute: et.getMinutes() }
}

export function getMarketStatus(market: "KR" | "US"): MarketStatusResult {
  if (market === "KR") {
    const { day, hour, minute } = getKSTHour()
    const isWeekday = day >= 1 && day <= 5
    if (!isWeekday) return { status: "holiday", label: "휴장", market }
    const timeVal = hour * 60 + minute
    if (timeVal >= 540 && timeVal < 930) return { status: "open", label: "장중", market } // 09:00~15:30
    if (timeVal >= 930) return { status: "closed", label: "장마감", market }
    return { status: "pre-market", label: "장 시작 전", market }
  }

  // US market
  const { day, hour, minute } = getETHour()
  const isWeekday = day >= 1 && day <= 5
  if (!isWeekday) return { status: "holiday", label: "휴장", market }
  const timeVal = hour * 60 + minute
  if (timeVal >= 570 && timeVal < 960) return { status: "open", label: "거래중", market } // 09:30~16:00
  if (timeVal >= 240 && timeVal < 570) return { status: "pre-market", label: "프리마켓", market } // 04:00~09:30
  if (timeVal >= 960 && timeVal < 1200) return { status: "after-market", label: "애프터마켓", market } // 16:00~20:00
  return { status: "closed", label: "장마감", market }
}
