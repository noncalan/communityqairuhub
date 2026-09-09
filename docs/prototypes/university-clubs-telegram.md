# QAIRU University Clubs + Telegram Prototype

## Overview

This prototype demonstrates a university-owned club directory and organizer workflow while Telegram handles club conversation. It is additive: the original QAIRU Hub communities, feed, people, projects, events, resources, messaging, notifications, authentication, and security architecture remain intact.

The prototype uses real Supabase records. It does not replace unavailable Live data with fictional club records.

## Architecture

```text
Public visitor / authenticated organizer
                  |
                  v
       Next.js club routes and actions
                  |
                  v
  Supabase communities + Telegram settings
        (single source of truth)
                  |
        +---------+---------+
        |                   |
        v                   v
  Public club pages   Telegram webhook
                            |
                            v
                    Telegram Bot API
                            |
                            v
                  Telegram club groups
```

The website and bot never synchronize separate copies. Website create/edit actions write one transaction to Supabase. Public website reads and bot lookups both query `public.public_clubs`.

## Database

Migration: `supabase/migrations/20260904170420_university_clubs_telegram_prototype.sql`

### Reused table: `public.communities`

The existing community model remains canonical. The prototype adds:

- `short_description`: concise directory/bot text;
- `logo_url`: optional trusted HTTPS logo URL;
- `leader_name`: public organizer label;
- `contact`: optional public contact method;
- `telegram_bot_key`: random 24-character hexadecimal routing key, stable when the editable slug changes.

Existing `status` is reused:

- `active`: publicly readable and bot-resolvable;
- `forming`: inactive organizer draft, absent from public and bot queries.

### `public.club_telegram_integrations`

Stores intentionally public Telegram handoff data:

- `community_id`;
- normalized `group_url`;
- optional `public_username`;
- timestamps.

“Configured” is derived from the existence of a valid integration row. It does not mean the bot is an administrator and the UI never claims that it is.

### `public.club_telegram_connections`

Stores optional `telegram_chat_id` separately. This is manager-only connection metadata and is not included in the public directory view. The split prevents an authenticated public club read policy from making private connection metadata broadly readable.

### `public.public_clubs`

A narrow `security_invoker` view exposes active clubs. It contains public club fields, group handoff data, and the opaque bot key, but no creator/profile ID and no Telegram chat ID. RLS remains active on the underlying tables.

### Transactional RPCs

- `public.create_university_club(...)`
- `public.update_university_club(...)`

Both are `SECURITY INVOKER`, authenticated-only functions. They rely on the caller's RLS permissions and make club plus Telegram changes atomically. A failed Telegram constraint cannot leave a partially created club.

## Website Components

Routes:

- `/clubs`: public searchable and category-filterable directory;
- `/clubs/[slug]`: public active club detail and Telegram bot handoff;
- `/clubs/new`: authenticated organizer create flow;
- `/clubs/[slug]/edit`: authenticated owner/moderator edit flow;
- `/api/telegram/webhook`: secret-protected Telegram webhook, `POST` only.

Important modules:

- `src/components/clubs/club-directory.tsx`: responsive public filtering and club cards;
- `src/components/clubs/club-detail.tsx`: club information and truthful Telegram state;
- `src/components/clubs/club-form.tsx`: shared create/edit form and client validation;
- `src/lib/clubs/validation.ts`: reusable input contract;
- `src/lib/clubs/data.ts`: Supabase data access and transaction RPC calls;
- `src/app/actions/clubs.ts`: authentication, server validation, safe errors, and revalidation.

Loading, empty, missing, and backend error states are explicit. The public error state states that demo data was not substituted.

## Telegram Bot

Relevant modules:

- `src/lib/telegram/validation.ts`: group URLs, usernames, chat IDs, stable payloads, and bot deep links;
- `src/lib/telegram/bot.ts`: update parsing and club response composition, with injected data/API boundaries;
- `src/lib/telegram/client.ts`: server-only Bot API `sendMessage` call;
- `src/lib/telegram/webhook-security.ts`: secret configuration and timing-safe comparison;
- `src/lib/telegram/rate-limit.ts`: bounded per-instance webhook throttling;
- `src/app/api/telegram/webhook/route.ts`: HTTP boundary;
- `src/lib/supabase/anonymous-server.ts`: stateless publishable-key Supabase client for public bot lookup.

The website creates a deep link like:

```text
https://t.me/QAIRUClubBot?start=club_aabbccddeeff001122334455
```

Telegram sends `/start club_<key>`. The bot validates the 24-character opaque key, reads the current active club through the public view, and sends:

- club name;
- short description;
- category;
- leader;
- `Join Telegram group` inline button when a group is configured;
- `Open club page` inline button.

Unknown/inactive clubs and missing groups receive friendly messages without database IDs or provider details. Bot messages use plain text, so stored club text is not interpreted as Telegram HTML or Markdown.

## Environment Variables

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_APP_MODE=live

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
```

- `TELEGRAM_BOT_TOKEN`: server-only token from BotFather;
- `TELEGRAM_BOT_USERNAME`: public username, with or without `@`;
- `TELEGRAM_WEBHOOK_SECRET`: random 16–256 character value using letters, digits, `_`, or `-`.

Do not prefix the token or webhook secret with `NEXT_PUBLIC_`. No service-role key is needed: the bot deliberately uses the same active-only public projection as a visitor.

## Local Setup

Prerequisites: Node.js 24, Docker Desktop, and the Supabase CLI.

```powershell
npm install
npx supabase start
npx supabase db reset
npx supabase status
npm run dev -- -p 3010
```

Copy the local API URL and publishable/anon key reported by `supabase status` into `.env.local`. Use a site URL matching the development port (`http://localhost:3010` for the command above). `supabase/config.toml` still contains Auth URLs on port `3000`, so align those values before testing redirects. Set `NEXT_PUBLIC_APP_MODE=live` to exercise existing authentication and organizer flows.

Localhost cannot receive Telegram webhooks directly. Use a trusted HTTPS tunnel for a temporary bot test or deploy this branch to an isolated Vercel Preview. Never point a test webhook at Production unless that change is intentional.

## Telegram Setup

1. Open the verified `@BotFather` account in Telegram.
2. Run `/newbot`, choose the display name and a username ending in `bot`.
3. Store the returned token as `TELEGRAM_BOT_TOKEN`; never paste it into source or chat.
4. Set `TELEGRAM_BOT_USERNAME` to the bot's public username.
5. Generate a random webhook secret and set `TELEGRAM_WEBHOOK_SECRET` in the same server environment.
6. Deploy to an isolated public HTTPS Preview or expose local development through a trusted HTTPS tunnel.
7. Register the webhook with Telegram's `setWebhook` method:

```powershell
$webhookBody = @{
  url = "$env:PUBLIC_SITE_URL/api/telegram/webhook"
  secret_token = $env:TELEGRAM_WEBHOOK_SECRET
  allowed_updates = @("message")
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.telegram.org/bot$env:TELEGRAM_BOT_TOKEN/setWebhook" `
  -ContentType "application/json" `
  -Body $webhookBody
```

Telegram then sends the configured secret in `X-Telegram-Bot-Api-Secret-Token`. The route rejects missing/mismatched secrets, invalid JSON, bodies over 128 KiB, and excessive updates per chat. Telegram documents deep-link payloads and webhook secrets at:

- <https://core.telegram.org/bots/features#deep-linking>
- <https://core.telegram.org/bots/api#setwebhook>

## How to Connect a Club

1. Sign in to QAIRU Hub and finish the existing onboarding flow.
2. Open `/clubs/new`.
3. Enter club, leader, and contact details.
4. Enter a public `https://t.me/<username>` link or a private `https://t.me/+<invite>` link.
5. Optionally enter the matching public username and a manager-only numeric chat ID.
6. Save as `Inactive draft` while reviewing, or `Active` to publish.
7. Open the active club page and select `Join via Telegram`.
8. Telegram opens the bot with the stable club key.
9. The bot reads the club from Supabase and offers the stored group link.
10. Edit the club through `/clubs/[slug]/edit`; the next bot request immediately reads the updated record.

## Security

- Public browsing is active-only and column-scoped.
- Create/edit requires existing Supabase Auth and database RLS authorization.
- Owners and existing community moderators can edit; unrelated users cannot.
- Telegram group links are normalized to HTTPS `t.me` URLs and reject credentials, ports, query strings, fragments, arbitrary schemes, and unsupported paths.
- Logo URLs are restricted to configured QAIRU/Supabase HTTPS origins; arbitrary external origins are rejected.
- Bot token and webhook secret stay in server-only modules and environment variables.
- The webhook is explicitly exempted from login middleware because Telegram cannot authenticate through QAIRU; the webhook secret is its authentication boundary.
- Bot database reads use a stateless publishable-key client, never browser cookies or service-role bypass.
- The 24-character bot key is an opaque routing identifier, not an authorization secret.
- The per-instance rate limiter is defense in depth; production-wide throttling should also be configured at the platform/firewall layer.

## Integration Points

For a university extraction, copy these independent units:

1. `src/lib/clubs/validation.ts` and the relevant form fields for the club contract.
2. `src/lib/clubs/data.ts` and `src/app/actions/clubs.ts` for authenticated Supabase writes.
3. `src/lib/telegram/` for URL/deep-link validation, webhook logic, and Bot API boundary.
4. `src/app/api/telegram/webhook/route.ts` for the deployable webhook.
5. The prototype migration, adapting `communities` to the university's canonical club table.
6. `src/components/clubs/` and `src/app/clubs/` if the UI is wanted.

The bot handler depends on injected `findClubByBotKey` and `sendMessage` functions. It can therefore be moved to another service without importing QAIRU UI code.

## Future Extensions

- Verify bot membership/admin rights and record a separate verified timestamp.
- Create/revoke invite links after explicit group-admin authorization.
- Process join requests and map Telegram accounts to university identities with a consent flow.
- Club membership synchronization.
- Announcement and event-reminder workflows.
- Moderation commands and audit logs.
- Official club verification and approval workflow.
- Durable distributed webhook rate limiting and replay/update-ID deduplication.
- Managed logo upload through a dedicated Supabase Storage bucket and policies.

## Current Prototype Limitations

- The prototype does not create Telegram groups or make the bot an administrator.
- `telegram_chat_id` is stored for future use but is not used by the basic handoff.
- “Group configured” validates stored handoff data; it is not connectivity or administrator verification.
- The in-memory rate limiter is per server instance and resets on cold start.
- No Telegram account-to-QAIRU account linking or membership synchronization exists.
- Logo upload is not implemented; only trusted hosted URLs are accepted.
- Real Telegram end-to-end testing requires a BotFather token, a test group, and a public HTTPS endpoint.
- The migration must be applied to the intended non-Production database before the new routes can read records.
