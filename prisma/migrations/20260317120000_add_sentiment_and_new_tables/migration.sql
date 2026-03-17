-- AlterTable: Add sentiment column to News
ALTER TABLE "News" ADD COLUMN "sentiment" TEXT;

-- CreateTable: StockFundamental
CREATE TABLE "StockFundamental" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "eps" DECIMAL(18,4),
    "forwardEps" DECIMAL(18,4),
    "dividendYield" DECIMAL(10,4),
    "roe" DECIMAL(10,4),
    "debtToEquity" DECIMAL(10,4),
    "beta" DECIMAL(10,4),
    "revenue" BIGINT,
    "netIncome" BIGINT,
    "description" TEXT,
    "employeeCount" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockFundamental_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TechnicalIndicator
CREATE TABLE "TechnicalIndicator" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ma5" DECIMAL(18,4),
    "ma20" DECIMAL(18,4),
    "ma60" DECIMAL(18,4),
    "rsi14" DECIMAL(10,4),
    "avgVolume20" BIGINT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicalIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Dividend
CREATE TABLE "Dividend" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "exDate" DATE NOT NULL,
    "payDate" DATE,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',

    CONSTRAINT "Dividend_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EarningsEvent
CREATE TABLE "EarningsEvent" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "quarter" TEXT NOT NULL,
    "epsEstimate" DECIMAL(18,4),
    "epsActual" DECIMAL(18,4),
    "revenueEstimate" BIGINT,
    "revenueActual" BIGINT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EarningsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockFundamental_stockId_key" ON "StockFundamental"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalIndicator_stockId_date_key" ON "TechnicalIndicator"("stockId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Dividend_stockId_exDate_key" ON "Dividend"("stockId", "exDate");

-- CreateIndex
CREATE UNIQUE INDEX "EarningsEvent_stockId_quarter_key" ON "EarningsEvent"("stockId", "quarter");

-- AddForeignKey
ALTER TABLE "StockFundamental" ADD CONSTRAINT "StockFundamental_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalIndicator" ADD CONSTRAINT "TechnicalIndicator_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dividend" ADD CONSTRAINT "Dividend_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarningsEvent" ADD CONSTRAINT "EarningsEvent_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
