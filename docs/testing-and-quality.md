# Testing and quality

## JavaScript/TypeScript test suite

`npm test` chains five Node.js test groups. On 2026-09-09 it passed **71 tests, 0 failures**.

| Command | Files | Coverage focus | Tests in latest run |
| --- | --- | --- | ---: |
| `npm run test:security` | `src/lib/security/*.test.mts` | Password/auth error behavior, protected-route classification, Core route bypass classification, safe redirects, trusted site origin, and untrusted internal-header removal | 24 |
| `npm run test:prototype` | `src/lib/clubs/*.test.mts`, `src/lib/telegram/*.test.mts` | Club row parsing, route access, validation, Telegram URLs/deep links, bot behavior, webhook secret checks, and rate limiter | 27 |
| `npm run test:team-finder` | `src/lib/team-finder/*.test.mts` | People filter semantics and project opportunity/application-state derivation | 7 |
| `npm run test:core` | `src/lib/core-api/*.test.mts` | Exact Bearer-token validation, request allowlists, field normalization, time validation, and pagination | 8 |
| `npm run test:onboarding` | `src/lib/data/*.test.mts` | Direction/role taxonomy and first-year onboarding input constraints | 5 |

The tests use Node's built-in runner with `--experimental-strip-types`. The current run emits `MODULE_TYPELESS_PACKAGE_JSON` warnings because `package.json` has no explicit module type; this is a warning, not a test failure.

## Database pgTAP suites

`supabase/tests/database/` contains **84 planned assertions** across five rollback-only suites:

| File | Assertions | Coverage |
| --- | ---: | --- |
| `clubs_prototype.test.sql` | 12 | Atomic club creation/update, draft exclusion, anonymous public view, Telegram validation/privacy, and cross-account edit denial |
| `core_api_security.test.sql` | 6 | Service-role owner-membership triggers and continued authenticated ownership-forgery denial |
| `onboarding_profile.test.sql` | 11 | Added columns, anonymous RPC denial, both directions, Year 1 derivation, interest persistence, cross-direction role rejection, and selection bounds |
| `security_regression.test.sql` | 35 | Public RLS inventory, Realtime scope, column grants, cross-account isolation, URL/tag/storage constraints, rate limits, capacity, notification forgery, conversation identity, and outsider denial |
| `team_finder.test.sql` | 20 | Open-role discovery, anonymous/closed-role denial, application ownership/uniqueness/review rules, membership trigger, private-profile hiding, and RLS presence |

Run them only against the local stack or an explicitly chosen disposable/development database with the expected fixture accounts:

```bash
npx supabase start
npx supabase db reset
npx supabase test db --local supabase/tests/database
```

The SQL files begin a transaction and finish with `rollback`, but they depend on fixed development profile UUIDs in the seed data. Do not point them at production.

## Quality commands

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Additional security/header verification:

```powershell
pwsh -File scripts/verify-security-headers.ps1
```

`npm run build` also runs the version-pinned Sonner CSP patch through `prebuild`. `postinstall` applies the same patch after dependency installation. A version mismatch intentionally fails and requires reviewing the workaround.

## What is covered well

- Pure validation and security-sensitive parsing have focused unit tests.
- Database tests exercise direct Data API authorization, not only UI behavior.
- RLS tests use multiple account identities and an outsider identity.
- Transactional RPC side effects are asserted for onboarding, projects, messaging, and clubs.
- Security headers have a dedicated production-server probe.

## Known coverage limits

- No Playwright/Cypress/browser E2E suite is present.
- No automated test performs a real email signup/confirmation/recovery delivery flow.
- Realtime WebSocket behavior still needs a two-browser manual test.
- Telegram tests mock data/API dependencies; no committed test registers a real webhook or calls a real bot.
- Core tests cover security/validation and database trigger behavior, but not HTTP handlers end to end with a deployed secret/service-role client.
- No automated Vercel deployment, DNS, custom-domain, or production smoke test exists.
- `npm test` does not invoke pgTAP, lint, typecheck, build, dependency audit, or the security-header script.
- Directory searches are tested as pure filter logic only for Team Finder people; broader UI accessibility and mobile behavior remain manual.

During this documentation-only change, `npm test` was run and passed. Lint, typecheck, and build were not required because no executable/configuration files changed.
