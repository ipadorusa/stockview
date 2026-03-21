const BASE_URL = process.env.APP_URL ?? "https://stockview.app"

export function buildOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StockView",
    url: BASE_URL,
    logo: `${BASE_URL}/og-default.png`,
  }
}

export function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StockView",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/stock/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function buildFinancialProduct(stock: {
  ticker: string
  name: string
  market: string
  quote?: { price: number; changePercent: number; updatedAt: string } | null
  description?: string | null
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${stock.name} (${stock.ticker})`,
    url: `${BASE_URL}/stock/${stock.ticker}`,
    description: stock.description ?? `${stock.name} (${stock.ticker}) 주식 정보`,
    ...(stock.quote && {
      offers: {
        "@type": "Offer",
        price: stock.quote.price,
        priceCurrency: stock.market === "KR" ? "KRW" : "USD",
        priceValidUntil: stock.quote.updatedAt,
      },
    }),
  }
}

export function buildBreadcrumbList(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  }
}

export function buildWebPage(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
  }
}

export function buildArticle(
  title: string,
  description: string,
  url: string,
  datePublished: string,
  dateModified: string,
  stockName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
    datePublished,
    dateModified,
    author: { "@type": "Organization", name: "StockView AI" },
    about: { "@type": "Corporation", name: stockName },
    publisher: { "@type": "Organization", name: "StockView" },
  }
}
