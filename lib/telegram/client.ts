import "server-only";

import type { TelegramReply } from "@/lib/telegram/bot";

function normalizeBotToken(value: string) {
  const token = value.trim();
  if (!/^[0-9]{5,15}:[A-Za-z0-9_-]{30,80}$/.test(token)) {
    throw new Error("Telegram bot is not configured.");
  }
  return token;
}

export async function sendTelegramMessage(tokenValue: string, reply: TelegramReply) {
  const token = normalizeBotToken(tokenValue);
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: reply.chatId,
      text: reply.text,
      disable_web_page_preview: true,
      reply_markup: reply.replyMarkup,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error("Telegram rejected the bot response.");
  }
}
