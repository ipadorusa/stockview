-- CreateEnum
CREATE TYPE "Market" AS ENUM ('KR', 'US');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('KR_MARKET', 'US_MARKET', 'INDUSTRY', 'ECONOMY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "market" "Market" NOT NULL,
    "exchange" TEXT NOT NULL,
    "sector" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockQuote" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "previousClose" DECIMAL(18,4) NOT NULL,
    "change" DECIMAL(18,4) NOT NULL,
    "changePercent" DECIMAL(10,4) NOT NULL,
    "open" DECIMAL(18,4) NOT NULL,
    "high" DECIMAL(18,4) NOT NULL,
    "low" DECIMAL(18,4) NOT NULL,
    "volume" BIGINT NOT NULL,
    "marketCap" BIGINT,
    "high52w" DECIMAL(18,4),
    "low52w" DECIMAL(18,4),
    "per" DECIMAL(10,2),
    "pbr" DECIMAL(10,2),
    "preMarketPrice" DECIMAL(18,4),
    "postMarketPrice" DECIMAL(18,4),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPrice" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DECIMAL(18,4) NOT NULL,
    "high" DECIMAL(18,4) NOT NULL,
    "low" DECIMAL(18,4) NOT NULL,
    "close" DECIMAL(18,4) NOT NULL,
    "volume" BIGINT NOT NULL,
    "adjClose" DECIMAL(18,4),

    CONSTRAINT "DailyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" "NewsCategory" NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockNews" (
    "stockId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,

    CONSTRAINT "StockNews_pkey" PRIMARY KEY ("stockId","newsId")
);

-- CreateTable
CREATE TABLE "MarketIndex" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "change" DECIMAL(18,4) NOT NULL,
    "changePercent" DECIMAL(10,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "rate" DECIMAL(18,4) NOT NULL,
    "change" DECIMAL(18,4) NOT NULL,
    "changePercent" DECIMAL(10,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_ticker_key" ON "Stock"("ticker");

-- CreateIndex
CREATE INDEX "Stock_market_idx" ON "Stock"("market");

-- CreateIndex
CREATE INDEX "Stock_name_idx" ON "Stock"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StockQuote_stockId_key" ON "StockQuote"("stockId");

-- CreateIndex
CREATE INDEX "StockQuote_updatedAt_idx" ON "StockQuote"("updatedAt");

-- CreateIndex
CREATE INDEX "DailyPrice_stockId_date_idx" ON "DailyPrice"("stockId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPrice_stockId_date_key" ON "DailyPrice"("stockId", "date");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_stockId_key" ON "Watchlist"("userId", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "News_url_key" ON "News"("url");

-- CreateIndex
CREATE INDEX "News_publishedAt_idx" ON "News"("publishedAt");

-- CreateIndex
CREATE INDEX "News_category_idx" ON "News"("category");

-- CreateIndex
CREATE UNIQUE INDEX "MarketIndex_symbol_key" ON "MarketIndex"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_pair_key" ON "ExchangeRate"("pair");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockQuote" ADD CONSTRAINT "StockQuote_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPrice" ADD CONSTRAINT "DailyPrice_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockNews" ADD CONSTRAINT "StockNews_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockNews" ADD CONSTRAINT "StockNews_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;
