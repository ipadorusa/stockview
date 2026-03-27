import { z } from "zod"

export const createReportRequestSchema = z.object({
  stockId: z.string().min(1, "종목을 선택해주세요"),
  ticker: z.string().min(1, "티커가 필요합니다"),
})

export const updateRequestStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
})

export const createRequestCommentSchema = z.object({
  content: z.string().min(1, "댓글을 입력해주세요").max(500, "댓글은 500자 이내로 입력해주세요"),
})
