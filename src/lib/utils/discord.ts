const SEVERITY_COLORS = {
  info: 0x3498db,
  warning: 0xf39c12,
  error: 0xe74c3c,
} as const

export async function sendDiscordAlert(
  title: string,
  message: string,
  severity: "info" | "warning" | "error" = "error"
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    console.log(`[discord] No webhook URL configured, skipping alert: ${title}`)
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title,
            description: message.slice(0, 2000),
            color: SEVERITY_COLORS[severity],
            timestamp: new Date().toISOString(),
            footer: { text: "StockView Cron Monitor" },
          },
        ],
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.error(`[discord] Webhook failed: HTTP ${res.status}`)
    }
  } catch (e) {
    console.error(`[discord] Webhook error: ${e instanceof Error ? e.message : String(e)}`)
  } finally {
    clearTimeout(timeout)
  }
}
