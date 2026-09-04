import { parseClubStartPayload } from "./validation.ts";

export type TelegramInlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; url: string }>>;
};

export type TelegramReply = {
  chatId: number;
  text: string;
  replyMarkup?: TelegramInlineKeyboard;
};

export type TelegramBotClub = {
  name: string;
  shortDescription: string;
  category: string;
  leaderName: string;
  slug: string;
  telegramConfigured: boolean;
  telegramGroupUrl: string | null;
};

export type TelegramBotDependencies = {
  findClubByBotKey: (botKey: string) => Promise<TelegramBotClub | null>;
  sendMessage: (reply: TelegramReply) => Promise<void>;
  siteOrigin: string;
};

type TelegramMessage = {
  chat: { id: number };
  text: string;
};

function readMessage(update: unknown): TelegramMessage | null {
  if (!update || typeof update !== "object" || !("message" in update)) return null;
  const message = update.message;
  if (!message || typeof message !== "object" || !("chat" in message) || !("text" in message)) {
    return null;
  }
  const chat = message.chat;
  if (
    !chat ||
    typeof chat !== "object" ||
    !("id" in chat) ||
    typeof chat.id !== "number" ||
    !Number.isSafeInteger(chat.id) ||
    typeof message.text !== "string" ||
    message.text.length > 4096
  ) {
    return null;
  }
  return { chat: { id: chat.id }, text: message.text };
}

function parseStartCommand(text: string) {
  const match = /^\/start(?:@[A-Za-z0-9_]{5,32})?(?:\s+([^\s]{1,64}))?\s*$/.exec(text);
  return match ? (match[1] ?? null) : undefined;
}

function clubPageUrl(siteOrigin: string, slug: string) {
  return new URL(`/clubs/${encodeURIComponent(slug)}`, siteOrigin).toString();
}

export function getTelegramUpdateChatKey(update: unknown) {
  const message = readMessage(update);
  return message ? String(message.chat.id) : null;
}

export async function handleTelegramUpdate(
  update: unknown,
  dependencies: TelegramBotDependencies,
) {
  const message = readMessage(update);
  if (!message) return { handled: false as const, reason: "unsupported_update" as const };

  const payload = parseStartCommand(message.text);
  if (payload === undefined) return { handled: false as const, reason: "unsupported_command" as const };

  if (!payload) {
    await dependencies.sendMessage({
      chatId: message.chat.id,
      text: "Welcome to QAIRU Clubs. Open the club directory to choose a student club.",
      replyMarkup: {
        inline_keyboard: [[{ text: "Browse clubs", url: new URL("/clubs", dependencies.siteOrigin).toString() }]],
      },
    });
    return { handled: true as const, reason: "welcome" as const };
  }

  const botKey = parseClubStartPayload(payload);
  if (!botKey) {
    await dependencies.sendMessage({
      chatId: message.chat.id,
      text: "This club link is invalid. Please open the club directory and try again.",
      replyMarkup: {
        inline_keyboard: [[{ text: "Browse clubs", url: new URL("/clubs", dependencies.siteOrigin).toString() }]],
      },
    });
    return { handled: true as const, reason: "invalid_payload" as const };
  }

  const club = await dependencies.findClubByBotKey(botKey);
  if (!club) {
    await dependencies.sendMessage({
      chatId: message.chat.id,
      text: "That club is unavailable or no longer active. Browse the current QAIRU club directory instead.",
      replyMarkup: {
        inline_keyboard: [[{ text: "Browse clubs", url: new URL("/clubs", dependencies.siteOrigin).toString() }]],
      },
    });
    return { handled: true as const, reason: "missing_club" as const };
  }

  const lines = [
    club.name,
    "",
    club.shortDescription,
    "",
    `Category: ${club.category}`,
    `Leader: ${club.leaderName}`,
  ];
  if (!club.telegramConfigured || !club.telegramGroupUrl) {
    lines.push("", "The Telegram group is not available yet.");
  }

  const buttons: Array<Array<{ text: string; url: string }>> = [];
  if (club.telegramConfigured && club.telegramGroupUrl) {
    buttons.push([{ text: "Join Telegram group", url: club.telegramGroupUrl }]);
  }
  buttons.push([{ text: "Open club page", url: clubPageUrl(dependencies.siteOrigin, club.slug) }]);

  await dependencies.sendMessage({
    chatId: message.chat.id,
    text: lines.join("\n"),
    replyMarkup: { inline_keyboard: buttons },
  });
  return {
    handled: true as const,
    reason: club.telegramConfigured ? "club" as const : "club_without_group" as const,
  };
}
