"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { pushEvent } from "@/lib/gtm"

interface GtmPageViewProps {
  pageData?: Record<string, string | number | boolean>
}

function GtmPageViewInner({ pageData }: GtmPageViewProps) {
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

export function GtmPageView({ pageData }: GtmPageViewProps) {
  return (
    <Suspense fallback={null}>
      <GtmPageViewInner pageData={pageData} />
    </Suspense>
  )
}
