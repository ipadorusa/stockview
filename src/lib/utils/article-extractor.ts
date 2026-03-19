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
 * Google News RSS 리다이렉트 URL을 최종 URL로 해석
 * news.google.com/rss/articles/... → 실제 기사 URL
 */
async function resolveRedirectUrl(url: string): Promise<string> {
  // Google News RSS 리다이렉트 URL 감지
  if (!url.includes("news.google.com/rss/articles")) return url

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(5_000),
    })
    // 리다이렉트를 따라간 최종 URL 반환
    return res.url || url
  } catch {
    return url
  }
}

/**
 * Naver 래퍼 URL에서 원본 기사 URL 추출
 * finance.naver.com/news/news_read.naver?article_id=...&office_id=... → 원본 URL
 */
function isNaverWrapperUrl(url: string): boolean {
  return url.includes("finance.naver.com/news/news_read")
    || url.includes("n.news.naver.com/article")
}

/**
 * URL에서 기사 본문을 추출하여 첫 300자 요약 반환
 * - Google News RSS 리다이렉트 URL 자동 해석
 * - Naver 래퍼 URL은 본문 추출 스킵 (원본 URL이 아니므로)
 * 실패 시 null 반환 (에러 전파 없음)
 */
export async function extractArticleContent(url: string): Promise<ArticleContent | null> {
  try {
    // Naver 래퍼 URL은 본문 추출 스킵 (실제 기사가 아닌 래핑 페이지)
    if (isNaverWrapperUrl(url)) return null

    // Google News RSS 리다이렉트 URL 해석
    const resolvedUrl = await resolveRedirectUrl(url)

    // 해석된 URL도 Naver 래퍼면 스킵
    if (isNaverWrapperUrl(resolvedUrl)) return null

    // 동적으로 import (서버사이드에서만 사용)
    const { Readability } = await import("@mozilla/readability")
    const { JSDOM } = await import("jsdom")

    const res = await fetch(resolvedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5_000),
    })

    if (!res.ok) return null

    const html = await res.text()
    const dom = new JSDOM(html, { url: resolvedUrl })
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
