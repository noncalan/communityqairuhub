# Database and Supabase

## Repository source of truth

The committed Supabase definition is under `supabase/`:

- `supabase/migrations/`: ordered schema, policy, grant, function, trigger, and Realtime changes;
- `supabase/seed.sql`: reference values and local development fixtures;
- `supabase/tests/database/`: rollback-only pgTAP authorization/regression suites;
- `supabase/config.toml`: local PostgreSQL 17, Data API, Auth, Realtime, Studio, and mail-catcher settings;
- `src/types/database.ts`: generated TypeScript representation of the current public schema.

The migration files, rather than the generated TypeScript types, are authoritative for security behavior.

## Canonical migration history

The **September 4, 2026 chain is the canonical baseline**. Commit `1ddd6bf` reconciled the older filenames with the hosted migration history by renaming the baseline to the following ordered chain:

| Migration | Purpose |
| --- | --- |
| `20260904170311_initial_qairu_hub.sql` | Profile/reference schema, base RLS, grants, and updated-at trigger. |
| `20260904170318_phase_2a_permissions.sql` | Explicit Phase 2A table/function privileges. |
| `20260904170324_phase_2b1_social_core.sql` | Follows, communities, projects/roles/applications, events, RLS, triggers, and project RPC. |
| `20260904170329_phase_2b1_advisor_fixes.sql` | Supporting indexes and consolidated application update policy. |
| `20260904170335_phase_2b2_content_activity.sql` | Posts/comments/reactions, resources/saves, views, policies, and grants. |
| `20260904170341_phase_2b2_advisor_fixes.sql` | Post-like supporting index. |
| `20260904170348_phase_2c_realtime_messaging_notifications.sql` | Direct conversations, messages, notifications, RPCs, triggers, and Realtime publication entries. |
| `20260904170354_phase_2c_advisor_fixes.sql` | Conversation index and helper update. |
| `20260904170359_phase_2c_message_api.sql` | Public authenticated `send_message` RPC. |
| `20260904170405_phase_3_security_hardening.sql` | Column-level grants, private save counts, validation constraints, database write quotas, hardened RPCs, and view updates. |
| `20260904170414_phase_3_advisor_fixes.sql` | Security-definer function search-path hardening. |
| `20260904170420_university_clubs_telegram_prototype.sql` | Club fields, Telegram tables, public view, policies, and transactional club RPCs. |

Later forward migrations are:

| Migration | Purpose |
| --- | --- |
| `20260908092242_allow_core_service_ownership.sql` | Allows the trusted service role to create community/project owner memberships while preserving normal authenticated ownership checks. |
| `20260908174950_first_year_onboarding_profile.sql` | Adds first-year direction/role/contribution fields, matching index and taxonomy, and the atomic onboarding RPC. |

Do not rename, edit, squash, or replay the canonical baseline after it has been applied. Every future schema change must be a new, forward-only migration. Before applying remote changes, compare local/remote history, review the dry run, back up as appropriate, and deploy only the unapplied suffix.

A read-only `npx supabase migration list --linked` check on 2026-09-09 confirmed that the linked project's remote history exactly matches all 14 committed migrations through `20260908174950_first_year_onboarding_profile.sql`. The local pgTAP suites were not executed because Docker Desktop was not running.

## Schema inventory

There are 31 declared tables in the exposed `public` schema and one internal quota table in `app_private`.

| Domain | Tables | Relationships and use |
| --- | --- | --- |
| Profiles and reference data | `profiles`, `programs`, `interests`, `skills`, `profile_interests`, `profile_skills`, `user_roles` | `profiles.id` is also `auth.users.id`. Program is optional; interests/skills are many-to-many. Roles are separate and owner-readable only. |
| Social graph and communities | `follows`, `communities`, `community_members` | Follows connect profiles. Communities belong to a creator and gain an automatic owner membership. Membership roles are `owner`, `moderator`, or `member`. |
| Projects | `projects`, `project_technologies`, `project_roles`, `project_members`, `project_applications`, `project_saves` | Projects belong to a creator. Technologies and roles are children. Applications reference both project and role; accepted applications create membership. Saves are profile-private. |
| Events | `events`, `event_attendees`, `event_saves` | Events belong to an organizer. Attendance is unique per event/profile; saves are profile-private. |
| Content and resources | `posts`, `comments`, `post_likes`, `post_bookmarks`, `resources`, `resource_saves` | Posts optionally belong to a community. Comments/reactions reference posts. Resources currently require an external URL because storage paths are constrained to null. |
| Messaging and notifications | `conversations`, `conversation_members`, `messages`, `notifications` | Direct conversations store the normalized pair of profile IDs and exactly two membership rows. Messages derive sender/recipient. Notifications are recipient-owned and actor-attributed when applicable. |
| Clubs and Telegram | `club_telegram_integrations`, `club_telegram_connections` plus `communities` | Public group URL/username is separated from manager-only Telegram chat ID. A stable random `communities.telegram_bot_key` routes deep links. |
| Internal abuse control | `app_private.write_rate_limits` | Fixed-window per-user action counters. No anon/authenticated table privileges; deny policy adds defense in depth. |

## Onboarding model

`profiles` retains the original program/skill fields and adds:

- `academic_direction`: `machine_learning` or `physical_ai`;
- `desired_role`: one of the migration-defined roles compatible with the direction, or `still_exploring`;
- `contribution_preferences`: a unique array of up to five migration-defined values.

`complete_my_onboarding(...)` requires 1–5 unique allowed project interests and 1–5 unique contribution preferences. It upserts the current user's profile, derives `academic_year = 1`, makes the profile campus-visible and available for collaboration/projects, sets `onboarding_completed`, replaces the profile's interests, and returns the saved row in one transaction.

`save_my_profile(...)` remains the settings/profile-edit RPC for the original profile fields and interest/skill relations. The settings UI does not currently edit the new direction, desired role, or contribution preferences.

## Communities and clubs

`communities` is the shared canonical entity for both generic communities and student clubs. Generic community actions populate the original fields. Club actions additionally populate `short_description`, `logo_url`, `leader_name`, `contact`, and the opaque `telegram_bot_key`, with related Telegram rows.

`public_clubs` is a `security_invoker` view over active communities and public Telegram integration data. It excludes `creator_id` and `telegram_chat_id`, but intentionally exposes the opaque bot key needed for deep links. Anonymous users have only the explicit underlying columns/policies needed by this view.

`create_university_club(...)` and `update_university_club(...)` are authenticated `SECURITY INVOKER` RPCs. Club and Telegram changes succeed or fail atomically under the caller's RLS permissions.

## Projects and applications

`create_project(...)` creates the parent, technologies, and required open roles atomically. The owner-membership trigger inserts the creator as `Owner` with edit permission. The RPC and Server Action cap technology/role arrays.

Important invariants:

- only one pending application per project/applicant (`project_applications_one_pending_idx`);
- an application role must belong to the same project;
- RLS prevents applications to closed roles and prevents owners/members from applying;
- applicant and project creator are the only readers;
- applicants may withdraw pending applications at the database level, while creators accept/reject;
- accepting a pending application inserts project membership through a trigger.

The current UI supports apply and owner accept/reject, but does not expose withdrawal or project/role editing.

## Events and notifications

Event attendance uses a locking capacity trigger to prevent overbooking, and another trigger prevents an organizer from lowering capacity below current attendance. Attendance and save rows are user-owned.

Notification triggers create or deduplicate these enum types:

- `new_follower`;
- `post_comment`;
- `post_like`;
- `project_application`;
- `project_application_accepted`;
- `project_application_rejected`.

Authenticated clients can read only their notification rows and update only `read_at`. Inserts are trigger-owned rather than client-granted.

## Views

All three public views use `security_invoker = true`, so underlying RLS remains effective:

| View | Purpose |
| --- | --- |
| `post_feed_items` | Post author/community projection plus like/comment counts and current-user liked/bookmarked state. |
| `resource_items` | Resource author projection, aggregate save count, and current-user saved state without exposing other savers. |
| `public_clubs` | Anonymous-safe active club and public Telegram handoff projection. |

## Public RPC surface

| Function | Caller/purpose |
| --- | --- |
| `complete_my_onboarding` | Authenticated atomic first-year onboarding. |
| `save_my_profile` | Authenticated atomic profile/reference update. |
| `create_project` | Authenticated atomic project/technology/role creation. |
| `get_or_create_direct_conversation` | Authenticated idempotent one-to-one conversation creation. |
| `list_my_conversations` | Authenticated participant-scoped conversation summary and unread counts. |
| `send_message` | Authenticated message creation with sender/recipient derived from membership. |
| `mark_conversation_read` | Authenticated update of the caller's read timestamp. |
| `get_my_unread_message_count` | Authenticated unread aggregate. |
| `create_university_club`, `update_university_club` | Authenticated atomic organizer workflow. |

`set_updated_at` is a trigger helper with client execution revoked. Additional `app_private` functions implement trigger effects, private aggregates, quotas, notification fanout, and conversation internals with explicit ACLs and empty `search_path` declarations.

## Important indexes

- Profile discovery: `profiles_program_idx`, partial `profiles_completed_idx`, `profiles_matching_idx`, and inverse interest/skill indexes.
- Community/project/event discovery: status/creation and start-time indexes plus creator/organizer foreign-key indexes.
- Applications: owner queue, applicant history, role/project lookup, and the partial unique pending-application index.
- Content/resources: author/community/created-at indexes, comment lookup, bookmarks/likes/saves support.
- Messaging/notifications: normalized direct-user pair, conversation message chronology, sender/recipient, recipient chronology, unread partial index, and actor index.

The complete index definitions are in the migrations. Dated performance-advisor notes reported only unused-index notices on a low-data schema; that observation has not been revalidated against the hosted project.

## Realtime

The migration chain adds exactly `conversation_members`, `messages`, and `notifications` to `supabase_realtime`. RLS still filters subscription visibility. No other product table is published by the committed migrations.
