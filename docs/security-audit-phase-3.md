# QAIRU Hub Phase 3 security audit

**Review date:** 2026-08-14  
**Scope:** Current Next.js application, linked Supabase development project, migrations through Phase 2C, direct Data API boundaries, Realtime, authentication flows, browser response policy, dependencies, and repository secret exposure.  
**Release gate:** **PASS for a protected preview / small controlled beta.** No unresolved critical or high-severity issue remains. This is not approval for an unrestricted public launch; the manual dashboard and product controls below remain launch work.

## Executive summary

Phase 2C was confirmed present before changes. The audit reviewed the real remote schema and policies, exercised cross-account behavior with two existing development accounts, applied two forward-only migrations, and added repeatable application and database security tests. Existing user and application data was preserved; adversarial test data ran inside transactions and was rolled back.

Two high-severity authorization weaknesses were found and fixed:

1. Authenticated Data API callers had table-wide insert/update grants on much of the schema, allowing generated IDs, timestamps, and dormant Storage ownership metadata to be supplied directly.
2. Resource bookmarks exposed saver identities to every authenticated user, unlike the platform's other private save/bookmark models.

The review also closed an auth-callback open redirect, added a server-side admin role gate, introduced database-enforced write quotas, made profile saves atomic, bounded high-fanout queries and RPC inputs, and introduced a per-request nonce CSP with production response headers.

## Findings and remediation

| ID | Severity | Finding | Disposition |
|---|---:|---|---|
| P3-01 | High | Broad table grants let direct Data API callers mass-assign generated IDs, timestamps, ownership-adjacent metadata, and `resources.storage_object_path`. RLS prevented many ownership changes but was not a complete column boundary. | Fixed. Authenticated writes now use explicit column grants. Generated IDs/timestamps and the Storage path are excluded. The Storage path also has a database `IS NULL` constraint. |
| P3-02 | High | `resource_saves` had a global authenticated SELECT policy, exposing who bookmarked each resource. | Fixed. Saver rows are owner-only. A narrowly scoped definer function exposes only aggregate counts; the view separately derives the current user's state. Cross-account tests prove identity isolation. |
| P3-03 | Medium | The auth callback allowed a path such as `/\\attacker.example`; WHATWG URL resolution treats it as a cross-origin redirect. | Fixed. Redirects must be normalized same-origin paths and reject raw/encoded separators and control characters. Nine regression cases pass. |
| P3-04 | Medium | `/admin` was reachable by any onboarded user. It currently showed static placeholder data, so no privileged mutation was exposed, but the boundary was unsafe for future work. | Fixed. The page now checks `user_roles.role = 'admin'` server-side and otherwise returns not found. Client metadata is not trusted. |
| P3-05 | Medium | Product writes had no database-bound abuse throttling; direct Data API callers could bypass UI-level pacing. | Fixed. Seventeen write paths use per-account fixed-window database quotas, including messages, posts, comments, reactions, resources, saves, follows, projects, events, attendance, and DM creation. Auth limits remain separately managed by Supabase Auth. |
| P3-06 | Medium | Profile, interest, and skill changes were several independent requests and could leave partial state. | Fixed. `save_my_profile` performs the full change in one invoker-security transaction. |
| P3-07 | Medium | Browser responses lacked a strong CSP and baseline hardening headers. | Fixed. Per-request nonces, `strict-dynamic`, no unsafe inline scripts, dynamic rendering, HSTS, frame denial, nosniff, strict referrer policy, permissions restrictions, COOP, and hidden framework identification are verified against a production server. |
| P3-08 | Low | Auth UI surfaced registration-specific and unexpected provider errors, creating an account-enumeration and information-disclosure edge. | Fixed. Unknown/registration cases are generic; safe sign-in, confirmation, and rate-limit guidance remains. Password-reset copy is enumeration resistant. |
| P3-09 | Low | Several directory/comment queries and project child arrays were unbounded. | Fixed. Directory, comment, application, reference, and conversation reads are capped; project technologies/roles are capped in both the action and RPC. |
| P3-10 | Low | Two `app_private` helpers retained PostgreSQL's default PUBLIC execute grant. Schema usage and function checks prevented exploitation, but the ACL violated least privilege. | Fixed. PUBLIC/anon access is explicitly revoked; only authenticated callers can execute the two intended helpers. Trigger-only helpers remain PostgreSQL-only. |
| P3-11 | Informational | Supabase runtime dependencies were range-based and a build-only CLI was installed as a production dependency. | Fixed. Supabase packages are exactly pinned, Node 22+ is declared, `shadcn` is development-only, and the lockfile is v3. |

## Authorization matrix and RLS conclusions

All 29 public tables have RLS enabled. Public Data API exposure is restricted as follows:

| Data class | Anonymous | Authenticated read | Authenticated write | Admin/service boundary |
|---|---|---|---|---|
| Programs, interests, skills | Denied | Read-only | Denied | Seed/migration controlled |
| Profiles and profile references | Denied | Completed campus profiles; owner can also see private/incomplete self | Own profile/references only; narrow columns; transactional RPC | No client role grant |
| Follows and public social membership | Denied | Campus-visible relationship data | Actor must be `auth.uid()`; owner/moderator checks for privileged edits | Trigger-derived owner rows |
| Projects, events, posts, comments, resources | Denied | Authenticated campus content | Creator/author/organizer/member policies plus constraints and narrow columns | No service credential in app code |
| Project applications | Denied | Applicant and project creator only | Applicant creates/withdraws; creator reviews | Acceptance trigger derives membership |
| Bookmarks and saves | Denied | Own rows only; resource aggregate counts reveal no identity | Own rows only | No admin bypass exposed |
| Notifications | Denied | Recipient only | Recipient can change `read_at` only; inserts are trigger-only | Trigger identity derives from protected source rows |
| Conversations and messages | Denied | Participants only | RPC/direct insert derives sender/recipient; only own read state mutable | Private helper ACLs are explicit |
| User roles | Denied | Own roles only | Denied | Provisioned outside client role; admin page verifies server-side |

`post_feed_items` and `resource_items` are `security_invoker` views. Public RPCs use invoker security, explicit empty `search_path`, no anonymous/PUBLIC execute grant, and `auth.uid()` checks. Every definer function has an empty search path; trigger helpers are PostgreSQL-only, while the three deliberately callable private helpers have explicit authenticated ACLs.

## Authentication, sessions, CSRF, and account isolation

- Server identity uses Supabase SSR cookies and `getClaims()`. Protected layouts and every mutation independently require an authenticated user.
- Server Actions inherit Next.js Origin/Host validation. The only custom application Route Handler is authenticated GET-only; no separate cookie-authenticated mutation endpoint was found.
- Login and password-reset UI validation require eight characters; the local Auth baseline additionally requires letters and digits, confirmation, secure password changes, token rotation, and resend pacing.
- Forgot-password messaging does not reveal whether an account exists. Registration-specific provider errors are no longer shown directly.
- Redirect destinations are same-origin-normalized before use.
- Authenticated provider state is keyed by user ID; sign-out removes Realtime channels before ending the Auth session. This reduces Account A state surviving an Account B login in the same browser.
- A manual email-delivery/password-reset test is still required because hosted SMTP, exact Auth redirect allowlists, and mailbox delivery cannot be proven through SQL.

## Realtime and messaging

The `supabase_realtime` publication contains exactly:

- `conversation_members`
- `messages`
- `notifications`

RLS remains the final subscription filter. Client subscriptions are scoped to a conversation or recipient, reconcile state after visibility/reconnect, deduplicate by stable IDs, and clean up on effect teardown and logout. The database suite proved bidirectional message identity derivation, exactly two members per direct conversation, idempotent conversation creation, and complete outsider isolation.

A manual two-browser acceptance test remains necessary to validate WebSocket delivery timing, browser lifecycle behavior, unread transitions, and reconnection with two truly independent cookie jars.

## XSS, content, and URL handling

No `dangerouslySetInnerHTML`, direct `innerHTML`, `document.write`, dynamic code execution, custom Markdown renderer, or sanitizer bypass was found. User content is rendered through React text nodes. External resource links use `noopener noreferrer`.

Resource URLs are validated in both the Server Action and PostgreSQL. The database requires HTTP(S), rejects credentials, whitespace, control characters and backslashes, limits length, and rejects active-content schemes. Tags are normalized and bounded at the database boundary. CSP validation confirms framework scripts receive the current nonce and unsafe inline scripts are not allowed.

## Secrets and dependency review

- Only `.env.example` is tracked. `.env.local` is ignored.
- Browser-visible environment use is limited to the Supabase URL, publishable key, public site URL, and public app mode.
- No service-role key, database URL/password, private key marker, or equivalent privileged credential pattern was found in current tracked files or Git history.
- No service-role credential is used by the application.
- `npm audit --audit-level=moderate`: **0 vulnerabilities** across 673 installed packages.
- A clean `npm ci --ignore-scripts` completed successfully. The sole pending lifecycle script reported by npm belongs to `unrs-resolver`, a transitive development-only ESLint resolver, and is not needed for the production installation.
- Safe updates available during the review were development/tooling updates (`shadcn` 4.18 and newer major versions of ESLint/TypeScript/types). They were not mixed into the hardening phase because no vulnerability required them.

## CSP and security headers

Production verification against `/login` passed all checks:

- HTTP 200
- nonce CSP present
- `script-src` includes `strict-dynamic`
- no `unsafe-inline` script allowance
- every emitted framework script nonce matches the response policy
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` plus CSP `frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- restrictive `Permissions-Policy`
- `Strict-Transport-Security`
- `Cross-Origin-Opener-Policy: same-origin`
- no `X-Powered-By`
- no shared-cache directive on the nonce-bearing HTML

The root layout is intentionally forced dynamic because a per-request nonce cannot safely coexist with statically cached HTML.

## Storage and file architecture

The linked project has **0 Storage buckets, 0 Storage policies, and 0 storage-backed resources**. Product uploads are explicitly disabled by a database constraint and column grants. External HTTP(S) resources continue to work.

Before uploads are enabled, implement a private bucket, per-object ownership, MIME/size allowlists, signed reads, owner/admin deletes, orphan cleanup, malware/content handling, and cross-account Storage policy tests. No public writable bucket is acceptable.

## Supabase advisors

Final Security Advisor result: one hosted Auth warning, **Leaked Password Protection Disabled**. It requires a dashboard/Management API setting and cannot be corrected by a database migration. Remediation: [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Final Performance Advisor result: informational unused-index notices only. The schema is new and the audited project contains little data, so usage statistics are not meaningful. No index was removed; revisit after representative preview traffic and query statistics exist.

## Verification evidence

| Check | Result |
|---|---:|
| Linked-project pgTAP authorization/adversarial assertions | **35 passed, 0 failed** |
| Redirect normalization unit tests | **9 passed, 0 failed** |
| TypeScript strict check | **Passed** |
| ESLint | **Passed** |
| Next.js 16.3 production build | **Passed** |
| Production CSP/header probe | **Passed** |
| npm dependency audit | **0 vulnerabilities** |
| Secret/current-history scan | **No privileged credential pattern found** |
| Final public RLS inventory | **29/29 tables enabled** |
| Realtime publication inventory | **Exactly 3 intended tables** |

The database suite covers anonymous denial, Account A vs Account B profile/comment/save/role/notification boundaries, community-role escalation, forged timestamps and Storage paths, URL/tag constraints, project fanout, database rate limits, event capacity, direct-message idempotency and membership, both message directions, and a nonparticipant attacker. The test transaction was rolled back.

## Required manual actions

Before inviting preview users:

1. Enable [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) in hosted Supabase Auth.
2. Verify the hosted password policy, email confirmation, secure password change, refresh-token rotation, resend interval, exact Site URL, and exact callback allowlist. Remove stale production wildcards/localhost entries.
3. Configure and test production SMTP; complete sign-up verification and password-reset delivery in a real mailbox.
4. Run the two-independent-browser Realtime acceptance test described in `SECURITY.md`.
5. Confirm preview/production environment separation and encrypted environment configuration at the eventual host.

Before an unrestricted public beta, also implement moderation/reporting and abuse-response ownership, account deletion/retention behavior for owned entities, legal/privacy copy, backup/restore drills, and operational alerts. Add Auth CAPTCHA when traffic or abuse signals justify it.

## Final gate

**PASS — protected preview / small controlled beta.**

Gate basis: no unresolved critical/high issue, production build succeeds, direct Data API and cross-account boundaries pass, Realtime publication and RLS are scoped, browser hardening is verified, secrets/dependencies are clean, and the remaining advisor/manual items are documented operational controls rather than an exploitable high-severity defect.

No deployment was performed.
