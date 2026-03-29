"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { PriceChangeText } from "@/components/common/price-change-text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"
import type { PortfolioItem } from "@/types/portfolio"

function formatPrice(price: number, market: string) {
  return market === "KR" ? price.toLocaleString("ko-KR") + "원" : "$" + price.toFixed(2)
}

export function PortfolioRow({ item }: { item: PortfolioItem }) {
  const [editing, setEditing] = useState(false)
  const [editPrice, setEditPrice] = useState(String(item.buyPrice))
  const [editQty, setEditQty] = useState(String(item.quantity))
  const queryClient = useQueryClient()
  const cur = item.market === "KR" ? "KRW" as const : "USD" as const
  const href = item.stockType === "ETF" ? `/etf/${item.ticker}` : `/stock/${item.ticker}`

  const updateMutation = useMutation({
    mutationFn: async (data: { buyPrice?: number; quantity?: number }) => {
      const res = await fetch(`/api/portfolio/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("수정 실패")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      toast.success("수정했습니다")
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/portfolio/${item.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("삭제 실패")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      toast.success(`${item.name} 포트폴리오에서 제거했습니다`)
    },
  })

  function handleSave() {
    const price = parseFloat(editPrice)
    const qty = parseInt(editQty, 10)
    if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
      toast.error("올바른 값을 입력해주세요")
      return
    }
    updateMutation.mutate({ buyPrice: price, quantity: qty })
  }

  const isUp = item.profitLoss > 0
  const isDown = item.profitLoss < 0

  return (
    <div className="flex items-center gap-2 px-4 py-3 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <Link href={href} className="hover:underline">
            <span className="font-medium text-sm">{item.name}</span>
            <span className="text-xs text-muted-foreground font-mono ml-1.5">{item.ticker}</span>
          </Link>
          <span className="font-mono font-medium text-sm">{formatPrice(item.currentPrice, item.market)}</span>
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="any"
              min="0"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="h-7 w-28 text-xs"
              placeholder="매수가"
            />
            <Input
              type="number"
              min="1"
              step="1"
              value={editQty}
              onChange={(e) => setEditQty(e.target.value)}
              className="h-7 w-20 text-xs"
              placeholder="수량"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={updateMutation.isPending}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              매수 {formatPrice(item.buyPrice, item.market)} × {item.quantity}주
            </span>
            <div className="flex items-center gap-2">
              <span className={cn("font-mono", isUp && "text-stock-up", isDown && "text-stock-down")}>
                {isUp ? "+" : ""}{formatPrice(item.totalProfitLoss, item.market)}
              </span>
              <PriceChangeText value={item.profitLoss} changePercent={item.profitLossPercent} format="percent" currency={cur} className="text-xs" />
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-0.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => { setEditPrice(String(item.buyPrice)); setEditQty(String(item.quantity)); setEditing(true) }}
            className="p-1.5 text-muted-foreground hover:text-foreground active:opacity-70 transition-colors"
            title="수정"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            className="p-1.5 text-muted-foreground hover:text-destructive active:opacity-70 transition-colors"
            title="삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
