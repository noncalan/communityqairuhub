# QAIRU HUB documentation

This directory separates current, repository-verified implementation documentation from dated audits and prototype notes. When documents conflict, the executable code, migrations, tests, and the current documents below take precedence.

## Current implementation documentation

| Document | Scope |
|---|---|
| [Current system overview](current-system-overview.md) | Product purpose, runtime modes, implementation status, and working user flows |
| [Implemented features](implemented-features.md) | Evidence-backed feature inventory with Implemented, Partial, and Not implemented statuses |
| [Architecture](architecture.md) | App Router structure, server/client boundaries, data access, APIs, and shared shell |
| [Database and Supabase](database-and-supabase.md) | Tables, relationships, views, RPCs, indexes, Realtime, and migration history |
| [Authentication and security](authentication-and-security.md) | Supabase Auth, route gates, RLS guarantees, privileged APIs, quotas, and security tests |
| [Routes and pages](routes-and-pages.md) | Complete meaningful page and API route inventory |
| [Testing and quality](testing-and-quality.md) | Node tests, pgTAP suites, commands, latest observed results, and coverage gaps |
| [Deployment](deployment.md) | `master`, Vercel, Supabase, environment configuration, and release checklists |
| [Known limitations](known-limitations.md) | Incomplete flows, prototype behavior, technical debt, and unverifiable external state |

## Supporting references

- [Core API reference](reference/core-api.md) — server-to-server endpoint contract.
- [Security policy](../SECURITY.md) — launch controls and repository security guidance.
- [Navigation performance](architecture/navigation-performance.md) — focused navigation-loading design note.
- [Preview testing](operations/preview-testing.md) — manual protected-preview checklist.
- [Community and Team Finder state](community-current-state.md) — focused implementation note.
- [University clubs prototype](prototypes/university-clubs-telegram.md) — prototype-specific setup and scope.
- [Design documentation](design/README.md) — design-system and visual materials index.

## Historical material

Files under `audits/` are dated evidence snapshots, not guaranteed current specifications. Files under `prototypes/` may describe experimental or incomplete subsystems. `product/mvp-status.md` is also a dated snapshot and is retained for history; use the current feature inventory for present status.
