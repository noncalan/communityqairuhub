import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearVerifiedRequestHeaders,
  VERIFIED_USER_EMAIL_HEADER,
  VERIFIED_USER_ID_HEADER,
} from "../auth/verified-request.ts";

describe("verified request auth context", () => {
  it("removes client-supplied internal identity headers", () => {
    const headers = new Headers({
      [VERIFIED_USER_ID_HEADER]: "attacker-controlled-id",
      [VERIFIED_USER_EMAIL_HEADER]: "attacker@example.com",
      accept: "text/x-component",
    });

    clearVerifiedRequestHeaders(headers);

    assert.equal(headers.get(VERIFIED_USER_ID_HEADER), null);
    assert.equal(headers.get(VERIFIED_USER_EMAIL_HEADER), null);
    assert.equal(headers.get("accept"), "text/x-component");
  });
});
