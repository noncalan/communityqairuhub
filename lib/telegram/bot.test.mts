import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  handleTelegramUpdate,
  type TelegramBotClub,
  type TelegramReply,
} from "./bot.ts";

const key = "aabbccddeeff001122334455";
const activeClub: TelegramBotClub = {
  name: "QAIRU AI Club",
  shortDescription: "Applied AI by students.",
  category: "Technology",
  leaderName: "Aruzhan S.",
  slug: "qairu-ai-club",
  telegramConfigured: true,
  telegramGroupUrl: "https://t.me/qairu_ai",
};

function harness(club: TelegramBotClub = activeClub) {
  const replies: TelegramReply[] = [];
  return {
    replies,
    dependencies: {
      siteOrigin: "https://qairu.example",
      findClubByBotKey: async (requested: string) => requested === key ? club : null,
      sendMessage: async (reply: TelegramReply) => { replies.push(reply); },
    },
  };
}

describe("Telegram club bot", () => {
  it("answers plain /start with the public directory", async () => {
    const test = harness();
    const result = await handleTelegramUpdate({ message: { chat: { id: 42 }, text: "/start" } }, test.dependencies);
    assert.equal(result.reason, "welcome");
    assert.equal(test.replies[0].replyMarkup?.inline_keyboard[0][0].url, "https://qairu.example/clubs");
  });

  it("resolves a club and generates both inline buttons", async () => {
    const test = harness();
    const result = await handleTelegramUpdate(
      { message: { chat: { id: 42 }, text: `/start club_${key}` } },
      test.dependencies,
    );
    assert.equal(result.reason, "club");
    assert.match(test.replies[0].text, /QAIRU AI Club/);
    assert.deepEqual(test.replies[0].replyMarkup?.inline_keyboard, [
      [{ text: "Join Telegram group", url: "https://t.me/qairu_ai" }],
      [{ text: "Open club page", url: "https://qairu.example/clubs/qairu-ai-club" }],
    ]);
  });

  it("handles a known club without a Telegram group truthfully", async () => {
    const test = harness({ ...activeClub, telegramConfigured: false, telegramGroupUrl: null });
    const result = await handleTelegramUpdate(
      { message: { chat: { id: 42 }, text: `/start club_${key}` } },
      test.dependencies,
    );
    assert.equal(result.reason, "club_without_group");
    assert.match(test.replies[0].text, /not available yet/);
    assert.equal(test.replies[0].replyMarkup?.inline_keyboard.length, 1);
  });

  it("handles malformed and unknown club links without leaking internals", async () => {
    const invalid = harness();
    const invalidResult = await handleTelegramUpdate(
      { message: { chat: { id: 42 }, text: "/start club_bad" } },
      invalid.dependencies,
    );
    assert.equal(invalidResult.reason, "invalid_payload");
    assert.match(invalid.replies[0].text, /invalid/);

    const missing = harness();
    const missingResult = await handleTelegramUpdate(
      { message: { chat: { id: 42 }, text: "/start club_ffffffffffffffffffffffff" } },
      missing.dependencies,
    );
    assert.equal(missingResult.reason, "missing_club");
    assert.doesNotMatch(missing.replies[0].text, /database|uuid|Supabase/i);
  });

  it("ignores invalid update payloads and unsupported commands", async () => {
    const test = harness();
    assert.equal((await handleTelegramUpdate({}, test.dependencies)).handled, false);
    assert.equal(
      (await handleTelegramUpdate({ message: { chat: { id: 42 }, text: "/help" } }, test.dependencies)).handled,
      false,
    );
    assert.equal(test.replies.length, 0);
  });
});
