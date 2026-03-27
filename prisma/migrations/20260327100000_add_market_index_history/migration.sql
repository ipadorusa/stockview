-- CreateTable
CREATE TABLE "MarketIndexHistory" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DECIMAL(18,4),
    "high" DECIMAL(18,4),
    "low" DECIMAL(18,4),
    "close" DECIMAL(18,4) NOT NULL,
    "change" DECIMAL(18,4) NOT NULL,
    "changePercent" DECIMAL(10,4) NOT NULL,
    "volume" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketIndexHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketIndexHistory_symbol_date_key" ON "MarketIndexHistory"("symbol", "date");

-- CreateIndex
CREATE INDEX "MarketIndexHistory_symbol_date_idx" ON "MarketIndexHistory"("symbol", "date");

-- AddForeignKey
ALTER TABLE "MarketIndexHistory" ADD CONSTRAINT "MarketIndexHistory_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "MarketIndex"("symbol") ON DELETE CASCADE ON UPDATE CASCADE;
