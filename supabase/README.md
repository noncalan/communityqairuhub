# Supabase backend

Эта папка — источник истины для структуры PostgreSQL и database-level авторизации QAIRU HUB.

- `migrations/` — последовательные forward-only изменения схемы, grants, RLS, RPC и Realtime;
- `seed.sql` — справочники и условные demo fixtures для локальной разработки;
- `tests/database/` — транзакционные pgTAP security/regression tests;
- `config.toml` — локальные сервисы, порты и Auth redirect configuration.

Локальный reset применяет миграции по имени файла, затем seed:

```bash
npx supabase start
npx supabase db reset
npx supabase status
```

Не редактируйте уже применённые миграции для исправления production-схемы — добавляйте новую миграцию. Перед Auth-тестами выровняйте `site_url`/`additional_redirect_urls` в `config.toml` с `NEXT_PUBLIC_SITE_URL` и реальным адресом Next.js.

Папки `.branches/` и `.temp/` создаются Supabase CLI локально, игнорируются Git и не являются исходным кодом.
