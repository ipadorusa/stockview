-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "market" "Market" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sector_name_market_key" ON "Sector"("name", "market");

-- CreateIndex
CREATE INDEX "Sector_market_idx" ON "Sector"("market");

-- AlterTable: Add sectorId to Stock
ALTER TABLE "Stock" ADD COLUMN "sectorId" TEXT;

-- CreateIndex
CREATE INDEX "Stock_sectorId_idx" ON "Stock"("sectorId");

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing sector strings to Sector table and link
INSERT INTO "Sector" ("id", "name", "market", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    sector,
    market,
    NOW(),
    NOW()
FROM "Stock"
WHERE sector IS NOT NULL
GROUP BY sector, market
ON CONFLICT ("name", "market") DO NOTHING;

UPDATE "Stock" s
SET "sectorId" = sec.id
FROM "Sector" sec
WHERE s.sector = sec.name AND s.market = sec.market AND s."sectorId" IS NULL;
