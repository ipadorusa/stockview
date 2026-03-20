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
