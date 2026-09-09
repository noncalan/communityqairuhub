# QAIRU Hub Community — Current State

Updated: 2026-09-09

## Team Finder

Status: implemented with automated verification; manual multi-account E2E verification remains pending.

### Implemented and verified

- `/find` is the canonical authenticated Team Finder route and is present in product navigation.
- “Find a project” lists real open roles on non-completed projects using the existing `projects`, `project_roles`, `project_members`, and `project_applications` model.
- Finder results show the current user’s application or membership state and link to the existing project detail/application flow.
- Project owners, existing members, pending applicants, and accepted applicants are not offered an invalid apply action.
- “Find people” reuses the live campus-visible, onboarding-complete profile directory and existing profile and message entry points.
- People can be filtered by fields already stored in the profile model: program, skill, interest, academic year, project availability, and collaboration preference.
- Loading, empty, filtered-empty, and route-level error states are implemented.
- Application and membership authorization continues to rely on the existing server action validation, RLS policies, uniqueness constraints, and acceptance trigger.
- Focused TypeScript and transactional pgTAP regression coverage was added for Team Finder discovery, state derivation, profile privacy, and application authorization.

### Implemented but not manually E2E verified

- The full two-account flow from discovery through owner acceptance and member-state refresh.
- Mobile browser behavior and keyboard navigation in a live authenticated session.

### Configuration-dependent

- Live results require Supabase live mode, valid authenticated profiles, and projects with open roles.
- Local database authorization tests require the Supabase local stack and its standard seeded profile fixtures.

### Deferred

- Role descriptions, required skills, experience level, hours per week, and application deadlines because those fields do not exist in the current schema.
- Automatic matching, rankings, recommendations, and one-off help requests; these are outside the MVP Team Finder scope.

## Documentation note

`docs/community-product-spec.md` was not present in this checkout during implementation. The Team Finder work used the bounded issue requirements, the live repository implementation, migrations, RLS policies, RPCs, and tests as its sources of truth.
