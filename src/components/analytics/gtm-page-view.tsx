"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { pushEvent } from "@/lib/gtm"

interface GtmPageViewProps {
  pageData?: Record<string, string | number | boolean>
}

export function GtmPageView({ pageData }: GtmPageViewProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    pushEvent("page_view", {
      page_path: pathname + (searchParams?.toString() ? `?${searchParams}` : ""),
      ...pageData,
    })
  }, [pathname, searchParams, pageData])

  return null
}
