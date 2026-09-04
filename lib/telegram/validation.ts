export type TelegramGroupLink = {
  url: string;
  kind: "public" | "invite";
  publicUsername: string | null;
};

const publicUsernamePattern = /^[A-Za-z0-9_]{5,32}$/;
const inviteHashPattern = /^[A-Za-z0-9_-]{8,128}$/;
const botKeyPattern = /^[a-f0-9]{24}$/;

export function normalizeTelegramGroupUrl(value: string): TelegramGroupLink {
  const input = value.trim();
  if (!input || input.length > 200) {
    throw new Error("Enter a Telegram group link no longer than 200 characters.");
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("Enter a valid Telegram link, for example https://t.me/qairu_club.");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (
    parsed.protocol !== "https:" ||
    !["t.me", "telegram.me"].includes(hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Telegram links must use HTTPS on t.me without query parameters.");
  }

  const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
  const parts = path.split("/");
  if (parts.length === 1 && publicUsernamePattern.test(parts[0])) {
    return {
      url: `https://t.me/${parts[0]}`,
      kind: "public",
      publicUsername: parts[0],
    };
  }

  if (
    (parts.length === 1 && parts[0].startsWith("+") && inviteHashPattern.test(parts[0].slice(1))) ||
    (parts.length === 2 && parts[0] === "joinchat" && inviteHashPattern.test(parts[1]))
  ) {
    return {
      url: `https://t.me/${parts.join("/")}`,
      kind: "invite",
      publicUsername: null,
    };
  }

  throw new Error("Use a public t.me username or a valid Telegram invite link.");
}

export function normalizeTelegramPublicUsername(
  value: string,
  groupLink: TelegramGroupLink | null,
) {
  const username = value.trim().replace(/^@/, "");
  if (!username) return groupLink?.publicUsername ?? null;
  if (!publicUsernamePattern.test(username)) {
    throw new Error("Telegram usernames must be 5–32 letters, numbers, or underscores.");
  }
  if (
    groupLink?.publicUsername &&
    groupLink.publicUsername.toLowerCase() !== username.toLowerCase()
  ) {
    throw new Error("The public username must match the Telegram group link.");
  }
  return username;
}

export function normalizeTelegramChatId(value: string) {
  const chatId = value.trim();
  if (!chatId) return null;
  if (!/^-?[0-9]{5,20}$/.test(chatId)) {
    throw new Error("Telegram chat ID must contain 5–20 digits and may start with a minus sign.");
  }
  return chatId;
}

export function normalizeBotUsername(value: string) {
  const username = value.trim().replace(/^@/, "");
  if (!publicUsernamePattern.test(username) || !username.toLowerCase().endsWith("bot")) {
    throw new Error("TELEGRAM_BOT_USERNAME must be a valid Telegram bot username.");
  }
  return username;
}

export function validateClubBotKey(value: string) {
  if (!botKeyPattern.test(value)) {
    throw new Error("Invalid club bot identifier.");
  }
  return value;
}

export function buildClubStartPayload(botKey: string) {
  return `club_${validateClubBotKey(botKey)}`;
}

export function buildClubBotDeepLink(botUsername: string, botKey: string) {
  const username = normalizeBotUsername(botUsername);
  const payload = buildClubStartPayload(botKey);
  return `https://t.me/${username}?start=${payload}`;
}

export function parseClubStartPayload(value: string) {
  const match = /^club_([a-f0-9]{24})$/.exec(value);
  return match ? match[1] : null;
}
