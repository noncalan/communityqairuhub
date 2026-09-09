# Routes and pages

This inventory reflects `src/app/**`, `src/proxy.ts`, and `next.config.ts`. Status and access describe **live mode** unless noted. The `(auth)` and `(hub)` folders are route groups and are not URL segments.

## Pages

| Route | Purpose | Live access | Status | Important implementation |
| --- | --- | --- | --- | --- |
| `/` | Public product landing page and live/demo preview | Public; incomplete signed-in users are redirected to onboarding | Implemented | `src/app/page.tsx` |
| `/login` | Email/password signin compatibility route | Public when signed out; signed-in users redirect to home | Implemented; duplicates `/sign-in` | `src/app/(auth)/login/page.tsx`; `AuthForm` |
| `/sign-in` | Email/password signin | Public when signed out; signed-in users redirect to home | Implemented | `src/app/(auth)/sign-in/page.tsx`; `AuthForm` |
| `/sign-up` | Email/password account creation | Public when signed out; signed-in users redirect to home | Implemented | `src/app/(auth)/sign-up/page.tsx`; `AuthForm` |
| `/signup` | Compatibility URL | Public HTTP redirect to `/sign-up` | Implemented redirect | `next.config.ts` |
| `/verify-email` | Confirmation instruction screen | Public; authenticated incomplete users redirect to onboarding | Implemented | `src/app/(auth)/verify-email/page.tsx` |
| `/forgot-password` | Request a password-reset email | Public when signed out | Implemented | `src/app/(auth)/forgot-password/page.tsx`; `AuthForm` |
| `/reset-password` | Choose a new password during recovery | Requires valid Supabase recovery session and recovery marker; otherwise redirected | Implemented | `src/app/(auth)/reset-password/page.tsx`; `src/proxy.ts` |
| `/onboarding` | Five-step first-year profile completion | Authenticated; completed users redirect to home | Implemented | `src/app/onboarding/page.tsx`; `OnboardingFlow` |
| `/home` | Dashboard, recent communities/projects/events, and social feed | Authenticated + onboarding complete | Implemented | `src/app/(hub)/home/page.tsx`; `LiveHome`; `LivePostFeed` |
| `/find` | Team Finder project-role mode | Authenticated + onboarding complete | Implemented | `src/app/(hub)/find/page.tsx`; `ProjectFinder` |
| `/find?mode=people` | Team Finder people mode | Authenticated + onboarding complete | Implemented | `LivePeopleDirectory` with extended filters |
| `/people` | Campus-visible profile directory | Authenticated + onboarding complete | Implemented | `src/app/(hub)/people/page.tsx`; `LivePeopleDirectory` |
| `/u/[username]` | Member profile, follow, and message entry | Authenticated + onboarding complete; RLS/profile visibility applies | Implemented | `src/app/(hub)/u/[username]/page.tsx`; `LiveProfilePage` |
| `/settings` | Edit the current profile and preferences supported by the legacy profile RPC | Authenticated + onboarding complete | Implemented, but does not edit new onboarding direction/role/preferences | `src/app/(hub)/settings/page.tsx`; `LiveSettingsPage` |
| `/communities` | Search/browse/create generic communities | Authenticated + onboarding complete | Implemented | `src/app/(hub)/communities/page.tsx`; live directory/dialog |
| `/communities/[slug]` | Community detail, members, join/leave, and posts | Authenticated + onboarding complete | Implemented | `LiveCommunityDetail`; `LivePostFeed` |
| `/projects` | Search/browse/create projects | Authenticated + onboarding complete | Implemented | `src/app/(hub)/projects/page.tsx`; live directory/dialog |
| `/projects/[slug]` | Project details, team, save, application, and owner review | Authenticated + onboarding complete | Implemented; no edit UI | `LiveProjectDetail` |
| `/events` | Search/browse/create events | Authenticated + onboarding complete | Implemented | `src/app/(hub)/events/page.tsx`; live directory/dialog |
| `/events/[slug]` | Event details, attend/cancel, and save | Authenticated + onboarding complete | Implemented; no edit/waitlist/check-in | `LiveEventDetail` |
| `/resources` | Search/filter/create external resources | Authenticated + onboarding complete | Implemented with external URLs only | `src/app/(hub)/resources/page.tsx`; `LiveResourcesPage` |
| `/resources/[id]` | Resource detail | Authenticated + onboarding complete; UUID required | Implemented | `src/app/(hub)/resources/[id]/page.tsx`; `LiveResourceDetail` |
| `/messages` | Direct conversation list and active thread | Authenticated + onboarding complete | Implemented | `src/app/(hub)/messages/page.tsx`; `LiveMessagesPage` |
| `/notifications` | Notification inbox and read controls | Authenticated + onboarding complete | Implemented | `src/app/(hub)/notifications/page.tsx`; `LiveNotificationsPage` |
| `/opportunities` | Intended verified opportunity directory | Authenticated + onboarding complete | **Not implemented in live mode**; explicit placeholder | `src/app/(hub)/opportunities/page.tsx` |
| `/clubs` | Public active student-club directory | Public | Implemented prototype | `src/app/clubs/page.tsx`; `ClubDirectory` |
| `/clubs/[slug]` | Public active club details and Telegram handoff | Public; inactive/missing clubs return not found | Implemented prototype | `src/app/clubs/[slug]/page.tsx`; `ClubDetail` |
| `/clubs/new` | Organizer club creation | Authenticated + onboarding complete | Implemented prototype | `src/app/clubs/new/page.tsx`; `ClubForm` |
| `/clubs/[slug]/edit` | Owner/moderator club edit | Authenticated + onboarding complete + manager access | Implemented prototype | `src/app/clubs/[slug]/edit/page.tsx`; `ClubForm` |
| `/admin` | Future internal operations | Authenticated + onboarding complete + database `admin` role | **Not implemented beyond access gate**; explicit placeholder | `src/app/admin/page.tsx` |

Unknown routes use `src/app/not-found.tsx`. Route-local loading/error/not-found files exist for the Hub, Team Finder, clubs, and profile/club dynamic pages; they do not add routes.

## Route Handlers and APIs

| Method and route | Purpose | Authentication | Status |
| --- | --- | --- | --- |
| `GET /auth/callback` | Exchange Supabase PKCE confirmation/recovery code and redirect safely | One-time Supabase code | Implemented |
| `PUT /auth/recovery` | Validate and set a new password | Recovery cookie + valid Supabase session | Implemented |
| `POST /auth/recovery` | End local recovery session and remove marker | Recovery/session cleanup | Implemented |
| `GET /api/posts/[postId]/comments` | Load up to 100 post comments | Authenticated + onboarding complete | Implemented |
| `GET /api/core/users` | List profiles | Core Bearer key | Implemented |
| `POST /api/core/users` | Create a profile for an existing Auth user | Core Bearer key + server Supabase secret | Implemented |
| `GET /api/core/users/[id]` | Read profile by UUID | Core Bearer key | Implemented |
| `PATCH /api/core/users/[id]` | Update allowed profile fields | Core Bearer key | Implemented |
| `GET/POST /api/core/communities` | List/create communities | Core Bearer key | Implemented |
| `GET/PATCH /api/core/communities/[id]` | Read/update a community | Core Bearer key | Implemented |
| `GET/POST /api/core/projects` | List/create projects | Core Bearer key | Implemented; does not create roles/technologies |
| `GET/PATCH /api/core/projects/[id]` | Read/update a project | Core Bearer key | Implemented |
| `GET/POST /api/core/events` | List/create events | Core Bearer key | Implemented |
| `GET/PATCH /api/core/events/[id]` | Read/update an event | Core Bearer key | Implemented |
| `POST /api/telegram/webhook` | Handle Telegram club `/start` deep links | Telegram webhook secret | Implemented prototype |

There are no Core DELETE endpoints, public entity-search API, moderation/report API, upload API, `/help`, `/stats`, `/learn`, `/ladder`, or `/join` route in the repository.

## Demo-mode differences

In demo mode, the Hub route gate is disabled and most `(hub)` pages render illustrative components backed by mock data and `localStorage`. `/find` deliberately shows a “requires live mode” message. `/opportunities` has a demo list but remains a live placeholder. Public club reads and club management are not mocked and still require real Supabase configuration/data.
