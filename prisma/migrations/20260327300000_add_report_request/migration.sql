-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ReportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "aiReportId" TEXT,

    CONSTRAINT "ReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestComment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportRequest_status_idx" ON "ReportRequest"("status");
CREATE INDEX "ReportRequest_userId_idx" ON "ReportRequest"("userId");
CREATE INDEX "ReportRequest_stockId_idx" ON "ReportRequest"("stockId");

CREATE INDEX "RequestComment_requestId_createdAt_idx" ON "RequestComment"("requestId", "createdAt");
CREATE INDEX "RequestComment_userId_idx" ON "RequestComment"("userId");

-- AddForeignKey
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_aiReportId_fkey" FOREIGN KEY ("aiReportId") REFERENCES "AiReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ReportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
