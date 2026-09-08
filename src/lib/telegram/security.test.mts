import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TelegramWebhookRateLimiter } from "./rate-limit.ts";
import {
  validateWebhookSecretConfiguration,
  webhookSecretMatches,
} from "./webhook-security.ts";

describe("Telegram webhook boundary", () => {
  it("validates and compares webhook secrets", () => {
    const secret = validateWebhookSecretConfiguration("qairu_webhook_secret_2026");
    assert.equal(webhookSecretMatches(secret, secret), true);
    assert.equal(webhookSecretMatches("wrong_secret_value", secret), false);
    assert.equal(webhookSecretMatches(null, secret), false);
  });

  it("rejects missing or malformed webhook configuration", () => {
    assert.throws(() => validateWebhookSecretConfiguration(undefined));
    assert.throws(() => validateWebhookSecretConfiguration("too short"));
  });

  it("limits repeated updates per chat and resets the window", () => {
    const limiter = new TelegramWebhookRateLimiter(2, 1_000);
    assert.equal(limiter.allow("42", 0), true);
    assert.equal(limiter.allow("42", 100), true);
    assert.equal(limiter.allow("42", 200), false);
    assert.equal(limiter.allow("42", 1_001), true);
  });
});
