# QAIRU HUB

QAIRU HUB — платформа сообщества студентов QAIRU: профили, сообщества, проекты, события, публикации, ресурсы, личные сообщения, уведомления и каталог университетских клубов с интеграцией Telegram.

Целевой адрес продукта: [community.qairuhub.com](https://community.qairuhub.com).

## Текущий статус

Проект находится на стадии **MVP / закрытого beta-preview**. В репозитории есть два режима:

- `live` — рабочие сценарии на Supabase Auth, PostgreSQL, RLS и Realtime;
- `demo` — интерактивная демонстрация на mock-данных и `localStorage`.

По аудиту от 7 сентября 2026 года продуктовый MVP реализован примерно на **43%**. Базовые профили, сообщества, проекты, события, контент, сообщения и уведомления работают в live-режиме, но публичный запуск пока блокируют проверка статуса студента, модерация и жалобы, `/help`, завершение activation-flow и эксплуатационные проверки. Подробная матрица: [docs/product/mvp-status.md](docs/product/mvp-status.md).

Каталог клубов и Telegram-интеграция — отдельный **прототип**, а `Opportunities` и `/admin` пока не являются завершёнными live-функциями.

## Что входит в MVP

- регистрация, подтверждение пользователя и безопасный доступ;
- onboarding и профиль студента;
- поиск людей и команд, проекты, роли и заявки;
- события и связанный цикл уведомлений;
- автоматическая лента активности;
- жалобы, модерация и пользовательская страница помощи.

Сообщения, ресурсы, свободные публикации и клубы уже реализованы частично или полностью, но по текущему продуктовому документу относятся к v1 либо к отдельному прототипу. Это не повод удалять их из кода.

## Структура репозитория

```text
.
├── src/                    основной код Next.js
│   ├── app/                страницы, layouts, Server Actions и HTTP API
│   ├── components/         frontend-компоненты и UI primitives
│   ├── lib/                auth, data access, Supabase, Telegram, security
│   ├── types/              общие и сгенерированные TypeScript-типы
│   └── proxy.ts            сессии, route gates и CSP
├── supabase/               backend-схема, миграции, seed и SQL-тесты
├── docs/                   продуктовая, архитектурная и операционная документация
├── public/                 используемые публичные статические материалы
├── scripts/                служебные и проверочные скрипты
├── archive/                сохранённые, но неиспользуемые материалы
└── *.config.*, *.json      конфигурация инструментов и платформы
```

Быстрые ориентиры:

- frontend: [`src/components/`](src/components/) и страницы в [`src/app/`](src/app/);
- backend приложения: [`src/app/api/`](src/app/api/), [`src/app/actions/`](src/app/actions/) и [`src/lib/`](src/lib/);
- база данных и права доступа: [`supabase/`](supabase/);
- дизайн-система и материалы: [`docs/design/`](docs/design/), [`src/app/globals.css`](src/app/globals.css), [`src/components/ui/`](src/components/ui/) и [`public/`](public/);
- документация: [`docs/README.md`](docs/README.md);
- архив: [`archive/README.md`](archive/README.md).

## Быстрый запуск

Требования: Node.js **24.x**, npm. Для live-режима также нужны Docker Desktop и Supabase CLI.

### Demo-режим

```bash
npm ci
npm run dev
```

Откройте <http://localhost:3000>. Если `NEXT_PUBLIC_APP_MODE` не равен `live`, приложение использует demo-режим. Маршруты `/clubs` — исключение: они всегда читают реальные данные Supabase.

### Live-режим с локальным Supabase

```bash
npx supabase start
npx supabase db reset
npx supabase status
```

Скопируйте `.env.example` в `.env.local`, укажите значения из `supabase status` и установите `NEXT_PUBLIC_APP_MODE=live`. Затем запустите:

```bash
npm run dev -- -p 3010
```

Важно: origin в `NEXT_PUBLIC_SITE_URL`, `supabase/config.toml` и адрес в браузере должны совпадать. Сейчас пример окружения использует `localhost:3010`, а локальная конфигурация Supabase — `127.0.0.1:3000`; перед тестированием Auth их нужно выровнять.

Полный список переменных находится в [`.env.example`](.env.example). Секретные ключи нельзя добавлять в `NEXT_PUBLIC_*` или коммитить.

## Основные команды

```bash
npm run dev          # локальная разработка
npm test             # unit/security/prototype/Core API tests
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run build        # production build
```

SQL-регрессии находятся в `supabase/tests/database/` и запускаются только против локального или явно выбранного development-проекта.

## Технологии

- Node.js 24, Next.js 16.3 App Router, React 19.2, TypeScript 5;
- Tailwind CSS 4, shadcn configuration, Radix UI, Lucide, Sonner;
- Supabase Auth, PostgreSQL, Data API, RLS и Realtime;
- Telegram Bot API через Next.js Route Handler;
- Vercel, ESLint, Node.js test runner и pgTAP.

Точные версии зафиксированы в `package.json` и `package-lock.json`.

## Перед началом работы

1. Прочитайте [`src/README.md`](src/README.md), затем профильный документ из [`docs/README.md`](docs/README.md).
2. Не смешивайте demo- и live-реализации: режим выбирается через `src/lib/app-mode.ts`.
3. Не полагайтесь на `src/proxy.ts` как на единственную проверку доступа. Server Actions и Route Handlers обязаны проверять авторизацию самостоятельно.
4. Миграции Supabase являются последовательной историей и не переписываются после применения.
5. Core API предназначен только для server-to-server вызовов: [docs/reference/core-api.md](docs/reference/core-api.md).
6. Ограничения запуска и security-gates описаны в [`SECURITY.md`](SECURITY.md).

Локальные `.env.local`, `.next/`, `.vercel/`, `node_modules/`, `.cache/` и `.local/` не являются частью исходного кода и игнорируются Git.
