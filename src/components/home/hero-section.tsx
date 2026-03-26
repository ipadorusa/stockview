"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { TrendingUp, X } from "lucide-react"

export function HeroSection() {
  const { data: session } = useSession()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (session) return
    const visited = localStorage.getItem("sv_visited")
    if (!visited) setVisible(true)
  }, [session])

  function handleDismiss() {
    setVisible(false)
    localStorage.setItem("sv_visited", "true")
  }

  if (!visible) return null

  return (
    <section className="relative bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 md:p-8 mb-8">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <TrendingUp className="h-8 w-8 text-primary shrink-0 mt-1 hidden sm:block" />
        <div>
          <h2 className="text-xl font-bold mb-2">한국/미국 주식 정보를 한눈에</h2>
          <p className="text-sm text-muted-foreground mb-4">
            실시간 시세, 기술적 차트, AI 분석 리포트, 뉴스까지 — 초보 투자자를 위한 무료 주식 분석 서비스
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-md px-4 h-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              시작하기
            </Link>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-md px-4 h-8 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              둘러보기
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
