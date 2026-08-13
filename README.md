# QAIRU Hub

Independent student community and campus platform for QAIRU. The current implementation includes the production-ready Phase 1 interface, typed demo data, and a Supabase-ready relational schema with RLS.

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
npm run build
```

The database migration and seed data live in `supabase/`. Without Supabase environment variables the product runs as a complete interactive demo using `lib/data/mock.ts`.
