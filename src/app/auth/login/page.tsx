import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { LoginForm } from "@/components/auth/login-form"
import { TrendingUp } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12">
      <GtmPageView pageData={{ page_name: "login" }} />
      <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8">
        <TrendingUp className="h-6 w-6 text-primary" />
        StockView
      </Link>
      <LoginForm />
    </div>
  )
}
