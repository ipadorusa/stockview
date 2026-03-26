"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EventsTabWrapperProps {
  market: "KR" | "US"
  dividendSlot: ReactNode
  earningsSlot: ReactNode
  disclosureSlot: ReactNode | null
}

const SUB_TABS_KR = [
  { value: "dividend", label: "배당" },
  { value: "earnings", label: "실적" },
  { value: "disclosure", label: "공시" },
] as const

const SUB_TABS_US = [
  { value: "dividend", label: "배당" },
  { value: "earnings", label: "실적" },
] as const

export function EventsTabWrapper({ market, dividendSlot, earningsSlot, disclosureSlot }: EventsTabWrapperProps) {
  const [activeSubTab, setActiveSubTab] = useState("dividend")
  const subTabs = market === "KR" ? SUB_TABS_KR : SUB_TABS_US

  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg w-fit">
        {subTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveSubTab(tab.value)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
              activeSubTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeSubTab === "dividend" && dividendSlot}
      {activeSubTab === "earnings" && earningsSlot}
      {activeSubTab === "disclosure" && market === "KR" && disclosureSlot}
    </div>
  )
}
