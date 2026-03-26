-- CreateTable
CREATE TABLE "FundamentalHistory" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "eps" DECIMAL(18,4),
    "forwardEps" DECIMAL(18,4),
    "dividendYield" DECIMAL(10,4),
    "roe" DECIMAL(10,4),
    "debtToEquity" DECIMAL(10,4),
    "beta" DECIMAL(10,4),
    "revenue" BIGINT,
    "netIncome" BIGINT,
    "operatingIncome" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundamentalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FundamentalHistory_stockId_idx" ON "FundamentalHistory"("stockId");

-- CreateIndex
CREATE INDEX "FundamentalHistory_quarter_idx" ON "FundamentalHistory"("quarter");

-- CreateIndex
CREATE UNIQUE INDEX "FundamentalHistory_stockId_quarter_key" ON "FundamentalHistory"("stockId", "quarter");

-- AddForeignKey
ALTER TABLE "FundamentalHistory" ADD CONSTRAINT "FundamentalHistory_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
