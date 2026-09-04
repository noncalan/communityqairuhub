import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClubBotDeepLink,
  buildClubStartPayload,
  normalizeBotUsername,
  normalizeTelegramChatId,
  normalizeTelegramGroupUrl,
  parseClubStartPayload,
} from "./validation.ts";

describe("Telegram validation and deep links", () => {
  it("normalizes public and private group links", () => {
    assert.deepEqual(normalizeTelegramGroupUrl("https://telegram.me/qairu_ai/"), {
      url: "https://t.me/qairu_ai",
      kind: "public",
      publicUsername: "qairu_ai",
    });
    assert.equal(
      normalizeTelegramGroupUrl("https://t.me/+Abcdefgh_123").kind,
      "invite",
    );
  });

  for (const value of [
    "javascript:alert(1)",
    "http://t.me/qairu_ai",
    "https://evil.example/qairu_ai",
    "https://t.me/qairu_ai?next=https://evil.example",
    "https://user:pass@t.me/qairu_ai",
    "https://t.me/c/123/456",
  ]) {
    it(`rejects unsafe group URL ${JSON.stringify(value)}`, () => {
      assert.throws(() => normalizeTelegramGroupUrl(value));
    });
  }

  it("builds and parses a stable Telegram-compatible payload", () => {
    const key = "aabbccddeeff001122334455";
    assert.equal(buildClubStartPayload(key), `club_${key}`);
    assert.equal(parseClubStartPayload(`club_${key}`), key);
    assert.equal(
      buildClubBotDeepLink("@QAIRUClubBot", key),
      `https://t.me/QAIRUClubBot?start=club_${key}`,
    );
  });

  it("rejects malformed payloads, bot usernames, and chat IDs", () => {
    assert.equal(parseClubStartPayload("club_ai"), null);
    assert.throws(() => normalizeBotUsername("not-a-bot"));
    assert.throws(() => normalizeTelegramChatId("-100abc"));
  });
});
