# QAIRU Hub security model

This document records the enforced trust boundaries and the manual controls that must be completed before expanding access beyond a protected preview.

## Authorization model

- Anonymous visitors can reach marketing and authentication pages only. The `anon` database role has no campus-data access and cannot execute mutation RPCs.
- Authenticated users can read completed campus-visible profiles and shared campus content. Private profiles remain owner-only.
- Follows, comments, likes, bookmarks, saves, memberships, applications, attendance, and authored content can be changed only through owner-scoped RLS policies and narrow column grants.
- Resource-save identities are private. Authenticated users can see the aggregate save count and their own saved state, but not other savers.
- Notifications, conversations, membership rows, messages, unread counts, and read state are recipient/participant-only.
- User roles are readable only by their owner and are not writable by authenticated clients. `/admin` checks the `admin` database role on the server and otherwise returns not found.
- Generated IDs, timestamps, ownership metadata, notification identity fields, and disabled Storage paths are not mass-assignable through the Data API.

Application checks improve error messages and reject malformed input early, but PostgreSQL constraints, grants, triggers, RPCs, and RLS remain the final authorization boundary.

## Abuse controls

The database applies fixed-window per-account write quotas to profile changes, follows, community creation and joins, projects and applications, saves, events and attendance, posts, comments, reactions, resources, direct-conversation creation, and messages. These limits cover direct Data API callers as well as the application UI.

Supabase Auth rate limits remain a separate operational control. Review failed-login and email-delivery patterns, and add CAPTCHA at the Auth boundary if preview traffic or abuse warrants it.

## Browser and session controls

- Supabase SSR cookies and `getClaims()` establish the server identity. UI state is keyed by user ID, and logout removes Realtime channels before ending the session.
- Auth callback redirects accept only normalized same-origin paths; scheme-relative, backslash, encoded separator, and control-character variants are rejected.
- A per-request nonce CSP protects scripts. The root layout is deliberately dynamic so Next.js can attach the nonce to every framework script.
- Production responses also set HSTS, frame denial, MIME sniffing protection, a restrictive permissions policy, a strict referrer policy, and no framework identification header.
- User text is rendered as React text. The application has no raw HTML, Markdown renderer, or `dangerouslySetInnerHTML` path.

## Realtime

Only `messages`, `conversation_members`, and `notifications` are in the `supabase_realtime` publication. RLS still applies to subscriptions. Client channels are filtered by the current user or conversation, reconciled after visibility/reconnect, deduplicated by stable IDs, and removed on cleanup/logout.

Before a wider launch, manually repeat the two-browser acceptance test with independent accounts: create/open the same DM, exchange messages in both directions, observe unread/read transitions, create a notification-producing action, reconnect each browser, then sign out Account A and sign in Account B in the same browser to confirm no stale Account A state appears.

## Storage

Supabase Storage is intentionally disabled for product uploads. The database requires `resources.storage_object_path` to remain null, authenticated callers have no grant for that column, and the linked project has no product bucket.

Do not enable uploads until a private bucket, per-object ownership convention, MIME and size allowlist, signed-download policy, cleanup lifecycle, and owner/admin delete rules are implemented and tested. Never make user uploads publicly writable.

## Secrets and environments

- Browser code may contain only `NEXT_PUBLIC_SUPABASE_URL`, the Supabase publishable key, the public site URL, and the public app mode.
- Never add a service-role key, database password, signing key, SMTP credential, or private third-party token to a `NEXT_PUBLIC_*` variable.
- `.env.local` and all `.env*` files except `.env.example` are ignored. Use the hosting provider's encrypted environment settings for preview/production secrets.
- Keep preview and production projects/credentials separate when production is introduced. Rotate any credential immediately if it is ever committed or logged.

## Required Supabase dashboard checks

The local Auth baseline in `supabase/config.toml` requires an eight-character letters-and-digits password, email confirmation, secure password changes, refresh-token rotation, and a 60-second resend interval. Hosted Auth settings are not changed by SQL migrations, so verify them separately:

1. Enable leaked-password protection.
2. Set the exact protected-preview Site URL.
3. Allow only the required callback URLs: `/auth/callback` and the password-reset callback generated by the application. Remove stale localhost or wildcard production redirects.
4. Confirm email verification, secure password change, refresh-token rotation, password policy, Auth request limits, and SMTP delivery settings.
5. Review Auth logs after launch and enable CAPTCHA when abuse signals justify it.

## Product controls before open beta

The protected preview can validate the current model, but open beta also needs a real moderation/report workflow, abuse-response ownership, retention and account-deletion behavior for users who own communities/projects/events, privacy/terms copy, backup/restore drills, and alerting for Auth, database, Realtime, and email failures.

## Verification

Run:

```bash
npm ci
npm audit
npm run test:security
npm run typecheck
npm run lint
npm run build
pwsh -File scripts/verify-security-headers.ps1
```

The pgTAP regression suite is rollback-only. It must be pointed only at a local database or an explicitly selected development project whose fixture account IDs match the test constants.
