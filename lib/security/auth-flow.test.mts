import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authErrorMessage } from "../auth/auth-errors.ts";
import {
  PASSWORD_REQUIREMENTS,
  validatePassword,
} from "../auth/password-policy.ts";

describe("validatePassword", () => {
  it("matches the hosted policy: 8 characters, a letter, and a number", () => {
    assert.deepEqual(validatePassword("Abcdefg1"), []);
    assert.deepEqual(validatePassword("abcdefg"), [
      PASSWORD_REQUIREMENTS[0],
      PASSWORD_REQUIREMENTS[2],
    ]);
    assert.deepEqual(validatePassword("12345678"), [
      PASSWORD_REQUIREMENTS[1],
    ]);
    assert.deepEqual(validatePassword("abcdefgh"), [
      PASSWORD_REQUIREMENTS[2],
    ]);
  });
});

describe("authErrorMessage", () => {
  it("maps sign-in errors without exposing raw provider details", () => {
    assert.equal(
      authErrorMessage({ code: "invalid_credentials" }, "sign-in"),
      "Email or password is incorrect.",
    );
    assert.equal(
      authErrorMessage({ code: "email_not_confirmed" }, "sign-in"),
      "Confirm your email before signing in.",
    );
    assert.equal(
      authErrorMessage({ message: "sensitive provider detail" }, "sign-in"),
      "Sign in could not be completed. Please try again.",
    );
  });

  it("explains unavailable sign-up email delivery without provider details", () => {
    assert.equal(
      authErrorMessage(
        {
          code: "email_address_not_authorized",
          message: "internal SMTP configuration detail",
        },
        "sign-up",
      ),
      "Sign-up email delivery is currently unavailable for this address. Please contact the QAIRU Hub team.",
    );
  });

  it("maps weak-password and expired recovery errors", () => {
    assert.match(
      authErrorMessage({ code: "weak_password" }, "reset"),
      /at least 8 characters.*one letter.*one number/i,
    );
    assert.match(
      authErrorMessage({ code: "session_expired" }, "reset"),
      /expired/i,
    );
  });
});
