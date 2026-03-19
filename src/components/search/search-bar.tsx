"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { useQuery } from "@tanstack/react-query"
import type { StockSearchResult } from "@/types/stock"

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  const { data } = useQuery({
    queryKey: ["stock-search", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return { results: [] as StockSearchResult[] }
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(debouncedQuery)}`)
      return res.json() as Promise<{ results: StockSearchResult[] }>
    },
    enabled: debouncedQuery.length >= 2,
  })

  const results = data?.results ?? []
  const showDropdown = open && results.length > 0

  const handleSelect = useCallback((ticker: string, stockType?: string) => {
    setOpen(false)
    setQuery("")
    router.push(stockType === "ETF" ? `/etf/${ticker}` : `/stock/${ticker}`)
  }, [router])

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        aria-label="종목명 또는 티커 검색"
        placeholder="종목명 또는 티커 검색..."
        className="w-full pl-9 pr-12 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none select-none items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-md border bg-popover shadow-md">
          <Command>
            <CommandList>
              {results.length === 0 ? (
                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              ) : (
                <CommandGroup heading="종목">
                  {results.map((stock) => (
                    <CommandItem
                      key={stock.ticker}
                      value={stock.ticker}
                      onSelect={() => handleSelect(stock.ticker, stock.stockType)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="font-medium">{stock.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{stock.ticker}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{stock.market === "KR" ? stock.exchange : "US"}</Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
