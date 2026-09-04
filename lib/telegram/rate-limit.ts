export class TelegramWebhookRateLimiter {
  private readonly entries = new Map<string, { count: number; resetAt: number }>();
  private readonly maximum: number;
  private readonly windowMs: number;

  constructor(maximum = 30, windowMs = 60_000) {
    this.maximum = maximum;
    this.windowMs = windowMs;
  }

  allow(key: string, now = Date.now()) {
    const existing = this.entries.get(key);
    if (!existing || existing.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
      this.prune(now);
      return true;
    }
    if (existing.count >= this.maximum) return false;
    existing.count += 1;
    return true;
  }

  private prune(now: number) {
    if (this.entries.size < 1_000) return;
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}
