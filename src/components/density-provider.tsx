"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

const CASUAL_ROUTES = ["/mypage", "/settings", "/guide", "/about", "/contact", "/privacy", "/terms", "/auth"]
const PRO_ROUTES = ["/stock", "/compare", "/screener", "/etf", "/board", "/admin"]

function resolveDensity(pathname: string): string {
  if (pathname === "/" || CASUAL_ROUTES.some((r) => pathname.startsWith(r))) return "casual"
  if (PRO_ROUTES.some((r) => pathname.startsWith(r))) return "pro"
  return "standard"
}

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    let density = resolveDensity(pathname)
    if (density === "pro" && window.matchMedia("(max-width: 1023px)").matches) {
      density = "standard"
    }
    document.documentElement.dataset.density = density
  }, [pathname])

  return <>{children}</>
}

export function DensityScript() {
  const script = `(function(){var p=location.pathname;var c=["/mypage","/settings","/guide","/about","/contact","/privacy","/terms","/auth"];var r=["/stock","/compare","/screener","/etf","/board","/admin"];var d="standard";if(p==="/"||c.some(function(x){return p.startsWith(x)}))d="casual";else if(r.some(function(x){return p.startsWith(x)}))d="pro";if(d==="pro"&&window.matchMedia("(max-width:1023px)").matches)d="standard";document.documentElement.dataset.density=d})();`
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
