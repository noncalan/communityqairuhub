import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type ClubInput, slugifyClubName, validateClubInput } from "./validation.ts";

const validInput: ClubInput = {
  name: "QAIRU AI Club",
  slug: "qairu-ai-club",
  shortDescription: "A practical student community for applied AI projects.",
  description: "Students learn, build, and review applied artificial intelligence projects together.",
  category: "Technology",
  logoUrl: "https://assets.qairu.example/clubs/ai.png",
  leaderName: "Aruzhan S.",
  contact: "ai-club@qairu.edu.kz",
  status: "active",
  telegramGroupUrl: "https://t.me/qairu_ai",
  telegramPublicUsername: "@qairu_ai",
  telegramChatId: "-1001234567890",
};

describe("club input validation", () => {
  it("normalizes a complete create/edit payload", () => {
    const result = validateClubInput(validInput, {
      allowedLogoOrigins: ["https://assets.qairu.example"],
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.telegramGroupUrl, "https://t.me/qairu_ai");
    assert.equal(result.data.telegramPublicUsername, "qairu_ai");
  });

  it("catches obvious invalid fields before the database request", () => {
    const result = validateClubInput({
      ...validInput,
      slug: "New",
      shortDescription: "short",
      contact: "javascript:alert(1)",
    }, { allowedLogoOrigins: ["https://assets.qairu.example"] });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.fieldErrors.slug);
    assert.ok(result.fieldErrors.shortDescription);
    assert.ok(result.fieldErrors.contact);
  });

  it("rejects untrusted logo origins and chat IDs without a group", () => {
    const result = validateClubInput({
      ...validInput,
      logoUrl: "https://evil.example/logo.png",
      telegramGroupUrl: "",
      telegramPublicUsername: "",
    }, { allowedLogoOrigins: ["https://assets.qairu.example"] });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.fieldErrors.logoUrl);
    assert.ok(result.fieldErrors.telegramChatId);
  });

  it("creates URL-safe slugs", () => {
    assert.equal(slugifyClubName("  QAIRU Robotics & AI  "), "qairu-robotics-ai");
  });
});
