# Authentication and security

## Authentication flow

QAIRU HUB uses Supabase email/password Auth through `@supabase/ssr` and `@supabase/supabase-js`.

1. The browser auth service in `src/lib/auth/service.ts` signs up or signs in.
2. Signup and recovery emails return to `GET /auth/callback`, which exchanges the PKCE code for a session.
3. Confirmation without a recovery target routes to onboarding or home based on the profile.
4. Recovery sets a 15-minute HTTP-only, `SameSite=Lax` marker. `PUT /auth/recovery` requires that marker, validates the password, and updates the authenticated Supabase user. Cleanup signs out the local session and removes the marker.
5. `src/proxy.ts` refreshes session cookies, validates claims, gates routes in live mode, and forwards only internally verified user headers.
6. Server components/actions use the cached helpers in `src/lib/auth/current-user.ts`; direct contexts without Proxy headers fall back to `auth.getClaims()`.

The application password policy is at least eight characters with a letter and a number, matching committed local Supabase configuration. Hosted Auth settings must be checked separately.

## Access matrix in live mode

| Surface/data | Anonymous | Authenticated but not onboarded | Authenticated and onboarded |
| --- | --- | --- | --- |
| Landing and auth pages | Allowed | Usually redirected toward onboarding/home as applicable | Auth entry pages redirect to home. |
| Active club directory/detail | Allowed through `public_clubs` | Allowed; layout redirects incomplete users to onboarding | Allowed. |
| Club create/edit | Redirected to login | Redirected to onboarding by the club layout | Allowed subject to owner/moderator RLS. |
| Hub pages | Redirected to login | Redirected to onboarding | Allowed subject to row policies. |
| Profiles/reference/social/content tables | Data API privileges denied | Authenticated policies apply, but application mutations require onboarding | RLS exposes completed campus profiles/shared campus data and owned private rows. |
| Messages/notifications | Denied | No application access | Participant/recipient rows only. |
| `/admin` | Not found | Onboarding redirect only after identity/role checks | Only a user with `user_roles.role = 'admin'`; page remains a placeholder. |
| Core API | User session is irrelevant | User session is irrelevant | Requires the separate server-to-server Bearer key. |
| Telegram webhook | Requires Telegram secret header | Same | Same. |

There is no university-domain or verified-student authorization state. “Authenticated” means Supabase accepted the account/session; it does not prove current QAIRU enrollment.

## RLS and ownership guarantees

The committed schema enables RLS on every declared `public` table (31 tables). The effective guarantees include:

- anonymous Data API callers cannot read campus profiles/content; their deliberate exception is the narrow active-club projection;
- a user can insert/update only their own profile and profile references;
- other profiles are visible only when onboarding is complete and visibility is `campus`;
- follows, joins, attendance, reactions, bookmarks, and saves derive or check the acting `auth.uid()`;
- community owners/moderators and project owners/permitted editors receive scoped update rights;
- applications are visible only to applicant and project creator, and only the appropriate party can change their state;
- messages and conversation rows are participant-only; notification rows are recipient-only;
- user roles are owner-readable and not writable by authenticated clients;
- resource saves reveal only the caller's rows; a private aggregate helper supplies counts without saver identities.

RLS is reinforced by column-level grants. Authenticated clients cannot mass-assign generated IDs/timestamps, notification identity fields, message identities, owner metadata, or `resources.storage_object_path`. Constraints bound text, URLs, tags, array sizes, enum-like fields, event times/capacity, and relationship integrity.

## Server Actions and Route Handlers

All mutation actions validate authentication close to the mutation. Most feature actions also require onboarding completion. They normalize identifiers and input lengths before calling Supabase, but database constraints/RLS remain the authoritative boundary.

The comments GET handler independently checks authentication/onboarding and returns `Cache-Control: private, no-store`. Auth callback redirects pass through `safeInternalPath`, which rejects cross-origin, scheme-relative, backslash, encoded-separator, and control-character destinations.

## Core API security

`/api/core/**` is intentionally excluded from user-session redirects. Its boundary is:

- `Authorization: Bearer <CORE_API_KEY>` with exact constant-time digest comparison;
- at least 32 configured characters for the API key;
- 64 KiB JSON body limit and exact `application/json` requirement;
- strict resource/field allowlists, immutable-field rejection, UUID/URL/time/range validation, and bounded pagination;
- explicit response projections that exclude `communities.telegram_bot_key`;
- private no-store responses and generic database errors.

After validation, the API uses `SUPABASE_SECRET_KEY` or the legacy `SUPABASE_SERVICE_ROLE_KEY`. This client is privileged and bypasses RLS. Its safety therefore depends on keeping both keys server-only, restricting the Bearer key, maintaining the allowlists, and rotating credentials after exposure. The Core API creates profiles only for existing `auth.users`; it does not manage passwords, identities, or sessions. DELETE is not exposed.

The service-role ownership migration permits trusted Core inserts to trigger community/project owner-membership creation, while ordinary authenticated inserts still require `creator_id = auth.uid()`.

## Telegram webhook security

`POST /api/telegram/webhook`:

- validates `X-Telegram-Bot-Api-Secret-Token` with a timing-safe comparison;
- fails closed when the 16–256 character server secret is invalid/missing;
- rejects declared or actual bodies above 128 KiB and invalid JSON;
- validates supported message/update and deep-link formats;
- rate-limits each chat to 30 updates/minute in an in-memory per-process map;
- reads only the anonymous-safe active club view;
- validates the Bot API token and applies an 8-second outbound timeout;
- sends plain text, not interpreted HTML/Markdown.

The limiter is not shared across Vercel instances and is not a durable abuse-control guarantee.

## Browser response controls

`src/proxy.ts` generates a fresh per-request CSP nonce. `src/app/layout.tsx` is forced dynamic so framework scripts can receive it. The policy restricts scripts, frames, objects, base URI, forms, workers, and network/image origins. Development adds only the sources required by local tooling.

`next.config.ts` removes `X-Powered-By` and adds `nosniff`, frame denial, strict-origin referrer policy, COOP, a restrictive permissions policy, and production HSTS. User text is rendered as React text; the source scan found no `dangerouslySetInnerHTML` path.

## Database abuse controls and Storage

Phase 3 migrations add fixed-window database quotas to profile writes, follows, community creation/joins, projects/applications/saves, events/attendance/saves, posts/comments/reactions/bookmarks, resources/saves, messages, and direct-conversation creation. These protect direct Data API calls as well as application actions.

Supabase Storage services may exist in local configuration, but product upload is disabled: `resources.storage_object_path` must be null and authenticated clients lack write access to it. The UI accepts external HTTP(S) resource URLs only. Club logos are external HTTPS URLs restricted to the configured site or Supabase origin.

## Security tests

- Node tests cover auth errors/passwords, route classification, redirect/origin validation, internal-header stripping, Core Bearer validation, club/Telegram validation, and finder input/state logic.
- `security_regression.test.sql` covers public-table RLS, Realtime publication scope, cross-account profile/comment/save/role/notification isolation, mass assignment, unsafe URLs/tags, quotas, event capacity, conversation identity, and outsider denial.
- Dedicated pgTAP suites cover clubs, Core service-role ownership, onboarding, and Team Finder applications/membership.

See [Testing and quality](testing-and-quality.md) for commands and limitations.

## Guarantees not established by this repository

The checkout cannot confirm hosted leaked-password protection, exact hosted redirect allowlists, SMTP delivery, CAPTCHA, backup/restore, operational alerting, current Supabase advisor output, or a production two-browser Realtime test. The August audit recorded leaked-password protection as disabled at that time; its current state is unknown. Moderation/reporting, account deletion/retention rules, and legal/privacy pages are not implemented.
