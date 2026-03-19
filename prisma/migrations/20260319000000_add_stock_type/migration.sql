-- CreateEnum
CREATE TYPE "StockType" AS ENUM ('STOCK', 'ETF');

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN "stockType" "StockType" NOT NULL DEFAULT 'STOCK';

-- CreateIndex
CREATE INDEX "Stock_stockType_idx" ON "Stock"("stockType");
