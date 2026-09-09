import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesPeopleFinderFilters } from "./people-filter.ts";

const profile = {
  fullName: "Aruzhan Student",
  username: "aruzhan",
  program: "Machine Learning",
  academicYear: 1,
  bio: "Building computer vision tools for campus.",
  skills: [{ name: "TypeScript" }, { name: "Computer Vision" }],
  interests: [{ name: "AI Agents" }],
  availableForProjects: true,
  openToCollaboration: false,
};

const allFilters = {
  query: "",
  program: "All",
  skill: "All",
  interest: "All",
  academicYear: "All",
  availability: "All",
  collaboration: "All",
};

describe("Team Finder people filters", () => {
  it("matches real profile fields used by the campus directory", () => {
    assert.equal(matchesPeopleFinderFilters(profile, {
      ...allFilters,
      query: "computer vision",
      program: "Machine Learning",
      skill: "TypeScript",
      academicYear: "1",
      availability: "true",
    }), true);
  });

  it("honors availability and collaboration independently", () => {
    assert.equal(matchesPeopleFinderFilters(profile, {
      ...allFilters,
      availability: "true",
    }), true);
    assert.equal(matchesPeopleFinderFilters(profile, {
      ...allFilters,
      collaboration: "true",
    }), false);
  });

  it("rejects non-matching program, year, skill, and interest filters", () => {
    for (const filters of [
      { program: "Physical AI" },
      { academicYear: "2" },
      { skill: "Robotics" },
      { interest: "Data Products" },
    ]) {
      assert.equal(matchesPeopleFinderFilters(profile, {
        ...allFilters,
        ...filters,
      }), false);
    }
  });
});
