import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const alt = "StockView 종목 정보"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: { quotes: { take: 1, orderBy: { updatedAt: "desc" } } },
  })

  if (!stock) {
    return new ImageResponse(
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#0f172a", color: "#fff", fontSize: 48 }}>
        StockView
      </div>,
      { ...size }
    )
  }

  const quote = stock.quotes[0]
  const price = quote ? Number(quote.price) : null
  const changePercent = quote ? Number(quote.changePercent) : null
  const isUp = (changePercent ?? 0) > 0
  const isDown = (changePercent ?? 0) < 0
  const currency = stock.market === "KR" ? "KRW" : "USD"
  const priceStr = price
    ? currency === "KRW" ? `${price.toLocaleString("ko-KR")}원` : `$${price.toFixed(2)}`
    : ""
  const changeColor = isUp ? "#e53e3e" : isDown ? "#3182ce" : "#a0aec0"
  const changeStr = changePercent != null ? `${isUp ? "+" : ""}${changePercent.toFixed(2)}%` : ""

  return new ImageResponse(
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "center",
      width: "100%", height: "100%", background: "#0f172a", color: "#fff", padding: 60,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
        <span style={{ fontSize: 56, fontWeight: 700 }}>{stock.name}</span>
        <span style={{ fontSize: 28, color: "#94a3b8" }}>{stock.ticker}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
        <span style={{ fontSize: 72, fontWeight: 700 }}>{priceStr}</span>
        <span style={{ fontSize: 36, fontWeight: 600, color: changeColor }}>{changeStr}</span>
      </div>
      <div style={{ marginTop: "auto", fontSize: 24, color: "#64748b" }}>StockView</div>
    </div>,
    { ...size }
  )
}
