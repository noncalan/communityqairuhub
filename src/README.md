# Код приложения

`src/` содержит весь исполняемый код QAIRU HUB. Next.js распознаёт `src/app` как App Router, а `src/proxy.ts` — как Proxy этой же версии Next.js.

## Где что находится

| Путь | Назначение | Статус |
| --- | --- | --- |
| `app/(auth)/` | регистрация, вход, recovery и подтверждение email | live + demo presentation |
| `app/(hub)/` | основной закрытый интерфейс сообщества | live и demo |
| `app/clubs/` | публичный каталог и управление клубами | прототип на реальных данных |
| `app/actions/` | авторизованные server-side mutations | используется |
| `app/api/core/` | защищённый server-to-server Core API | используется |
| `app/api/telegram/` | Telegram webhook | прототип |
| `components/ui/` | переиспользуемые UI primitives | используется |
| `components/demo/` | только demo-экраны и диалоги | демонстрация, не live backend |
| `components/*` | функциональные frontend-компоненты | используется |
| `lib/data/` | live-запросы и модели доменов | используется |
| `lib/demo/` | mock/localStorage состояние | только demo |
| `lib/auth/`, `lib/security/` | auth и границы доверия | используется |
| `lib/supabase/` | browser/server/proxy клиенты | используется |
| `lib/core-api/` | Core API validation, handlers и data access | используется |
| `lib/telegram/` | Telegram Bot API и webhook logic | прототип |
| `types/` | общие типы и схема Supabase | используется |

Route groups `(auth)` и `(hub)` организуют layouts, но не добавляют сегмент в URL. Файлы `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx` и `not-found.tsx` имеют специальное значение для App Router.

Импорты `@/...` разрешаются относительно `src/`. После перемещения или переименования модулей обязательно запускайте `npm run typecheck`, `npm run lint` и `npm run build`.
