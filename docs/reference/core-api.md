# QairuHub Core API

The Core API is a privileged, server-to-server JSON API. Do not call it from browser code or distribute its credentials to end users.

## Base URL

Production:

```text
https://qairu-hub.vercel.app/api/core
```

Local development when following the checked-in `.env.example` port:

```text
http://localhost:3010/api/core
```

## Authentication and configuration

Every supported endpoint requires this header:

```http
Authorization: Bearer <CORE_API_KEY>
```

Configure these values only as server-side environment variables in local development and Vercel:

```dotenv
CORE_API_KEY=<at-least-32-random-characters>
SUPABASE_SECRET_KEY=<server-only-supabase-secret-key>
```

`SUPABASE_SERVICE_ROLE_KEY` is accepted as a legacy fallback. Neither Supabase server key may use a `NEXT_PUBLIC_` prefix or be sent to a browser. Generate a Core key with at least 256 bits of entropy, store it in a secret manager, and rotate it if exposure is suspected.

The API returns `401` for a missing or invalid Bearer token and `503` when required server configuration is absent. Successful and error responses include `Cache-Control: private, no-store`.

## Conventions

- Requests and responses use the database's `snake_case` field names.
- IDs are UUIDs.
- List endpoints accept `limit` (default `50`, maximum `100`) and `offset` (default `0`, maximum `10000`).
- `POST` returns `201 Created` and a `Location` header.
- `PATCH` is partial, but must contain at least one editable field.
- Unknown, immutable, and server-managed fields are rejected.
- `DELETE` is intentionally not implemented.
- Error shape:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Request body validation failed.",
    "details": {
      "title": "Field is required."
    }
  }
}
```

Common statuses are `200`, `201`, `400`, `401`, `403`, `404`, `409`, `413`, `415`, `422`, `500`, and `503`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/users` | List profiles |
| `POST` | `/users` | Create a profile for an existing Supabase Auth user |
| `GET` | `/users/{id}` | Get a profile by UUID |
| `PATCH` | `/users/{id}` | Update an editable profile field |
| `GET` | `/events` | List events |
| `POST` | `/events` | Create an event |
| `GET` | `/events/{id}` | Get an event by UUID |
| `PATCH` | `/events/{id}` | Update an editable event field |
| `GET` | `/communities` | List communities |
| `POST` | `/communities` | Create a community and its owner membership |
| `GET` | `/communities/{id}` | Get a community by UUID |
| `PATCH` | `/communities/{id}` | Update an editable community field |
| `GET` | `/projects` | List projects |
| `POST` | `/projects` | Create a project and its owner membership |
| `GET` | `/projects/{id}` | Get a project by UUID |
| `PATCH` | `/projects/{id}` | Update an editable project field |

The `/users` resource maps to `public.profiles`; it does not create or modify `auth.users`, passwords, identities, sessions, or the existing login flow. A profile `id` supplied to `POST /users` must already exist in `auth.users` or the API returns `422 invalid_reference`.

### Users

Create fields:

- Required: `id`, `username`, `full_name`, `academic_year`
- Optional: `bio`, `avatar_url`, `program_id`, `available_for_projects`, `open_to_collaboration`, `profile_visibility`, `onboarding_completed`
- Editable with `PATCH`: every optional/create field except `id`

Create request:

```json
{
  "id": "951a1a1b-c173-4b21-8ee7-3700899addb7",
  "username": "aisha_k",
  "full_name": "Aisha Karim",
  "academic_year": 2,
  "bio": "Product designer and student builder.",
  "profile_visibility": "campus",
  "onboarding_completed": true
}
```

Response:

```json
{
  "data": {
    "id": "951a1a1b-c173-4b21-8ee7-3700899addb7",
    "username": "aisha_k",
    "full_name": "Aisha Karim",
    "bio": "Product designer and student builder.",
    "avatar_url": null,
    "program_id": null,
    "academic_year": 2,
    "available_for_projects": false,
    "open_to_collaboration": true,
    "profile_visibility": "campus",
    "onboarding_completed": true,
    "created_at": "2026-09-08T09:00:00.000Z",
    "updated_at": "2026-09-08T09:00:00.000Z"
  }
}
```

```bash
curl --request POST "$BASE_URL/users" \
  --header "Authorization: Bearer $CORE_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{"id":"951a1a1b-c173-4b21-8ee7-3700899addb7","username":"aisha_k","full_name":"Aisha Karim","academic_year":2}'
```

### Events

Create fields:

- Required: `slug`, `title`, `description`, `category`, `starts_at`, `ends_at`, `location`, `capacity`, `organizer_id`
- Optional: `id`
- Editable with `PATCH`: `slug`, `title`, `description`, `category`, `starts_at`, `ends_at`, `location`, `capacity`

`starts_at` and `ends_at` must be ISO 8601 timestamps with timezones, `ends_at` must be later than `starts_at`, and `capacity` must be from `1` through `10000`.

```json
{
  "slug": "ai-build-night",
  "title": "AI Build Night",
  "description": "An evening for shipping useful campus AI tools.",
  "category": "Workshop",
  "starts_at": "2026-10-01T17:00:00+05:00",
  "ends_at": "2026-10-01T20:00:00+05:00",
  "location": "Innovation Lab",
  "capacity": 80,
  "organizer_id": "951a1a1b-c173-4b21-8ee7-3700899addb7"
}
```

```bash
curl --request POST "$BASE_URL/events" \
  --header "Authorization: Bearer $CORE_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{"slug":"ai-build-night","title":"AI Build Night","description":"An evening for shipping useful campus AI tools.","category":"Workshop","starts_at":"2026-10-01T17:00:00+05:00","ends_at":"2026-10-01T20:00:00+05:00","location":"Innovation Lab","capacity":80,"organizer_id":"951a1a1b-c173-4b21-8ee7-3700899addb7"}'
```

### Communities

Create fields:

- Required: `slug`, `name`, `category`, `description`, `creator_id`
- Optional: `id`, `short_description`, `logo_url`, `leader_name`, `contact`, `status` (`forming` or `active`)
- Editable with `PATCH`: all descriptive fields and `status`; `creator_id` is immutable

The private `telegram_bot_key` column is never accepted or returned by this API.

```json
{
  "slug": "robotics-club",
  "name": "Robotics Club",
  "category": "Technology",
  "description": "Students building and testing practical robotics projects.",
  "short_description": "Build practical robots with other students.",
  "status": "forming",
  "creator_id": "951a1a1b-c173-4b21-8ee7-3700899addb7"
}
```

```bash
curl --request POST "$BASE_URL/communities" \
  --header "Authorization: Bearer $CORE_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{"slug":"robotics-club","name":"Robotics Club","category":"Technology","description":"Students building and testing practical robotics projects.","creator_id":"951a1a1b-c173-4b21-8ee7-3700899addb7"}'
```

### Projects

Create fields:

- Required: `slug`, `name`, `tagline`, `description`, `category`, `creator_id`
- Optional: `id`, `status` (`idea`, `building`, `launched`, or `completed`)
- Editable with `PATCH`: `slug`, `name`, `tagline`, `description`, `category`, `status`; `creator_id` is immutable

```json
{
  "slug": "campus-navigator",
  "name": "Campus Navigator",
  "tagline": "Find any campus service in seconds.",
  "description": "A searchable map and directory for students and visitors.",
  "category": "Productivity",
  "status": "building",
  "creator_id": "951a1a1b-c173-4b21-8ee7-3700899addb7"
}
```

```bash
curl --request POST "$BASE_URL/projects" \
  --header "Authorization: Bearer $CORE_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{"slug":"campus-navigator","name":"Campus Navigator","tagline":"Find any campus service in seconds.","description":"A searchable map and directory for students and visitors.","category":"Productivity","status":"building","creator_id":"951a1a1b-c173-4b21-8ee7-3700899addb7"}'
```

## Read and update examples

List response:

```json
{
  "data": [],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 0
  }
}
```

```bash
export BASE_URL="https://<your-qairuhub-domain>/api/core"

curl "$BASE_URL/users?limit=25&offset=0" \
  --header "Authorization: Bearer $CORE_API_KEY"

curl "$BASE_URL/events/30000000-0000-4000-8000-000000000001" \
  --header "Authorization: Bearer $CORE_API_KEY"

curl --request PATCH "$BASE_URL/communities/40000000-0000-4000-8000-000000000001" \
  --header "Authorization: Bearer $CORE_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{"status":"active"}'

curl --request PATCH "$BASE_URL/projects/50000000-0000-4000-8000-000000000001" \
  --header "Authorization: Bearer $CORE_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{"status":"launched"}'
```

Successful `GET /{resource}/{id}` and `PATCH /{resource}/{id}` calls return:

```json
{
  "data": {
    "id": "50000000-0000-4000-8000-000000000001"
  }
}
```
