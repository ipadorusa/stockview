"use client"

import { CircleHelp } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TooltipHelperProps {
  term: string
  description: string
}

export function TooltipHelper({ term, description }: TooltipHelperProps) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
        <CircleHelp className="h-4 w-4" />
        <span className="sr-only">{term} 설명</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">
        <p className="font-semibold mb-1">{term}</p>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </TooltipContent>
    </Tooltip>
  )
}
