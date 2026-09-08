import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasValidCoreAuthorization } from "./security.ts";

const key = "core_test_key_with_at_least_32_chars_123456";

describe("Core API bearer authentication", () => {
  it("accepts only the exact configured bearer token", () => {
    assert.equal(hasValidCoreAuthorization(`Bearer ${key}`, key), true);
    assert.equal(hasValidCoreAuthorization(`Bearer ${key}x`, key), false);
  });

  it("rejects missing, malformed, and whitespace-padded credentials", () => {
    assert.equal(hasValidCoreAuthorization(null, key), false);
    assert.equal(hasValidCoreAuthorization(key, key), false);
    assert.equal(hasValidCoreAuthorization(`bearer ${key}`, key), false);
    assert.equal(hasValidCoreAuthorization(`Bearer  ${key}`, key), false);
    assert.equal(hasValidCoreAuthorization(`Bearer ${key} `, key), false);
  });
});
