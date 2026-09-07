import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { firstRelated, parsePublicClubRows } from "./parser.ts";

const validRow = {
  id: "bf044ee3-e4d1-4659-a836-13fe443f21cd",
  slug: "vibecoding",
  name: "Vibecoding",
  short_description: "Lets code with vibe",
  description: "A practical club for building software together.",
  category: "coding",
  logo_url: null,
  leader_name: "Araika",
  contact: "organizer@example.com",
  status: "active",
  telegram_bot_key: "959f5a0a62245b8262b8609e",
  telegram_configured: true,
  telegram_group_url: "https://t.me/lalalalcodevibe",
  telegram_public_username: "lalalalcodevibe",
  created_at: "2026-09-06T08:13:44.976Z",
  updated_at: "2026-09-06T08:13:44.976Z",
};

describe("club row parsing", () => {
  it("accepts arbitrary safe categories and preserves Telegram data", () => {
    const clubs = parsePublicClubRows([validRow], { allowedLogoOrigins: [] }, () => {});
    assert.equal(clubs.length, 1);
    assert.equal(clubs[0].category, "coding");
    assert.equal(clubs[0].telegramConfigured, true);
    assert.equal(clubs[0].telegramGroupUrl, "https://t.me/lalalalcodevibe");
  });

  it("skips one malformed row without losing valid clubs or logging raw values", () => {
    const contexts: unknown[] = [];
    const unsafeCategory = `coding${String.fromCharCode(0)}bad`;
    const clubs = parsePublicClubRows(
      [{ ...validRow, category: unsafeCategory }, validRow],
      { allowedLogoOrigins: [] },
      (context) => contexts.push(context),
    );
    assert.equal(clubs.length, 1);
    assert.equal(contexts.length, 1);
    assert.match(JSON.stringify(contexts[0]), /category/);
    assert.equal("category" in (contexts[0] as Record<string, unknown>), false);
  });

  it("normalizes Supabase to-one relations whether null, object, or array", () => {
    const relation = { telegram_chat_id: "-1001234567890" };
    assert.equal(firstRelated(null), null);
    assert.deepEqual(firstRelated(relation), relation);
    assert.deepEqual(firstRelated([relation]), relation);
  });
});
