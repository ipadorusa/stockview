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
  const containerRef = useRef<HTMLDivElement>(null)
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || pushed.current || !adRef.current || typeof window === "undefined") return
    try {
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense not loaded yet
    }
  }, [inView])

  if (!process.env.NEXT_PUBLIC_ADSENSE_ID) return null

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden ${FORMAT_STYLES[format]} ${className ?? ""}`}
    >
      {inView && (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
          data-ad-slot={slot}
          data-ad-format={format === "responsive" ? "auto" : undefined}
          data-full-width-responsive={format === "responsive" ? "true" : undefined}
        />
      )}
    </div>
  )
}
