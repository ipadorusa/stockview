"use client"

import { CircleHelp } from "lucide-react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GLOSSARY, SIGNAL_COLORS } from "@/lib/glossary"
import { cn } from "@/lib/utils"

interface TooltipHelperProps {
  term: string
  description?: string
  value?: number | null
  sectorAvg?: number | null
}

export function TooltipHelper({ term, description, value, sectorAvg }: TooltipHelperProps) {
  const entry = GLOSSARY[term]
  const desc = description || entry?.shortDesc || ""
  const signal =
    entry?.evaluate && value != null ? entry.evaluate(value, sectorAvg) : null

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "inline-flex items-center transition-colors",
          signal
            ? SIGNAL_COLORS[signal]
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <CircleHelp className="h-3.5 w-3.5" />
        <span className="sr-only">{term} 설명</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 p-3" side="top">
        <p className="font-semibold text-sm mb-1">{entry?.term || term}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
        {sectorAvg != null && value != null && (
          <p className="text-xs mt-1.5 text-muted-foreground">
            업종 평균:{" "}
            <span className="font-mono font-medium text-foreground">
              {sectorAvg < 1
                ? (sectorAvg * 100).toFixed(1) + "%"
                : sectorAvg.toFixed(1)}
            </span>
          </p>
        )}
        {entry?.guideHref && (
          <Link
            href={entry.guideHref}
            className="inline-block mt-2 text-xs text-primary hover:underline"
          >
            더 알아보기 →
          </Link>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
