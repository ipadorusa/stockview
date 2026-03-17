/**
 * 기사 본문 추출 유틸리티
 * @mozilla/readability + jsdom 사용
 * 저작권 주의: 첫 300자 excerpt만 저장, 원문 링크 제공
 */

export interface ArticleContent {
  title: string | null
  content: string | null  // 첫 300자 excerpt
  siteName: string | null
}

/**
 * URL에서 기사 본문을 추출하여 첫 300자 요약 반환
 * 실패 시 null 반환 (에러 전파 없음)
 */
export async function extractArticleContent(url: string): Promise<ArticleContent | null> {
  try {
    // 동적으로 import (서버사이드에서만 사용)
    const { Readability } = await import("@mozilla/readability")
    const { JSDOM } = await import("jsdom")

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      signal: AbortSignal.timeout(5_000),
    })

    if (!res.ok) return null

    const html = await res.text()
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) return null

    // 본문에서 HTML 태그 제거 후 첫 300자만 저장
    const plainText = article.textContent
      ?.replace(/\s+/g, " ")
      .trim()
      .slice(0, 300) ?? null

    return {
      title: article.title ?? null,
      content: plainText,
      siteName: article.siteName ?? null,
    }
  } catch {
    // 타임아웃, 네트워크 오류, 파싱 실패 모두 null 반환
    return null
  }
}
