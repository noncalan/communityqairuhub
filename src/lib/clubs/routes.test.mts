import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isProtectedClubManagementPath,
  isPublicClubBrowsePath,
} from "../auth/app-routes.ts";

describe("club route access", () => {
  it("keeps directory and details public", () => {
    assert.equal(isPublicClubBrowsePath("/clubs"), true);
    assert.equal(isPublicClubBrowsePath("/clubs/qairu-ai-club"), true);
  });

  it("keeps create and edit routes authenticated", () => {
    assert.equal(isPublicClubBrowsePath("/clubs/new"), false);
    assert.equal(isProtectedClubManagementPath("/clubs/new"), true);
    assert.equal(isProtectedClubManagementPath("/clubs/qairu-ai-club/edit"), true);
  });
});
