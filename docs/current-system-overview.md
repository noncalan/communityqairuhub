# Current system overview

Last verified against the repository: 2026-09-09 (`master` at `018dafd`).

## What QAIRU HUB is today

QAIRU HUB is a Next.js campus-community application for QAIRU students. The current code supports member profiles, people and team discovery, communities, projects and project applications, events, a social feed, shared resources, direct messages, notifications, and a public student-club directory with a Telegram handoff prototype.

The repository contains two runtime modes selected by `NEXT_PUBLIC_APP_MODE` in [`src/lib/app-mode.ts`](../src/lib/app-mode.ts):

| Mode | Data and access behavior |
| --- | --- |
| `live` | Uses Supabase Auth, PostgreSQL, RLS, RPCs, and Realtime. Hub routes require an authenticated, onboarded user. |
| `demo` | Uses illustrative data and browser `localStorage` for much of the Hub UI. It is a product demonstration, not proof of a live backend flow. |

Any value other than exactly `live` selects demo mode. Club routes are an exception: `/clubs` and `/clubs/[slug]` always read the real public Supabase projection, and club management always uses authenticated Supabase data.

## Technology baseline

- Node.js 24.x; Next.js 16.3.4 App Router; React 19.2.8; TypeScript 5.
- Tailwind CSS 4, Radix UI, shadcn configuration, Lucide, Sonner, and `next-themes`.
- Supabase Auth, PostgreSQL, Data API, RLS, RPC functions, and Realtime.
- Vercel deployment configuration with the `syd1` function region.
- Telegram Bot API through a Next.js Route Handler.
- ESLint, the Node.js test runner, and transactional pgTAP database tests.
- Vercel Speed Insights is rendered. The Vercel Analytics package is installed but is not rendered by the application.

Exact package versions are in [`package.json`](../package.json) and [`package-lock.json`](../package-lock.json).

## Implementation status

| Area | Current state |
| --- | --- |
| Live member application | Implemented for a controlled preview, with explicit gaps documented in [Known limitations](known-limitations.md). |
| Authentication and onboarding | Email/password signup, confirmation callback, signin, recovery, logout, and a five-step first-year onboarding flow are implemented. University/student-status verification is not. |
| Core campus features | Profiles, directory filters, communities, projects, applications, events, posts, resources, messages, notifications, and follows have live code and database models. Some management and lifecycle operations remain incomplete. |
| Team Finder | Implemented at `/find` for open project roles and discoverable people. Matching is filter-based, not ranked or automatic. |
| Student clubs | Public directory and owner/moderator create/edit workflow are implemented as a prototype on the `communities` model. |
| Telegram | Club deep links and a secret-protected webhook are implemented. Student account linking, reminders, and bot-admin verification are not. |
| Operations | `/admin` and `/opportunities` are intentional live-mode placeholders. There is no moderation/reporting workflow or `/help` route. |

## User flows that work in live mode

1. **Account setup:** sign up with email/password, confirm through `/auth/callback`, complete `/onboarding`, then enter `/home`.
2. **Account recovery:** request a reset email, exchange the recovery callback, update the password in a short-lived recovery flow, then sign in again.
3. **Profile discovery:** browse completed campus-visible profiles, filter them, open `/u/[username]`, follow a member, or start a direct message.
4. **Team discovery:** use `/find` to filter open roles on non-completed projects or find people by profile fields; apply to a role; project owners can accept or reject an application.
5. **Communities and feed:** create or join a community, open its member and post view, publish posts, comment, like, bookmark, and share links.
6. **Projects:** create a project with technologies and open roles, save it, apply, and review applications. Acceptance creates project membership in the database.
7. **Events:** create an event, browse/search events, attend or cancel attendance, and save an event. Database triggers enforce capacity.
8. **Resources:** publish an external HTTP(S) resource, browse/filter it, open its detail route, and save it. File upload is deliberately disabled.
9. **Messages and notifications:** create/open a direct conversation, page through messages, send messages, receive Realtime updates, and manage notification read state.
10. **Clubs:** anonymously browse active clubs; an onboarded organizer can create or edit a club and its Telegram handoff data; the bot resolves the latest public club record.

## Source-of-truth boundaries

This documentation treats executable code, migrations, tests, and committed configuration as authoritative. Dated files under `docs/audits/` are evidence from their review date, not guarantees about the current hosted environment. Hosted Supabase settings, deployed Vercel environment variables, SMTP delivery, DNS, and full browser E2E behavior cannot be proven from this checkout alone.

See [Implemented features](implemented-features.md), [Routes and pages](routes-and-pages.md), and [Database and Supabase](database-and-supabase.md) for the detailed inventory.
