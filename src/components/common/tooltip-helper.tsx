"use client"

import { CircleHelp } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TooltipHelperProps {
  term: string
  description: string
}

export function TooltipHelper({ term, description }: TooltipHelperProps) {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
        <CircleHelp className="h-4 w-4" />
        <span className="sr-only">{term} 설명</span>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm">
        <p className="font-semibold mb-1">{term}</p>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </PopoverContent>
    </Popover>
  )
}
