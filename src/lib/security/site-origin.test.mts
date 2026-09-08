import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeSiteOrigin } from "./site-origin.ts";

describe("normalizeSiteOrigin", () => {
  it("normalizes an HTTPS origin", () => {
    assert.equal(
      normalizeSiteOrigin("https://qairu-preview.example/"),
      "https://qairu-preview.example",
    );
  });

  it("allows the explicit local development origin", () => {
    assert.equal(
      normalizeSiteOrigin("http://localhost:3010"),
      "http://localhost:3010",
    );
  });

  for (const value of [
    "http://qairu-preview.example",
    "https://user:password@qairu-preview.example",
    "https://qairu-preview.example/auth/callback",
    "https://qairu-preview.example?redirect=https://attacker.example",
    "javascript:alert(1)",
  ]) {
    it(`rejects ${JSON.stringify(value)}`, () => {
      assert.throws(() => normalizeSiteOrigin(value));
    });
  }
});
