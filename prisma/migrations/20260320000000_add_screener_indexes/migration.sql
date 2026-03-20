-- CreateIndex
CREATE INDEX IF NOT EXISTS "Stock_market_isActive_idx" ON "Stock"("market", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TechnicalIndicator_date_idx" ON "TechnicalIndicator"("date");
