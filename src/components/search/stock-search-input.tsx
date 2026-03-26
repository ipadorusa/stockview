"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import type { StockSearchResult } from "@/types/stock"

interface StockSearchInputProps {
  value: StockSearchResult | null
  onChange: (stock: StockSearchResult | null) => void
  placeholder?: string
  className?: string
}

export function StockSearchInput({
  value,
  onChange,
  placeholder = "종목명 또는 티커 검색...",
  className,
}: StockSearchInputProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(stock: StockSearchResult) {
    onChange(stock)
    setQuery("")
    setOpen(false)
  }

  function handleClear() {
    onChange(null)
    setQuery("")
    inputRef.current?.focus()
  }

  if (value) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/30", className)}>
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{value.name}</span>
        <span className="text-xs text-muted-foreground font-mono">{value.ticker}</span>
        <Badge variant="outline" className="text-xs ml-auto shrink-0">
          {value.market === "KR" ? value.exchange : "US"}
        </Badge>
        <button
          type="button"
          onClick={handleClear}
          className="ml-1 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => { if (query.length >= 2) setOpen(true) }}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          {results.map((stock) => (
            <button
              key={stock.ticker}
              type="button"
              onClick={() => handleSelect(stock)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">{stock.name}</span>
                <span className="text-xs text-muted-foreground font-mono shrink-0">{stock.ticker}</span>
              </div>
              <Badge variant="outline" className="text-xs shrink-0 ml-2">
                {stock.market === "KR" ? stock.exchange : "US"}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
