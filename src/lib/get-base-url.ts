export function getBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost"))
    return process.env.NEXTAUTH_URL
  return "https://stockview-lemon.vercel.app"
}
