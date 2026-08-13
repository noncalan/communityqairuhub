# QAIRU Hub

Independent student community and campus platform for QAIRU. The current implementation includes the live Supabase-backed social, content, notification, and direct-messaging flows, plus a typed demo mode.

## Local development

Copy `.env.example` to `.env.local` when connecting Supabase, then run:

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm run lint
npm run test:security
npm run build
pwsh -File scripts/verify-security-headers.ps1
```

The database migration and seed data live in `supabase/`. Without Supabase environment variables the product runs as a complete interactive demo using `lib/data/mock.ts`.

Security architecture and launch requirements are documented in [SECURITY.md](SECURITY.md). Database authorization regressions live in `supabase/tests/database/` and are designed to run transactionally against a local stack or an explicitly selected development project.
