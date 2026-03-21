import { z } from "zod"

/**
 * Environment variable validation.
 * All server-side secrets are optional at schema level to allow builds to succeed.
 * Use requireEnv() in runtime code paths that need specific variables.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  APP_URL: z.string().optional(),
  OPENDART_API_KEY: z.string().optional(),
  NAVER_CLIENT_ID: z.string().optional(),
  NAVER_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | null = null

function parseEnv(): Env {
  if (_env) return _env
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    throw new Error(`Invalid environment variables:\n${formatted}`)
  }
  _env = result.data
  return _env
}

/** Lazy-evaluated proxy — parses on first property access, not at import time */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return parseEnv()[prop as keyof Env]
  },
})

/** Require a specific env var at runtime — throws with a clear message if missing */
export function requireEnv(key: keyof Env): string {
  const value = env[key]
  if (!value) {
    throw new Error(`[env] Required environment variable ${key} is not set`)
  }
  return value
}
