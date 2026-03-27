"use client"

import type { ReactNode } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RequestListClient } from "@/components/report-request/request-list-client"

export function ReportsPageTabs({ reportsSlot }: { reportsSlot: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = searchParams.get("tab") === "requests" ? "requests" : "reports"

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "requests") {
      params.set("tab", "requests")
    } else {
      params.delete("tab")
    }
    router.replace(`/reports${params.size > 0 ? `?${params}` : ""}`, { scroll: false })
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="reports">AI 리포트</TabsTrigger>
        <TabsTrigger value="requests">분석 요청</TabsTrigger>
      </TabsList>
      <TabsContent value="reports">{reportsSlot}</TabsContent>
      <TabsContent value="requests">
        <RequestListClient />
      </TabsContent>
    </Tabs>
  )
}
