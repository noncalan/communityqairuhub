import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePagination, validatePayload } from "./validation.ts";

const profileId = "951a1a1b-c173-4b21-8ee7-3700899addb7";

describe("Core API body validation", () => {
  it("normalizes a valid user profile create payload", () => {
    const result = validatePayload("users", {
      id: profileId,
      username: "  Test_User  ",
      full_name: "  Test   User  ",
      academic_year: 2,
      profile_visibility: "private",
    }, "create");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.username, "test_user");
    assert.equal(result.data.full_name, "Test User");
  });

  it("rejects unknown and server-managed fields", () => {
    const result = validatePayload("communities", {
      name: "Changed name",
      telegram_bot_key: "attacker-value",
      creator_id: profileId,
    }, "update");
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.fieldErrors.telegram_bot_key, "Field is not allowed.");
    assert.equal(result.fieldErrors.creator_id, "Field is not allowed.");
  });

  it("requires complete create bodies and non-empty patches", () => {
    const create = validatePayload("projects", { name: "Incomplete" }, "create");
    assert.equal(create.ok, false);
    if (!create.ok) assert.ok(create.fieldErrors.creator_id);

    const update = validatePayload("events", {}, "update");
    assert.equal(update.ok, false);
    if (!update.ok) assert.ok(update.fieldErrors.body);
  });

  it("checks event time ordering", () => {
    const result = validatePayload("events", {
      slug: "test-event",
      title: "Test event",
      description: "A valid event description.",
      category: "Testing",
      starts_at: "2026-09-08T12:00:00Z",
      ends_at: "2026-09-08T11:00:00Z",
      location: "Room 1",
      capacity: 10,
      organizer_id: profileId,
    }, "create");
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.fieldErrors.ends_at);
  });
});

describe("Core API pagination validation", () => {
  it("uses bounded defaults", () => {
    const result = parsePagination("https://hub.example/api/core/users");
    assert.deepEqual(result, { ok: true, data: { limit: 50, offset: 0 } });
  });

  it("rejects unsupported, duplicate, and out-of-range parameters", () => {
    const result = parsePagination("https://hub.example/api/core/users?limit=1&limit=2&offset=10001&search=x");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.fieldErrors.limit);
      assert.ok(result.fieldErrors.offset);
      assert.ok(result.fieldErrors.search);
    }
  });
});
