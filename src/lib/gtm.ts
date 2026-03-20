export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? ""

type DataLayerEvent = {
  event: string
  [key: string]: unknown
}

declare global {
  interface Window {
    dataLayer: DataLayerEvent[]
  }
}

export function pushEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined" || !GTM_ID) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

// ── Type-safe custom event tracking ──

export interface GtmEventMap {
  login: { method: string; success: boolean }
  sign_up: { method: string; success: boolean }
  search: { search_term: string; results_count: number }
  select_content: { content_type: string; item_id: string }
  watchlist_add: { ticker: string }
  watchlist_remove: { ticker: string }
  chart_period_change: { ticker: string; period: string }
  news_click: { title: string; source: string; category: string }
  screener_filter: { market: string; signal: string }
}

export function trackEvent<K extends keyof GtmEventMap>(
  event: K,
  data: GtmEventMap[K]
) {
  pushEvent(event, data as Record<string, unknown>)
}
