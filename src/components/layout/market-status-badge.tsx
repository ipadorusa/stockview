"use client"

import { useState, useEffect } from "react"
import { getMarketStatus } from "@/lib/utils/market-hours"
import { cn } from "@/lib/utils"

const statusConfig = {
  open: { dot: "bg-green-500", pulse: true },
  closed: { dot: "bg-red-500", pulse: false },
  "pre-market": { dot: "bg-yellow-500", pulse: false },
  "after-market": { dot: "bg-yellow-500", pulse: false },
  holiday: { dot: "bg-gray-400", pulse: false },
} as const

export function MarketStatusBadge() {
  const [krStatus, setKrStatus] = useState<ReturnType<typeof getMarketStatus> | null>(null)

  useEffect(() => {
    setKrStatus(getMarketStatus("KR"))
    const interval = setInterval(() => setKrStatus(getMarketStatus("KR")), 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!krStatus) return null

  const config = statusConfig[krStatus.status]

  return (
    <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-[var(--fg-secondary)]">
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot, config.pulse && "animate-pulse")} />
      <span>{krStatus.label}</span>
    </div>
  )
}
