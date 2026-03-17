-- AlterTable: TechnicalIndicator에 MACD, BB, EMA 컬럼 추가
ALTER TABLE "TechnicalIndicator" ADD COLUMN "ema12" DECIMAL(18,4);
ALTER TABLE "TechnicalIndicator" ADD COLUMN "ema26" DECIMAL(18,4);
ALTER TABLE "TechnicalIndicator" ADD COLUMN "macdLine" DECIMAL(18,4);
ALTER TABLE "TechnicalIndicator" ADD COLUMN "macdSignal" DECIMAL(18,4);
ALTER TABLE "TechnicalIndicator" ADD COLUMN "macdHistogram" DECIMAL(18,4);
ALTER TABLE "TechnicalIndicator" ADD COLUMN "bbUpper" DECIMAL(18,4);
ALTER TABLE "TechnicalIndicator" ADD COLUMN "bbMiddle" DECIMAL(18,4);
ALTER TABLE "TechnicalIndicator" ADD COLUMN "bbLower" DECIMAL(18,4);

-- CreateIndex
CREATE INDEX "TechnicalIndicator_stockId_idx" ON "TechnicalIndicator"("stockId");
