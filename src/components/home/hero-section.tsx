"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { TrendingUp, X, BarChart3, FileText, CalendarDays } from "lucide-react"

const features = [
  {
    icon: BarChart3,
    title: "스크리너",
    description: "기술적 시그널로 유망 종목을 빠르게 발굴",
    href: "/screener",
  },
  {
    icon: FileText,
    title: "AI 리포트",
    description: "AI가 분석한 종목별 투자 인사이트",
    href: "/reports",
  },
  {
    icon: CalendarDays,
    title: "배당 캘린더",
    description: "배당락일·지급일을 한눈에 확인",
    href: "/dividends",
  },
]

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
    <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-6 md:p-8 mb-8 border border-primary/10">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/15 hidden sm:flex items-center justify-center shrink-0">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-1">초보 투자자를 위한 주식 분석 서비스</h2>
          <p className="text-sm text-muted-foreground">
            한국/미국 시세, 기술적 차트, AI 분석 리포트, 뉴스까지 — 무료로 제공합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {features.map(({ icon: Icon, title, description, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-lg p-3 bg-background/60 hover:bg-background/80 border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
          >
            <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/auth/register"
          className="inline-flex items-center justify-center rounded-md px-5 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          무료 회원가입
        </Link>
        <Link
          href="/market"
          className="inline-flex items-center justify-center rounded-md px-5 h-9 text-sm font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
        >
          인기 종목 보기
        </Link>
      </div>
    </section>
  )
}
