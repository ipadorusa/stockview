-- CreateTable
CREATE TABLE "InstitutionalFlow" (
    "id" SERIAL NOT NULL,
    "stockId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "foreignBuy" BIGINT NOT NULL DEFAULT 0,
    "foreignSell" BIGINT NOT NULL DEFAULT 0,
    "foreignNet" BIGINT NOT NULL DEFAULT 0,
    "institutionBuy" BIGINT NOT NULL DEFAULT 0,
    "institutionSell" BIGINT NOT NULL DEFAULT 0,
    "institutionNet" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "InstitutionalFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalFlow_stockId_date_key" ON "InstitutionalFlow"("stockId", "date");

-- CreateIndex
CREATE INDEX "InstitutionalFlow_stockId_idx" ON "InstitutionalFlow"("stockId");

-- AddForeignKey
ALTER TABLE "InstitutionalFlow" ADD CONSTRAINT "InstitutionalFlow_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
