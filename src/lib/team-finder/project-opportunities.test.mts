import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProjectOpportunities,
  type ProjectApplicationSnapshot,
  type ProjectDiscoveryRow,
} from "./project-opportunities.ts";

const accountA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const accountB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function project(
  overrides: Partial<ProjectDiscoveryRow> = {},
): ProjectDiscoveryRow {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "campus-ai",
    name: "Campus AI",
    tagline: "Build useful campus tools.",
    category: "Technology",
    status: "building",
    creatorId: accountA,
    creator: {
      id: accountA,
      username: "account_a",
      fullName: "Account A",
    },
    technologies: ["TypeScript", "Postgres"],
    roles: [
      {
        id: "20000000-0000-4000-8000-000000000001",
        title: "Frontend engineer",
        isOpen: true,
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        title: "Closed role",
        isOpen: false,
      },
    ],
    memberIds: [accountA],
    ...overrides,
  };
}

function application(
  status: ProjectApplicationSnapshot["status"],
  createdAt: string,
): ProjectApplicationSnapshot {
  return {
    projectId: "10000000-0000-4000-8000-000000000001",
    projectRoleId: "20000000-0000-4000-8000-000000000001",
    status,
    createdAt,
  };
}

describe("Team Finder project opportunities", () => {
  it("surfaces open roles and excludes closed roles and completed projects", () => {
    const opportunities = buildProjectOpportunities(
      [
        project(),
        project({
          id: "10000000-0000-4000-8000-000000000002",
          slug: "completed-project",
          status: "completed",
        }),
      ],
      [],
      accountB,
    );

    assert.equal(opportunities.length, 1);
    assert.equal(opportunities[0].roleTitle, "Frontend engineer");
    assert.equal(opportunities[0].projectSlug, "campus-ai");
    assert.equal(opportunities[0].canApply, true);
  });

  it("uses the latest application and renders pending or rejected state", () => {
    const pending = buildProjectOpportunities(
      [project()],
      [
        application("rejected", "2026-09-08T09:00:00.000Z"),
        application("pending", "2026-09-09T09:00:00.000Z"),
      ],
      accountB,
    )[0];
    assert.equal(pending.state, "pending");
    assert.equal(pending.canApply, false);

    const rejected = buildProjectOpportunities(
      [project()],
      [application("rejected", "2026-09-09T09:00:00.000Z")],
      accountB,
    )[0];
    assert.equal(rejected.state, "rejected");
    assert.equal(rejected.canApply, true);
  });

  it("never offers an application to the project owner or an existing member", () => {
    const ownerResult = buildProjectOpportunities([project()], [], accountA)[0];
    assert.equal(ownerResult.state, "owner");
    assert.equal(ownerResult.canApply, false);

    const memberResult = buildProjectOpportunities(
      [project({ memberIds: [accountA, accountB] })],
      [],
      accountB,
    )[0];
    assert.equal(memberResult.state, "member");
    assert.equal(memberResult.canApply, false);
  });

  it("keeps accepted state non-actionable even before membership is reloaded", () => {
    const result = buildProjectOpportunities(
      [project()],
      [application("accepted", "2026-09-09T09:00:00.000Z")],
      accountB,
    )[0];
    assert.equal(result.state, "accepted");
    assert.equal(result.canApply, false);
  });
});
