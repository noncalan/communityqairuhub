# QAIRU Hub — MVP status

Дата аудита: 2026-09-07  
Источник требований: `community-product-spec.md`, разделы 6, 7.1 и 7.2.  
Источник истины по реализации: routes, components, actions, data layer и Supabase migrations; README в оценку не засчитывался.

> Примечание по репозиторию: файл `community-product-spec.md`, использованный как источник требований для этого аудита, сейчас отсутствует. До его восстановления этот документ является снимком оценки, но не заменяет исходную продуктовую спецификацию.

## MVP summary

Overall: **~43%**

Расчёт: простое среднее по 10 MVP-блокам ниже; при сомнении выбран меньший статус.

| Block | Status | What exists | Main gap |
|---|---:|---|---|
| Auth + student verification | 50% | Email/password, confirmation screen and callback, recovery, logout, SSR session gates: `src/components/auth/auth-form.tsx`, `src/lib/auth/service.ts`, `src/app/auth/*`, `src/proxy.ts`. | Нет проверки университетского домена/статуса verified student и ограниченного режима; нет привязки Telegram/GitHub; нет logout со всех устройств. |
| Onboarding | 50% | Рабочий **5-step** flow, справочники skills/interests/programs и атомарное сохранение профиля: `/onboarding`, `src/components/auth/onboarding-flow.tsx`, `completeOnboardingAction`, `save_my_profile`. | Spec требует 3 шага; нет hours/week, `/onboarding/next` с первым действием и 7-day follow-up/list «новички без задачи». |
| Profiles / people directory | 75% | Live profile и каталог: `/people`, `/u/[username]`, `profiles`, `profile_skills`, `profile_interests`; поиск и filters по program/skill/interest; availability, collaboration и `campus/private`. | Нет hours/week, languages и GitHub/Telegram/portfolio links; нет автоматической истории projects/events/badges; фильтры и privacy-модель уже, чем в spec. |
| Team finder | 75% | Открытые роли, application с сообщением, accept/reject владельцем и автоматическое добавление в team: `project_roles`, `project_applications`, `project_members`, `applyToProjectAction`, `reviewProjectApplicationAction`. | Нет отдельного `/find` и двух сторон «ищу людей/проект»; у роли нет skill/hours/deadline/experience; нет причины отказа, рекомендаций и one-off help. |
| Projects / roles / applications | 50% | Создание проекта со status, stack, roles; detail, team, applications и saves: `/projects`, `/projects/[slug]`, `LiveProjectDialog`, `LiveProjectDetail`, `create_project` RPC. | `/projects*` закрыты auth вместо public showcase; нет repository URL, semester goal/definition of done; нет project updates/demo application/status history и нужных spec-статусов. |
| Events | 50% | Создание, start/end, location, capacity, attend/cancel и saves; capacity защищена DB trigger: `/events*`, `events`, `event_attendees`, `setEventAttendanceAction`. | Нет waitlist, reminders Telegram/email и отдельного check-in; нет preparation/AI Friday slots/post-event results; страницы закрыты auth, хотя MVP-витрина должна быть public. |
| Notifications + Telegram linking | 50% | In-app notification inbox, unread/read-all, Realtime; DB triggers для follow, post like/comment, project application/review. Есть отдельный club-to-Telegram deep-link bot. | Нет связи Telegram account ↔ profile и персональной доставки; нет event reminders/team invites/badges; нет channel preferences и быстрых Telegram actions. Club handoff не является account linking. |
| Automatic activity timeline | 25% | `/home` показывает latest projects/upcoming events и authored posts; есть `posts`, `post_feed_items`, comments/likes/bookmarks. | Нет автоматических timeline entries из project creation/status/team/event actions, нет `Update` entity; реализована свободная social feed, которую spec переносит после MVP. |
| Moderation / reports | 0% | Есть security foundation: RLS, narrow grants, DB write quotas, profile privacy и server-side admin role gate. | Нет `reports` table/action/button; нет moderation queue, hide/warn/block и decision log; `/admin` — явный placeholder, user blocking/account deletion отсутствуют. |
| `/help` | 0% | В репозитории есть внутренние `SECURITY.md` и audit docs. | Route `/help` отсутствует; нет пользовательской страницы правил, инструкции по жалобам, контактов и краткого текста о данных. |

## Critical gaps for MVP

1. **Trust boundary не соответствует продукту:** любой корректный email может зарегистрироваться; нет university-domain verification, verified-student state, ограниченного режима и Telegram identity link.
2. **Activation loop неполный:** onboarding не заканчивается персональным первым действием; `/find` не оформлен как двухсторонний finder; projects/events не имеют публичной MVP-витрины; activity timeline не генерируется автоматически.
3. **Нет launch-safety и event follow-through:** reports/moderation и `/help` отсутствуют, а события не имеют waitlist, reminders и фактического check-in.

## Already stronger than spec

- RLS, column grants, transactional RPCs, DB-level quotas, CSP nonce и redirect hardening заметно глубже минимального MVP security baseline.
- One-to-one messages уже имеют историю, pagination, unread state и Supabase Realtime, хотя messages стоят в v1.
- Resources уже работают в live mode с внешними URL, поиском, category filter, author attribution и private saves, хотя это v1.
- Свободные posts/comments/likes/bookmarks уже реализованы, хотя MVP просит сначала automatic timeline, а свободные посты переносит в v1.
- Clubs используют real-data public view и атомарный organizer workflow с Telegram group handoff; это больше обычной статической v1-витрины клубов.

## Implemented outside the new MVP

Эти функции уже есть в коде, но новый spec убрал их из MVP или перенёс дальше; удалять их не нужно:

- **v1:** direct messages (`/messages`) и Realtime unread state.
- **v1:** resources (`/resources`, external links and saves).
- **v1:** public clubs directory, club create/edit и Telegram group handoff (`/clubs*`).
- **v1 по разделу 6.9:** свободные posts, comments, likes и bookmarks.
- **Не перечислено в 7.1/7.2:** follows/social graph и generic community create/join/feed.
- **Не является блоком нового MVP/v1:** `/opportunities`; в demo есть illustrative UI, в live mode это placeholder.

## v1 snapshot

- **Directions + clubs — 50%:** generic communities, public clubs catalog, create/edit и Telegram handoff есть; нет `Unit`, лид/цель/charter checks, sunset lifecycle и связи unit → mini-projects/events.
- **Public `/stats` — 0%:** route и автоматические семь метрик отсутствуют.
- **Messages — 75%:** direct conversations, history, pagination, Realtime и unread готовы; нет запрета сообщений от незнакомых в live privacy model.
- **Learning / skill exchange — 0%:** отдельного `/learn`, mentor/exchange requests и AI Friday teaching slots нет.
- **Resources — 75%:** почти весь v1 flow готов; нет срока действия/deadline и процесса очистки устаревших ссылок.
- **Wall of Fame / badges — 0%:** нет routes, tables и award rules.
- **Global search — 25%:** live command palette ведёт только в разделы; entity search работает отдельно внутри directories, единого `/search` нет.
- **`/ladder` + `/join` — 0%:** routes и membership-level model отсутствуют.
- **Operational panel — 25%:** `/admin` проверяет DB role, но показывает placeholder; дочерних admin routes нет.
- **Kazakh language — 0%:** i18n и language field отсутствуют; responsive UI, dark theme и focus states уже есть.

## Highest-leverage tasks

1. Ввести verified-student state: allowlist университетского email-домена, confirmation-derived status и permission gates для unverified users.
2. Завершить activation path: сократить onboarding до spec-flow, добавить hours/week и `/onboarding/next` с event/project/people suggestions и 7-day follow-up.
3. Довести team/project core: `/find`, structured role fields, reject reason, repository + semester goal, public project pages и automatic project/activity timeline.
4. Закрыть event/notification loop: waitlist, reminders, check-in, Telegram account linking, channel preferences и Telegram quick actions.
5. До открытия доступа добавить reports schema/UI, moderation queue/actions/audit log и `/help` с правилами, контактами и privacy summary.

## Audit boundaries

- Demo-only behavior не засчитывался как working live MVP, если за ним нет live route/data/action.
- Telegram club handoff оценивался отдельно от требуемой привязки Telegram-аккаунта студента.
- Наличие таблицы/компонента не считалось завершённой фичей без пользовательского end-to-end flow.
- Runtime, hosted Supabase settings и Telegram E2E в этом аудите не проверялись; вывод основан на текущем repository state.
