import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeInternalPath } from "./redirects.ts";

const origin = "https://hub.qairu.example";

describe("safeInternalPath", () => {
  it("accepts an internal path with its query and fragment", () => {
    assert.equal(
      safeInternalPath("/messages?conversation=123#latest", origin),
      "/messages?conversation=123#latest",
    );
  });

  for (const value of [
    "https://attacker.example",
    "//attacker.example",
    "/\\attacker.example",
    "/%5cattacker.example",
    "/%2fattacker.example",
    "/home%0d%0aLocation:%20https://attacker.example",
    "home",
    "",
  ]) {
    it(`rejects ${JSON.stringify(value)}`, () => {
      assert.equal(safeInternalPath(value, origin), null);
    });
  }
});
