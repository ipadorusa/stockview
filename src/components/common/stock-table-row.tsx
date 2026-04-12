"use client"

import { TableRow, TableCell } from "@/components/ui/table"
import { PriceCell } from "@/components/common/price-cell"
import { TickerBadge } from "@/components/common/ticker-badge"
import { cn } from "@/lib/utils"

interface StockData {
  ticker: string
  name: string
  market: "KR" | "US"
  price: number
  change: number
  changePercent: number
}

type ColumnKey = "ticker" | "name" | "market" | "price" | "change" | "changePercent"

interface StockTableRowProps {
  stock: StockData
  columns: ColumnKey[]
  onClick?: () => void
  className?: string
}

function getCurrency(market: string): "KRW" | "USD" {
  return market === "KR" ? "KRW" : "USD"
}

export function StockTableRow({ stock, columns, onClick, className }: StockTableRowProps) {
  const renderCell = (col: ColumnKey) => {
    switch (col) {
      case "ticker":
        return <TableCell key={col} className="font-mono text-sm">{stock.ticker}</TableCell>
      case "name":
        return <TableCell key={col} className="text-sm truncate max-w-[200px]">{stock.name}</TableCell>
      case "market":
        return <TableCell key={col}><TickerBadge market={stock.market} /></TableCell>
      case "price":
        return (
          <TableCell key={col} className="text-right">
            <PriceCell value={stock.price} changePercent={stock.changePercent} currency={getCurrency(stock.market)} />
          </TableCell>
        )
      case "change":
        return (
          <TableCell key={col} className="text-right">
            <PriceCell value={stock.change} changePercent={stock.changePercent} currency={getCurrency(stock.market)} />
          </TableCell>
        )
      case "changePercent":
        return (
          <TableCell key={col} className="text-right font-mono tabular-nums text-sm">
            <span className={cn(
              stock.changePercent > 0 ? "text-stock-up" : stock.changePercent < 0 ? "text-stock-down" : "text-stock-flat",
            )}>
              {stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
            </span>
          </TableCell>
        )
    }
  }

  return (
    <TableRow
      className={cn("hover:bg-muted/50 cursor-pointer", className)}
      style={{ height: "var(--density-row-height)" }}
      onClick={onClick}
    >
      {columns.map(renderCell)}
    </TableRow>
  )
}
