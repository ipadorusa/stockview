"use client"

import { useState } from "react"

interface CompanyOverviewProps {
  description: string | null
}

export function CompanyOverview({ description }: CompanyOverviewProps) {
  const [expanded, setExpanded] = useState(false)

  if (!description) return null

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-sm mb-1">기업 개요</h3>
      <p className={`text-sm leading-relaxed text-muted-foreground ${expanded ? "" : "line-clamp-3"}`}>
        {description}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-primary hover:underline mt-1 cursor-pointer"
      >
        {expanded ? "접기" : "더 보기"}
      </button>
    </div>
  )
}
