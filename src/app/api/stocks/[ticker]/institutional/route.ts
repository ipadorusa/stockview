import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  )
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { days } = parsed.data

  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { id: true },
  })

  if (!stock) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 })
  }

  const since = new Date()
  since.setDate(since.getDate() - days)

  const flows = await prisma.institutionalFlow.findMany({
    where: {
      stockId: stock.id,
      date: { gte: since },
    },
    orderBy: { date: "desc" },
    select: {
      date: true,
      foreignBuy: true,
      foreignSell: true,
      foreignNet: true,
      institutionBuy: true,
      institutionSell: true,
      institutionNet: true,
    },
  })

  // BigInt → string for JSON serialization
  const data = flows.map((f) => ({
    date: f.date.toISOString().split("T")[0],
    foreignBuy: f.foreignBuy.toString(),
    foreignSell: f.foreignSell.toString(),
    foreignNet: f.foreignNet.toString(),
    institutionBuy: f.institutionBuy.toString(),
    institutionSell: f.institutionSell.toString(),
    institutionNet: f.institutionNet.toString(),
  }))

  return NextResponse.json({ ticker, days, data })
}
