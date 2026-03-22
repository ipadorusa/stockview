"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

type ConsentChoice = "all" | "essential"

interface ConsentData {
  choice: ConsentChoice
  timestamp: string
}

const CONSENT_KEY = "cookie-consent"
const THIRTEEN_MONTHS_MS = 13 * 30 * 24 * 60 * 60 * 1000

function updateConsent(accepted: boolean) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  // gtag pushes arrays to dataLayer for consent commands
  ;(window.dataLayer as unknown[]).push([
    "consent",
    "update",
    {
      ad_storage: accepted ? "granted" : "denied",
      analytics_storage: "granted",
      ad_user_data: accepted ? "granted" : "denied",
      ad_personalization: accepted ? "granted" : "denied",
    },
  ])
  window.dataLayer.push({
    event: "consent_update",
    consent_choice: accepted ? "all" : "essential",
    consent_timestamp: new Date().toISOString(),
  })
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  const checkConsent = useCallback(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY)
      if (!raw) {
        setVisible(true)
        return
      }
      const data: ConsentData = JSON.parse(raw)
      const elapsed = Date.now() - new Date(data.timestamp).getTime()
      if (elapsed > THIRTEEN_MONTHS_MS) {
        localStorage.removeItem(CONSENT_KEY)
        setVisible(true)
        return
      }
      setVisible(false)
      updateConsent(data.choice === "all")
    } catch {
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    checkConsent()

    const handleReset = () => {
      setVisible(true)
    }
    window.addEventListener("cookie-consent-reset", handleReset)
    return () => window.removeEventListener("cookie-consent-reset", handleReset)
  }, [checkConsent])

  const handleChoice = (choice: ConsentChoice) => {
    const data: ConsentData = {
      choice,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data))
    updateConsent(choice === "all")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-60 transform transition-transform duration-300 ease-out"
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
    >
      <div className="bg-background border-t shadow-lg">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <p className="text-sm text-muted-foreground flex-1">
            StockView는 서비스 개선 및 맞춤 광고를 위해 쿠키를 사용합니다.{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              개인정보처리방침
            </Link>
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleChoice("essential")}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors cursor-pointer"
            >
              필수만
            </button>
            <button
              onClick={() => handleChoice("all")}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
            >
              모두 동의
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
