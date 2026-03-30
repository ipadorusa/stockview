import { useEffect, useRef, useState } from "react"

/**
 * 가격 변동 시 플래시 애니메이션 클래스를 반환하는 훅.
 * globals.css의 .price-tick-up / .price-tick-down 애니메이션과 연동.
 */
export function usePriceTick(currentPrice: number): string {
  const prevRef = useRef(currentPrice)
  const [tickClass, setTickClass] = useState("")

  useEffect(() => {
    if (prevRef.current === currentPrice) return

    if (currentPrice > prevRef.current) {
      setTickClass("price-tick-up")
    } else if (currentPrice < prevRef.current) {
      setTickClass("price-tick-down")
    }

    prevRef.current = currentPrice

    const timer = setTimeout(() => setTickClass(""), 1500)
    return () => clearTimeout(timer)
  }, [currentPrice])

  return tickClass
}
