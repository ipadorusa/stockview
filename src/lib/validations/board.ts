import { z } from "zod"

export const createPostSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이내로 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요").max(5000, "내용은 5000자 이내로 입력해주세요"),
  isPrivate: z.boolean(),
})

export const updatePostSchema = createPostSchema.partial()

export const createCommentSchema = z.object({
  content: z.string().min(1, "댓글을 입력해주세요").max(1000, "댓글은 1000자 이내로 입력해주세요"),
  parentId: z.string().optional(),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1, "댓글을 입력해주세요").max(1000, "댓글은 1000자 이내로 입력해주세요"),
})
