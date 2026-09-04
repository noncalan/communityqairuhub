import "server-only";

import { normalizeBotUsername } from "@/lib/telegram/validation";

export function getConfiguredTelegramBotUsername() {
  const value = process.env.TELEGRAM_BOT_USERNAME;
  if (!value) return null;
  try {
    return normalizeBotUsername(value);
  } catch {
    return null;
  }
}
