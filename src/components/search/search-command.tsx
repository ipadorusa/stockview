"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, GitCompare } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { trackEvent } from "@/lib/gtm"
import { useDebounce } from "@/hooks/use-debounce"
import { useQuery } from "@tanstack/react-query"
import { useCompare } from "@/contexts/compare-context"
import type { StockSearchResult } from "@/types/stock"

interface SearchCommandProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SearchCommand({ open: controlledOpen, onOpenChange }: SearchCommandProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()
  const { addToCompare, removeFromCompare, isInCompare } = useCompare()

  const open = controlledOpen ?? internalOpen
  const setOpen = (val: boolean) => {
    setInternalOpen(val)
    onOpenChange?.(val)
    if (!val) setQuery("")
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open])

  const debouncedQuery = useDebounce(query, 300)

  const { data } = useQuery({
    queryKey: ["stock-search", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return { results: [] as StockSearchResult[] }
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(debouncedQuery)}`)
      const json = await res.json() as { results: StockSearchResult[] }
      trackEvent("search", { search_term: debouncedQuery, results_count: json.results.length })
      return json
    },
    enabled: debouncedQuery.length >= 2,
  })

  const results = data?.results ?? []

  const handleSelect = useCallback((ticker: string, stockType?: string) => {
    trackEvent("select_content", { content_type: stockType === "ETF" ? "etf" : "stock", item_id: ticker })
    setOpen(false)
    router.push(stockType === "ETF" ? `/etf/${ticker}` : `/stock/${ticker}`)
  }, [router])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="종목명 또는 티커 검색..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {debouncedQuery.length >= 2 && results.length === 0 && (
          <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        )}
        {results.length > 0 && (
          <CommandGroup heading="종목">
            {results.map((stock) => (
              <CommandItem
                key={stock.ticker}
                value={stock.ticker}
                onSelect={() => handleSelect(stock.ticker, stock.stockType)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{stock.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{stock.ticker}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {stock.market === "KR" ? stock.exchange : "US"}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      if (isInCompare(stock.ticker)) {
                        removeFromCompare(stock.ticker)
                      } else {
                        addToCompare(stock.ticker, stock.name, stock.market)
                      }
                    }}
                    className={[
                      "p-1 rounded transition-colors shrink-0",
                      isInCompare(stock.ticker)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                    ].join(" ")}
                    title={isInCompare(stock.ticker) ? "비교에서 제거" : "비교에 추가"}
                    aria-label={isInCompare(stock.ticker) ? `${stock.name} 비교에서 제거` : `${stock.name} 비교에 추가`}
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
