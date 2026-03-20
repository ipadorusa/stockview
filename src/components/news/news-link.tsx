"use client"

import type { ReactNode } from "react"
import { trackEvent } from "@/lib/gtm"

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
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
