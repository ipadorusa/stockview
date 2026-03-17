-- AlterTable: News 테이블에 content 필드 추가 (기사 본문 첫 300자)
ALTER TABLE "News" ADD COLUMN "content" TEXT;
