"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function NewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[news-error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <h2 className="text-xl font-bold mb-2">뉴스를 불러올 수 없습니다</h2>
      <p className="text-muted-foreground text-sm mb-6">
        잠시 후 다시 시도해 주세요.
      </p>
      <Button onClick={reset} variant="outline">
        다시 시도
      </Button>
    </div>
  )
}
