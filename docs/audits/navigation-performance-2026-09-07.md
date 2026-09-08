# Performance Pass 1

Date: 2026-09-07

## Scope

This pass targets authenticated client-side navigation latency without changing UI or product behavior. It only changes request authentication/profile loading and adds timing visibility. It does not change RLS policies, CSP, Supabase authorization, or feature behavior.

## Preview baseline

- Observed symptom: authenticated client-side navigations often take about 3–5 seconds on Vercel Preview.
- The inspected Preview deployment was running in `iad1` and was warm for the sampled requests.
- `/home` server execution p95 was about 4,105 ms across 9 sampled invocations. The sample is small, so it is a baseline rather than a performance guarantee.
- The production build still marks all application routes as dynamic. The CSP nonce in the root layout intentionally requires per-request rendering.

## What changed

### 1. Proxy auth is now database-free

- `src/proxy.ts` no longer imports or calls `getProfileGate()`.
- Proxy performs Supabase `auth.getClaims()` only, then applies the existing session, recovery-flow, public/protected-route, and auth-page redirects.
- The validated user ID and email are forwarded to the downstream request through internal headers.
- Incoming copies of those internal headers are always removed before validated values are written, so a browser cannot use them to impersonate another user.
- Refreshed Supabase cookies are still copied to normal and redirect responses.

### 2. Current-user access is split by required data

- `getCurrentAuth()` is the lightweight path. It returns the request-scoped Supabase client, validated `userId`, email, and claims without querying `profiles`.
- `getCurrentProfileGate()` adds only the minimal `username, full_name, onboarding_completed` profile query.
- `getCurrentUser()` remains the full-profile path and is used only where complete profile fields are rendered or supplied to shared UI.
- All three helpers use React request memoization. Layouts and pages in one render reuse auth/profile work rather than issuing duplicate helper queries.
- When Proxy has already validated claims, server helpers reuse its verified request context. Direct executions that do not contain that context safely fall back to `auth.getClaims()`.

Lightweight auth is now used by hub people, projects, events, communities, resources, notifications, messages, public profile pages, club detail/edit pages, and profile mutation actions.

Full profile loading remains in the hub layout and the home page because those paths render or provide the complete profile. The new-club page reuses the minimal profile gate for its organizer-name default.

### 3. Onboarding access control moved to server boundaries

Removing the profile query from Proxy required moving the onboarding check to the boundaries that own profile-dependent access:

- The hub layout blocks every `(hub)` route until onboarding is complete.
- `/`, `/onboarding`, `/verify-email`, and the clubs layout preserve their previous onboarding redirects.
- `/admin` preserves both the onboarding gate and the independent `user_roles` admin check.
- Content, social, activity, and club Server Actions apply the minimal onboarding gate before mutation.
- The comments API requires both authentication and completed onboarding.

Supabase RLS remains the final database authorization boundary and was not changed.

## Server-Timing instrumentation

Proxy responses and redirects now expose an actual HTTP header:

```text
Server-Timing: proxy-auth;dur=12.3;desc="Supabase claims validation"
```

The following server-side metrics are emitted as structured Vercel runtime logs with `event: "server_timing"`:

| Metric | Scope |
|---|---|
| `proxy-auth` | Proxy Supabase claims validation |
| `current-user-auth` | Lightweight current-auth helper total |
| `current-user-claims-fallback` | Claims validation when verified Proxy context is unavailable |
| `current-user-profile-gate` | Minimal onboarding/profile-gate query |
| `current-user-full` | Full current-user helper total |
| `current-user-profile` | Full profile query |
| `hub-layout-loaders` | Hub auth/profile and unread-count loaders |
| `home-page-loaders` | Home auth/profile and initial page data loaders |

Next.js Server Components cannot mutate the completed HTTP response header from a page or layout. Their metrics therefore use the same Server-Timing names and durations in structured logs instead of adding another request or weakening streaming. Inspect deployment logs for JSON entries containing `"event":"server_timing"` and correlate them with the request path.

## Expected effect

- Every matched request removes the Proxy `profiles` database round trip.
- Most route/page code that only needs identity no longer requests a full profile.
- The second claims validation in Server Components is removed when the request passed through Proxy.
- Auth/profile work shared by hub layout and page stays request-memoized.

No post-change Preview latency is claimed yet. The effect must be measured after a new Preview deployment with the instrumentation above and a larger warm-request sample.

## Remaining bottlenecks

These were measured or found during the audit but are intentionally not optimized in pass 1:

1. All routes are dynamically rendered because the root layout uses a per-request CSP nonce. This prevents static output and CDN page caching.
2. `/home` still performs several Supabase operations: full profile, two unread-count calls, communities, projects, events, plus the feed loader. The top-level loaders run in parallel, but `listHomeFeed()` first loads follows and memberships and only then loads feed rows.
3. Several list/detail queries select large nested relationships and up to 100 records. Query plans, indexes, payload size, and database-region latency still need Preview measurements.
4. Some unrelated routes retain their own sequential loader chains, including people follow snapshots, messages, and project detail/application hydration.
5. Browser prefetch can create additional dynamic server invocations. Prefetch behavior and route-level loading boundaries have not been changed in this pass.
6. Vercel Function and Supabase region co-location has not been changed or benchmarked in this pass.

## Verification

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed: 50 tests, 0 failures, including internal auth-header sanitization.
- `npm run build` — passed with Next.js 16.3.0 / Turbopack.
- Local production runtime smoke test — `/login` returned `200` with `Server-Timing: proxy-auth;dur=6.8;desc="Supabase claims validation"` and the existing CSP/security headers.
- `git diff --check` — passed.

## Pass boundary

Pass 2 has not been started. The next decision should be based on a new Vercel Preview trace: first compare `proxy-auth`, `hub-layout-loaders`, and `home-page-loaders`, then optimize the largest remaining measured segment.
