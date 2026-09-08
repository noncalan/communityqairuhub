# Authenticated Navigation Performance

Date: 2026-09-08  
Runtime: Next.js 16.3 App Router, Vercel Functions in `syd1`, Supabase in `ap-southeast-2`

## Outcome

This pass optimizes for immediate visual feedback and early streaming, not for a single RSC request. Auth, authorization, RLS, CSP, and product behavior are unchanged.

- Authenticated links use the supported Next.js `Link` component again. Default partial prefetch is enabled so `loading.tsx` can be available before a click.
- `useLinkStatus()` shows a top-edge pending indicator while a navigation is waiting.
- `app/(hub)/loading.tsx` covers every route in the authenticated route group; `app/clubs/loading.tsx` covers the separate Clubs tree.
- Hub and Clubs access checks now sit inside Suspense boundaries. Their protected children still wait for the existing checks, while a non-sensitive shell can stream immediately.
- Main list pages render their heading/shell first and stream live data inside route-local Suspense boundaries.
- Home no longer fetches the current profile again. Its greeting uses the profile already provided by the persistent Hub layout.
- Unread counters are deferred until one second after Realtime subscribes and then scheduled during browser idle time. They remain parallel and are never awaited by navigation.
- Messages no longer loads the active conversation twice. The RSC waits only for the conversation list; active messages load in the client after the shell renders.

## Critical path before and after

### Intra-hub navigation

Before:

`click -> manual router.push -> proxy getClaims -> route auth helper -> route query/queries -> first page UI`

After:

`visible Link partial-prefetches loading boundary -> click -> pending indicator/loading UI -> proxy getClaims -> immediate page shell -> route data streams`

The persistent Hub layout and its profile query do not rerun when moving between routes inside `(hub)`.

### First entry into the Hub tree

Before:

`proxy getClaims -> compact profile query -> complete AppShell`

After:

`non-sensitive shell fallback -> proxy getClaims -> compact profile query -> authenticated AppShell`

The compact profile query remains mandatory because it enforces onboarding and supplies the account UI. Protected children are not returned until that check passes.

### Home

Before:

`proxy claims -> current profile query -> start communities/projects/events/feed -> Home UI`

After:

`proxy claims -> verified request headers -> Home greeting/shell -> communities + projects + events + feed in parallel Suspense sections`

The extra Home profile round trip is removed. Metrics, feed, project cards, event cards, and community cards cannot block the greeting.

### Messages

Before:

`conversation-list RPC -> active-message select -> page -> client repeats active-message select after Realtime subscription`

After:

`conversation-list RPC -> messages shell -> one client active-message select + Realtime subscription`

Switching conversations updates the URL with the Next.js-supported native History API integration instead of issuing an unnecessary RSC navigation.

## Exact auth/Supabase calls

For a valid ES256 session, `getClaims()` has these observable paths:

| State | Proxy auth HTTP calls | Server-Timing entries |
|---|---|---|
| Warm function, cached JWK | 0 | `proxy-auth`, `proxy-claims` |
| Cold function or expired JWK cache | `GET /auth/v1/.well-known/jwks.json` | plus `proxy-auth-jwks` |
| Session near expiry | `POST /auth/v1/token?grant_type=refresh_token`; JWK fetch only if not cached | plus `proxy-auth-refresh`, optionally `proxy-auth-jwks` |
| Symmetric token/WebCrypto unavailable | `GET /auth/v1/user` fallback | plus `proxy-auth-user` |

The project currently advertises an EC/ES256 signing key. Supabase Auth JS keeps JWKS in a process-level cache for 10 minutes. After Proxy validates the token, it forwards trusted internal user headers; `getCurrentAuth()` therefore performs no second auth network call on the normal RSC path.

Proxy now returns real response timing for both the total auth section and each actual Supabase Auth network request. Structured server logs retain the route loader/query timings (`home-*`, `people-*`, `projects-query`, `events-query`, and others).

## Main page data after the first shell

| Route | Blocking before its streamed shell | Deferred work |
|---|---|---|
| `/home` | verified user id from request headers | four parallel queries: communities, projects, events, feed |
| `/people` | none in the page shell | completed profiles query; follow snapshot in the browser |
| `/communities` | none in the page shell | one communities query |
| `/projects` | none in the page shell | one projects query |
| `/events` | none in the page shell | one events query |
| `/resources` | none in the route fallback | one resources query |
| `/notifications` | none in the route fallback | one notifications query |
| `/messages` | none in the route fallback | conversation-list RPC, then active messages in the browser |
| `/settings` | none in the route fallback | full profile and profile references in parallel |
| `/clubs` | access gate is behind a shell Suspense fallback | public clubs query |

## Background unread requests

The two observed requests remain functionally necessary but are not navigation dependencies:

- `notifications?select=id&read_at=is.null`
- `get_my_unread_message_count`

Previously they started as soon as the Realtime channel reported `SUBSCRIBED`. They now start after a 1-second delay during idle time, run in parallel, and emit browser metrics named `activity-unread-notifications` and `activity-unread-messages`. Realtime events, reconnects, and explicit read actions still refresh counts immediately.

## Why selected-route TTFB can still be 0.9-1.4 seconds

The database plans are only a few milliseconds, so SQL execution is not the dominant delay. The instrumented critical path can now separate:

1. `proxy-auth` / `proxy-claims`, including any cold JWKS or token refresh network call;
2. the Vercel function/RSC startup and framework work;
3. the named route Supabase query in structured logs;
4. the streamed secondary sections after the first shell.

A warm authenticated Preview trace is required to assign production p50/p95 values. Current Vercel API access returned `403`, so this pass does not claim unobserved deployed latency numbers.

## Remaining bottlenecks

1. A cold Vercel function may still fetch JWKS before it can trust a session. Removing that verification would weaken auth and was not considered.
2. Initial Hub entry still needs one compact profile query for onboarding/account state. It no longer prevents the safe shell fallback from appearing.
3. Feed visibility still has a dependent membership/follow lookup before the posts query, but the entire feed is streamed after Home's primary UI.
4. Detail routes and larger nested relations were not refactored in this pass; their route-level loading state prevents a blank transition.

## Verification procedure

After Preview deployment:

1. Record a warm click between two `(hub)` routes with Chrome Performance and Network panels.
2. Confirm loading/pending UI appears immediately; do not treat incremental RSC requests as failures by themselves.
3. Read `Server-Timing` for `proxy-auth`, `proxy-claims`, and any `proxy-auth-*` network entry.
4. Correlate the pathname with Vercel `server_timing` logs for the named route query.
5. Confirm unread client requests start after the navigation UI and do not delay its commit.

## Local verification

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed: 50 tests.
- `npm run build` — passed with Next.js 16.3.0 / Turbopack.
- `git diff --check` — passed.
- A local production request returned `proxy-auth;dur=6.1` and `proxy-claims;dur=0.6` with no `proxy-auth-network` entry, confirming a zero-auth-round-trip claims path and real response headers. This anonymous local sample is instrumentation validation, not a prediction of authenticated Preview latency.
