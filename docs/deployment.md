# Deployment

## Repository and branch model

- Git remote: `https://github.com/nurdauletbeisenbek7-web/qairu-hub.git`.
- Current and production branch: `master`.
- No `.github/workflows/` CI/CD definition is present. Any automatic GitHub-to-Vercel deployment is configured outside this repository and cannot be proven from source.
- Keep feature work in reviewed branches/PRs where possible, then merge to `master` only after application and migration checks pass.

## Vercel configuration

`vercel.json` is intentionally small and selects `syd1`. `package.json` pins the runtime engine to Node.js 24.x. Next.js supplies the build/start behavior.

The ignored local `.vercel/project.json` currently points to a Vercel project named `university-clubs-prototype`. Because `.vercel/` is not committed, other checkouts and the production Git integration may be linked differently. Confirm the target team/project before any CLI deployment.

Vercel Speed Insights is integrated globally. The Vercel Analytics dependency is installed but no Analytics component is currently rendered.

## Supabase relationship

The local Supabase CLI reports a linked project named `QAIRU HUB University Clubs Prototype`. The database migration history in `supabase/migrations/` is the version-controlled source of truth. The September 4 chain is the reconciled canonical baseline, followed by the Core ownership and first-year onboarding migrations.

On 2026-09-09, `npx supabase migration list --linked` confirmed an exact local/remote match for all 14 committed migrations through the onboarding migration. This is a dated verification, not a substitute for checking again immediately before deployment.

Vercel and Supabase should use compatible regions; the repository selects Vercel `syd1`, while a dated architecture document records Supabase in `ap-southeast-2`. Confirm the hosted Supabase region in the dashboard because it is not encoded in `supabase/config.toml`.

## Environment variables

Use `.env.example` as the name inventory. Do not commit `.env.local` or copy secret values into documentation.

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-visible | Supabase project API origin. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-visible | Publishable Data API/Auth key; authorization still relies on RLS. |
| `NEXT_PUBLIC_SITE_URL` | Browser-visible | Exact trusted application origin used for metadata and Auth redirects. HTTPS is required outside localhost. |
| `NEXT_PUBLIC_APP_MODE` | Browser-visible | Exactly `live` enables live Auth/data route behavior; otherwise demo mode. |
| `CORE_API_KEY` | Server-only secret | Bearer credential for `/api/core/**`; at least 32 characters, preferably 256 bits of entropy. |
| `SUPABASE_SECRET_KEY` | Server-only secret | Privileged Supabase client for the Core API. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only legacy fallback | Used only when `SUPABASE_SECRET_KEY` is absent. |
| `TELEGRAM_BOT_TOKEN` | Server-only secret | Bot API credential used by the webhook. |
| `TELEGRAM_BOT_USERNAME` | Server-read public identifier | Builds club deep links; invalid/missing value disables the bot handoff button. |
| `TELEGRAM_WEBHOOK_SECRET` | Server-only secret | Authenticates Telegram webhook requests. |

Never put Core, Supabase secret/service-role, Telegram token, or webhook secret values in a `NEXT_PUBLIC_*` variable.

## Local setup

Demo mode:

```bash
npm ci
npm run dev -- -p 3010
```

Live mode with local Supabase requires Docker Desktop and the Supabase CLI:

```bash
npx supabase start
npx supabase db reset
npx supabase status
npm run dev -- -p 3010
```

Copy `.env.example` to `.env.local` and use the local API URL/publishable key. Set `NEXT_PUBLIC_APP_MODE=live`. At present `supabase/config.toml` uses `127.0.0.1:3000` for Auth while `.env.example` and application documentation use `localhost:3010`; align the site URL, allowed redirects, `NEXT_PUBLIC_SITE_URL`, and actual dev URL before testing Auth.

## Pre-deployment checklist

1. Confirm the checked-out branch/commit and ensure `git status` contains only intended changes.
2. Confirm the Vercel project/team, Supabase project, and environment (Preview vs Production) before changing external state.
3. Review `.env.example`; configure all required public values and only the server features that will be enabled.
4. Validate `NEXT_PUBLIC_SITE_URL` as the exact deployed HTTPS origin and configure matching Supabase Auth Site URL/callback allowlists.
5. Run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
6. With local Supabase available, run `npx supabase db reset` and `npx supabase test db --local supabase/tests/database`.
7. Compare migration history with `npx supabase migration list --linked`.
8. Preview database changes with `npx supabase db push --linked --dry-run`. It must show only new forward migrations after the canonical chain.
9. Back up according to the environment's operational policy. Apply migrations before code that depends on them, using the approved deployment window/process.
10. Deploy a Vercel Preview and execute the protected-preview checklist in `docs/operations/preview-testing.md`.
11. Merge/promote `master` only after Preview verification. The exact promotion mechanism is external to this repository.

Do not use `--include-all` to force a mismatched migration history without understanding and reconciling the difference. Do not seed production with `supabase/seed.sql`.

## Post-deployment verification

- Load `/`, `/clubs`, and one known active club anonymously.
- Test signup confirmation and password recovery with a real mailbox in the target environment.
- Test login, onboarding, profile visibility, Team Finder, application acceptance, event attendance, resource creation, and logout.
- Use two independent browsers/accounts for direct messages, unread/read state, notifications, reconnect, and account-switch isolation.
- Confirm unauthorized users cannot open Hub routes, club management, or `/admin`.
- Probe `/api/core/**` with missing/invalid credentials and then a controlled valid request; verify no secret or private field appears.
- Confirm Telegram webhook secret rejection and one valid club deep-link flow if the bot is enabled.
- Run `scripts/verify-security-headers.ps1` or equivalent against a production build and inspect CSP/nonces/security headers.
- Review Vercel runtime errors/timings, Supabase Auth/database/Realtime logs, and advisor results.

## Rollback and migration safety

Application rollback is a Vercel/Git operation configured outside the repository. Database migrations are forward-only: do not rewrite or delete applied files to roll back. If a schema change is faulty, create a corrective migration that preserves data and remains compatible with any still-running application version. Coordinate code and schema order so both the old and new deployment can tolerate the transition where practical.
