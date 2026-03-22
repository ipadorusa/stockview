"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PostForm } from "@/components/board/post-form"
import { toast } from "sonner"
import type { z } from "zod"
import type { createPostSchema } from "@/lib/validations/board"

type PostFormValues = z.infer<typeof createPostSchema>

export function NewFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: PostFormValues) => {
    setLoading(true)
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "글 작성에 실패했습니다.")
        return
      }
      toast.success("글이 작성되었습니다.")
      router.push(`/board/${json.post.id}`)
    } finally {
      setLoading(false)
    }
  }

  return <PostForm onSubmit={handleSubmit} submitLabel="작성하기" loading={loading} />
}
