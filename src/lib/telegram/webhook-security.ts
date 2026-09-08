import { timingSafeEqual } from "node:crypto";

const secretPattern = /^[A-Za-z0-9_-]{16,256}$/;

export function validateWebhookSecretConfiguration(value: string | undefined) {
  if (!value || !secretPattern.test(value)) {
    throw new Error("Telegram webhook secret is not configured.");
  }
  return value;
}

export function webhookSecretMatches(provided: string | null, expected: string) {
  if (!provided) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}
