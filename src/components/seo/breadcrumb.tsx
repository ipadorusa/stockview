import Link from "next/link"
import { JsonLd } from "./json-ld"
import { buildBreadcrumbList } from "@/lib/seo"

interface BreadcrumbItem {
  label: string
  href: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ label: "홈", href: "/" }, ...items]

  const jsonLdItems = allItems.map((item) => ({
    name: item.label,
    url: item.href,
  }))

  return (
    <>
      <JsonLd data={buildBreadcrumbList(jsonLdItems)} />
      <nav aria-label="breadcrumb" className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 py-2 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1">
          {allItems.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {i < allItems.length - 1 ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
