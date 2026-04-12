"use client"

import { type ReactNode } from "react"

interface EventsTabWrapperProps {
  market: "KR" | "US"
  disclosureSlot: ReactNode | null
}

export function EventsTabWrapper({ market, disclosureSlot }: EventsTabWrapperProps) {
  if (market !== "KR" || !disclosureSlot) return null

  return (
    <div>
      {disclosureSlot}
    </div>
  )
}
