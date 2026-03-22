"use client"

import Link from "next/link"

export function Footer() {
  const handleResetCookieConsent = () => {
    localStorage.removeItem("cookie-consent")
    window.dispatchEvent(new Event("cookie-consent-reset"))
  }

  return (
    <footer className="border-t bg-muted/30 mb-14 md:mb-0">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            개인정보처리방침
          </Link>
          <span className="text-border">|</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            이용약관
          </Link>
          <span className="text-border">|</span>
          <button
            onClick={handleResetCookieConsent}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            쿠키 설정
          </button>
          <span className="text-border">|</span>
          <Link href="/about" className="hover:text-foreground transition-colors">
            서비스 소개
          </Link>
        </div>
        <p className="text-xs text-muted-foreground/80 text-center">
          본 서비스는 투자 참고용 정보 제공 목적이며, 투자 권유 또는 종목 추천이 아닙니다. 투자에 대한 최종 판단과 책임은 투자자 본인에게 있습니다.
        </p>
        <p className="text-xs text-muted-foreground/60 text-center mt-2">
          &copy; {new Date().getFullYear()} StockView. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
