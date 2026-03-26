"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface AddPortfolioDialogProps {
  /** Pre-fill ticker when adding from stock list */
  defaultTicker?: string
  trigger?: React.ReactNode
}

export function AddPortfolioDialog({ defaultTicker, trigger }: AddPortfolioDialogProps) {
  const [open, setOpen] = useState(false)
  const [ticker, setTicker] = useState(defaultTicker ?? "")
  const [buyPrice, setBuyPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [buyDate, setBuyDate] = useState("")
  const [memo, setMemo] = useState("")
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: { ticker: string; buyPrice: number; quantity: number; buyDate?: string; memo?: string }) => {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "추가에 실패했습니다")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      toast.success("포트폴리오에 추가했습니다")
      resetAndClose()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  function resetAndClose() {
    setTicker(defaultTicker ?? "")
    setBuyPrice("")
    setQuantity("")
    setBuyDate("")
    setMemo("")
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(buyPrice)
    const qty = parseInt(quantity, 10)
    if (!ticker.trim()) { toast.error("티커를 입력해주세요"); return }
    if (isNaN(price) || price <= 0) { toast.error("매수가를 올바르게 입력해주세요"); return }
    if (isNaN(qty) || qty <= 0) { toast.error("수량을 올바르게 입력해주세요"); return }
    mutation.mutate({
      ticker: ticker.trim().toUpperCase(),
      buyPrice: price,
      quantity: qty,
      ...(buyDate && { buyDate }),
      ...(memo.trim() && { memo: memo.trim() }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />종목 추가
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>포트폴리오에 종목 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="grid gap-2">
            <Label htmlFor="pf-ticker">티커</Label>
            <Input
              id="pf-ticker"
              placeholder="예: 005930, AAPL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              disabled={!!defaultTicker}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pf-price">매수가</Label>
              <Input
                id="pf-price"
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf-qty">수량</Label>
              <Input
                id="pf-qty"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pf-date">매수일 (선택)</Label>
            <Input
              id="pf-date"
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pf-memo">메모 (선택)</Label>
            <Input
              id="pf-memo"
              placeholder="메모"
              maxLength={200}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "추가 중..." : "추가"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
