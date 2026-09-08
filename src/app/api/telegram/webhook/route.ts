import { getPublicClubByBotKey } from "@/lib/clubs/data";
import { getTrustedSiteOrigin } from "@/lib/security/site-origin";
import { createAnonymousServerClient } from "@/lib/supabase/anonymous-server";
import { getTelegramUpdateChatKey, handleTelegramUpdate } from "@/lib/telegram/bot";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { TelegramWebhookRateLimiter } from "@/lib/telegram/rate-limit";
import {
  validateWebhookSecretConfiguration,
  webhookSecretMatches,
} from "@/lib/telegram/webhook-security";

export const runtime = "nodejs";

const bodyLimit = 128 * 1024;
const limiter = new TelegramWebhookRateLimiter();

export async function POST(request: Request) {
  let expectedSecret: string;
  try {
    expectedSecret = validateWebhookSecretConfiguration(process.env.TELEGRAM_WEBHOOK_SECRET);
  } catch {
    return Response.json({ ok: false, error: "Webhook unavailable" }, { status: 503 });
  }

  if (!webhookSecretMatches(request.headers.get("x-telegram-bot-api-secret-token"), expectedSecret)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > bodyLimit) {
    return Response.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  let update: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > bodyLimit) {
      return Response.json({ ok: false, error: "Payload too large" }, { status: 413 });
    }
    update = JSON.parse(body) as unknown;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const chatKey = getTelegramUpdateChatKey(update);
  if (chatKey && !limiter.allow(chatKey)) {
    return Response.json(
      { ok: false, error: "Rate limited" },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }

  try {
    const supabase = createAnonymousServerClient();
    const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
    const result = await handleTelegramUpdate(update, {
      siteOrigin: getTrustedSiteOrigin(),
      findClubByBotKey: (botKey) => getPublicClubByBotKey(supabase, botKey),
      sendMessage: (reply) => sendTelegramMessage(token, reply),
    });
    return Response.json({ ok: true, handled: result.handled });
  } catch {
    return Response.json({ ok: false, error: "Webhook processing failed" }, { status: 502 });
  }
}
