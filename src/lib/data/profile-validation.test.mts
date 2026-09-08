import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  academicDirections,
  projectInterestNames,
  roleOptions,
  rolesForDirection,
} from "./onboarding-options.ts";
import { validateOnboardingProfileInput } from "./profile-validation.ts";

const validInput: Parameters<typeof validateOnboardingProfileInput>[0] = {
  username: "first_year_student",
  fullName: "First Year Student",
  bio: "",
  academicDirection: "machine_learning",
  desiredRole: "machine_learning_engineer",
  interestIds: ["interest-1", "interest-2"],
  contributionPreferences: ["build_code", "research"],
};

describe("first-year onboarding options", () => {
  it("offers exactly two directions and a single shared copy of cross-direction roles", () => {
    assert.deepEqual(
      academicDirections.map((direction) => direction.name),
      ["Machine Learning", "Physical AI"],
    );
    assert.equal(new Set(roleOptions.map((role) => role.id)).size, roleOptions.length);
    assert.ok(
      rolesForDirection("machine_learning").some(
        (role) => role.id === "computer_vision_engineer",
      ),
    );
    assert.ok(
      rolesForDirection("physical_ai").some(
        (role) => role.id === "computer_vision_engineer",
      ),
    );
  });

  it("contains only the project-oriented interest taxonomy", () => {
    assert.equal(projectInterestNames.length, 20);
    assert.ok(projectInterestNames.includes("AI Agents"));
    assert.ok(projectInterestNames.includes("Hardware + AI"));
    assert.ok(!projectInterestNames.includes("Football" as never));
    assert.ok(!projectInterestNames.includes("Film" as never));
  });
});

describe("first-year onboarding validation", () => {
  it("accepts valid Machine Learning and Physical AI selections", () => {
    assert.equal(validateOnboardingProfileInput(validInput), null);
    assert.equal(
      validateOnboardingProfileInput({
        ...validInput,
        academicDirection: "physical_ai",
        desiredRole: "robotics_engineer",
      }),
      null,
    );
  });

  it("rejects a role from the other direction", () => {
    assert.equal(
      validateOnboardingProfileInput({
        ...validInput,
        academicDirection: "physical_ai",
      }),
      "Choose a role that matches your academic direction.",
    );
  });

  it("enforces the interest and contribution selection limits", () => {
    assert.equal(
      validateOnboardingProfileInput({
        ...validInput,
        interestIds: ["1", "2", "3", "4", "5", "6"],
      }),
      "Choose between 1 and 5 project interests.",
    );
    assert.equal(
      validateOnboardingProfileInput({
        ...validInput,
        contributionPreferences: [],
      }),
      "Choose between 1 and 5 contribution preferences.",
    );
  });
});
