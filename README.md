# QAIRU HUB

QAIRU HUB is a university community platform built with Next.js and Supabase. The current repository is a controlled-preview implementation: core authenticated campus flows are present, while several product areas remain prototypes or partial experiences.

The source of truth for current behavior is the executable code, Supabase migrations, and tests. Start with the [current system overview](docs/current-system-overview.md) and [known limitations](docs/known-limitations.md).

## Current capabilities

- Supabase authentication, email verification, password reset, and protected routes
- Required onboarding and editable user profiles
- People discovery, follows, communities, projects, applications, events, resources, and conversations
- Public student-club directory plus authenticated club creation and management
- In-app notifications and a Telegram club deep-link/webhook prototype
- A privileged server-to-server Core API for selected resources

See the [feature inventory](docs/implemented-features.md) for exact implementation status. A listed domain does not imply that every workflow in that domain is complete.

## Technology stack

- Next.js 16.3 App Router and React 19
- TypeScript and Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, Realtime, and RPC functions
- Node's built-in test runner for application tests and pgTAP for database tests
- Vercel deployment with Speed Insights

## Runtime modes

`NEXT_PUBLIC_APP_MODE=live` enables Supabase-backed application flows. Any other value selects the demo experience, where much of the hub uses mock data and browser storage. The student-club directory is an important exception: it uses the configured public Supabase client in both modes.

## Local setup

Requirements:

- Node.js 24.x, matching `package.json`
- npm
- Docker and the Supabase CLI when running the local database stack or pgTAP tests

Install dependencies and start the demo-mode application:

```bash
npm ci
npm run dev -- -p 3010
```

Copy `.env.example` to `.env.local` and set only the values required for the mode being tested. Never commit secrets.

For a local live-mode Supabase stack:

```bash
npx supabase start
npx supabase db reset
npm run dev -- -p 3010
```

The repository currently contains an origin mismatch that must be resolved for a smooth local Auth flow: `.env.example` and the app use port `3010`, while `supabase/config.toml` still declares port `3000` Auth URLs. See [known limitations](docs/known-limitations.md).

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase key used by browser and SSR clients |
| `NEXT_PUBLIC_SITE_URL` | Canonical application origin used in redirects |
| `NEXT_PUBLIC_APP_MODE` | `live` for production data flows; other values select demo behavior |
| `CORE_API_KEY` | Long bearer token for the privileged Core API |
| `SUPABASE_SECRET_KEY` | Preferred server-only privileged Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supported legacy privileged-key fallback |
| `TELEGRAM_BOT_TOKEN` | Server-only Telegram Bot API token |
| `TELEGRAM_BOT_USERNAME` | Public bot username used to construct club deep links |
| `TELEGRAM_WEBHOOK_SECRET` | Secret verified on incoming Telegram webhook requests |

The complete behavior and safety requirements are documented in [deployment](docs/deployment.md) and [authentication and security](docs/authentication-and-security.md).

## Development commands

```bash
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

Run database tests against the local Supabase stack with:

```bash
npx supabase test db --local supabase/tests/database
```

See [testing and quality](docs/testing-and-quality.md) for test scope and current limitations.

## Project structure

```text
src/app/             App Router pages, layouts, server actions, and API handlers
src/components/      Shared shell, navigation, forms, and feature components
src/lib/             Supabase clients, queries, validation, utilities, and colocated Node tests
src/types/           Shared TypeScript types
supabase/migrations/ Forward-only database migration history
supabase/tests/      pgTAP database and RLS tests
docs/                Current implementation documentation and historical notes
```

## Documentation

- [Current system overview](docs/current-system-overview.md)
- [Implemented features](docs/implemented-features.md)
- [Architecture](docs/architecture.md)
- [Database and Supabase](docs/database-and-supabase.md)
- [Authentication and security](docs/authentication-and-security.md)
- [Routes and pages](docs/routes-and-pages.md)
- [Testing and quality](docs/testing-and-quality.md)
- [Deployment](docs/deployment.md)
- [Known limitations](docs/known-limitations.md)
- [Documentation index](docs/README.md)

## Database change policy

The reconciled September 4, 2026 migration chain in `supabase/migrations/` is the canonical baseline. Do not rename or rewrite applied migrations. Add all future schema changes as new, forward-only migrations and verify migration state before and after deployment.

## Deployment overview

`master` is the production branch. Vercel builds the Next.js application, and `vercel.json` selects the `syd1` function region. The repository contains no GitHub Actions workflow, so deployment gates and the exact GitHub-to-Vercel integration remain external configuration. Follow the [deployment checklist](docs/deployment.md) before promoting a release.
