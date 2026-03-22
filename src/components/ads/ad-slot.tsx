"use client"

import { useEffect, useRef, useState } from "react"

interface AdSlotProps {
  slot: string
  format: "banner" | "rectangle" | "leaderboard" | "responsive"
  className?: string
}

const FORMAT_STYLES: Record<AdSlotProps["format"], string> = {
  banner: "min-h-[50px]",
  rectangle: "min-h-[250px] max-w-[300px] mx-auto",
  leaderboard: "min-h-[90px]",
  responsive: "min-h-[100px]",
}

export function AdSlot({ slot, format, className }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)
  const [adLoaded, setAdLoaded] = useState(false)

  useEffect(() => {
    if (!pushed.current && adRef.current && typeof window !== "undefined") {
      try {
        ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({})
        pushed.current = true
      } catch {
        // AdSense not loaded yet
      }
    }
  }, [])

  useEffect(() => {
    if (!adRef.current) return
    const observer = new MutationObserver(() => {
      if (adRef.current && adRef.current.childElementCount > 0) {
        setAdLoaded(true)
      }
    })
    observer.observe(adRef.current, { childList: true })
    return () => observer.disconnect()
  }, [])

  if (!process.env.NEXT_PUBLIC_ADSENSE_ID) return null

  return (
    <div className={`flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden ${adLoaded ? FORMAT_STYLES[format] : ""} ${className ?? ""}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format === "responsive" ? "auto" : undefined}
        data-full-width-responsive={format === "responsive" ? "true" : undefined}
      />
    </div>
  )
}
