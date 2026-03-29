"use client"

import type { ReactNode } from "react"
import { trackEvent } from "@/lib/gtm"
import { cn } from "@/lib/utils"

interface NewsLinkProps {
  href: string
  title: string
  source: string
  category: string
  className?: string
  children: ReactNode
}

export function NewsLink({ href, title, source, category, className, children }: NewsLinkProps) {
  const handleClick = () => {
    trackEvent("news_click", { title, source, category })
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={cn("active:opacity-80", className)}>
      {children}
    </a>
  )
}
