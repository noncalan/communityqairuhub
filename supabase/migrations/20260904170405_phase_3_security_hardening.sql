-- Phase 3: reduce the Data API write surface, close privacy gaps, and add
-- low-complexity abuse controls at the database boundary.

-- Resource saves are bookmarks. Saver identities are private, while an
-- aggregate count remains available to authenticated users.
drop policy if exists "Authenticated users read resource saves"
  on public.resource_saves;
create policy "Users read own resource saves"
on public.resource_saves for select to authenticated
using (user_id = (select auth.uid()));

create function app_private.resource_save_count(target_resource_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then 0::bigint
    else (
      select count(*)
      from public.resource_saves
      where resource_id = target_resource_id
    )
  end;
$$;

revoke all on function app_private.resource_save_count(uuid)
  from public, anon, authenticated;
grant execute on function app_private.resource_save_count(uuid)
  to authenticated;

create or replace view public.resource_items
with (security_invoker = true)
as
select
  resources.id,
  resources.author_id,
  profiles.username as author_username,
  profiles.full_name as author_full_name,
  profiles.avatar_url as author_avatar_url,
  resources.title,
  resources.description,
  resources.type,
  resources.category,
  resources.tags,
  resources.external_url,
  resources.storage_object_path,
  resources.created_at,
  resources.updated_at,
  app_private.resource_save_count(resources.id) as save_count,
  exists (
    select 1 from public.resource_saves
    where resource_saves.resource_id = resources.id
      and resource_saves.user_id = (select auth.uid())
  ) as saved_by_current_user
from public.resources
join public.profiles on profiles.id = resources.author_id;

-- Only browser-safe HTTP(S) resource URLs are accepted. Storage-backed
-- resources remain disabled until a bucket and object policies exist.
alter table public.resources
  drop constraint if exists resources_external_url_check;
alter table public.resources
  drop constraint if exists resources_check;
alter table public.resources
  add constraint resources_external_url_safe check (
    external_url is not null
    and char_length(external_url) <= 2048
    and external_url ~* '^https?://[^/@?#[:space:]]+([/?#][^[:space:]]*)?$'
    and external_url !~ '[[:cntrl:]]'
    and position(E'\\' in external_url) = 0
  ),
  add constraint resources_storage_disabled check (
    storage_object_path is null
  );

-- Array cardinality alone does not stop a direct API caller from submitting
-- oversized or whitespace-only tag elements.
create function app_private.tags_are_safe(
  candidate text[],
  maximum_count integer,
  maximum_length integer
)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select
    candidate is not null
    and cardinality(candidate) <= maximum_count
    and not exists (
      select 1
      from unnest(candidate) as tag
      where tag is null
        or tag <> btrim(tag)
        or char_length(tag) < 1
        or char_length(tag) > maximum_length
    );
$$;

revoke all on function app_private.tags_are_safe(text[], integer, integer)
  from public, anon;
grant execute on function app_private.tags_are_safe(text[], integer, integer)
  to authenticated, service_role;

alter table public.posts
  add constraint posts_tags_safe
  check (app_private.tags_are_safe(tags, 8, 40));
alter table public.resources
  add constraint resources_tags_safe
  check (app_private.tags_are_safe(tags, 12, 40));

-- Column grants are the mass-assignment boundary for callers that bypass the
-- application and use the Data API directly. Generated IDs, timestamps,
-- ownership metadata, and the disabled Storage path are not writable.
revoke insert, update on table public.profiles from authenticated;
grant insert (
  id, username, full_name, bio, program_id, academic_year,
  available_for_projects, open_to_collaboration, profile_visibility,
  onboarding_completed
) on table public.profiles to authenticated;
grant update (
  username, full_name, bio, program_id, academic_year,
  available_for_projects, open_to_collaboration, profile_visibility,
  onboarding_completed
) on table public.profiles to authenticated;

revoke insert on table public.profile_interests, public.profile_skills
  from authenticated;
grant insert (profile_id, interest_id)
  on table public.profile_interests to authenticated;
grant insert (profile_id, skill_id)
  on table public.profile_skills to authenticated;

revoke insert on table public.follows from authenticated;
grant insert (follower_id, following_id)
  on table public.follows to authenticated;

revoke insert on table public.communities from authenticated;
grant insert (slug, name, category, description, status, creator_id)
  on table public.communities to authenticated;

revoke insert on table public.community_members from authenticated;
grant insert (community_id, profile_id, role)
  on table public.community_members to authenticated;

revoke insert on table public.projects from authenticated;
grant insert (slug, name, tagline, description, category, status, creator_id)
  on table public.projects to authenticated;

revoke insert on table public.project_technologies from authenticated;
grant insert (project_id, name)
  on table public.project_technologies to authenticated;

revoke insert on table public.project_roles from authenticated;
grant insert (project_id, title, is_open)
  on table public.project_roles to authenticated;

revoke insert on table public.project_applications from authenticated;
grant insert (project_id, project_role_id, applicant_id, message)
  on table public.project_applications to authenticated;

revoke insert on table public.project_saves from authenticated;
grant insert (profile_id, project_id)
  on table public.project_saves to authenticated;

revoke insert on table public.events from authenticated;
grant insert (
  slug, title, description, category, starts_at, ends_at, location,
  capacity, organizer_id
) on table public.events to authenticated;

revoke insert on table public.event_attendees, public.event_saves
  from authenticated;
grant insert (event_id, profile_id)
  on table public.event_attendees to authenticated;
grant insert (profile_id, event_id)
  on table public.event_saves to authenticated;

revoke insert, update on table public.posts from authenticated;
grant insert (author_id, content, community_id, tags)
  on table public.posts to authenticated;
grant update (content, community_id, tags)
  on table public.posts to authenticated;

revoke insert on table public.comments, public.post_likes,
  public.post_bookmarks from authenticated;
grant insert (post_id, author_id, body)
  on table public.comments to authenticated;
grant insert (post_id, user_id)
  on table public.post_likes to authenticated;
grant insert (user_id, post_id)
  on table public.post_bookmarks to authenticated;

revoke insert, update on table public.resources from authenticated;
grant insert (
  author_id, title, description, type, category, tags, external_url
) on table public.resources to authenticated;
grant update (
  title, description, type, category, tags, external_url
) on table public.resources to authenticated;

revoke insert on table public.resource_saves from authenticated;
grant insert (resource_id, user_id)
  on table public.resource_saves to authenticated;

-- A fixed-row quota table bounds high-frequency mutation paths, including
-- direct Data API calls and bulk inserts. It is private and cannot be queried
-- or changed by API roles.
create table app_private.write_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action ~ '^[a-z_]{3,40}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null,
  primary key (user_id, action)
);

alter table app_private.write_rate_limits enable row level security;
revoke all privileges on table app_private.write_rate_limits
  from public, anon, authenticated;
create policy "Deny API access to write quotas"
on app_private.write_rate_limits for all to anon, authenticated
using (false)
with check (false);

create function app_private.consume_write_quota(
  quota_action text,
  maximum_requests integer,
  window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  observed_count integer;
  observed_at timestamptz := clock_timestamp();
begin
  if actor_id is null then
    return;
  end if;
  if quota_action !~ '^[a-z_]{3,40}$'
    or maximum_requests < 1 or maximum_requests > 10000
    or window_seconds < 1 or window_seconds > 604800 then
    raise exception 'Invalid write quota configuration' using errcode = '22023';
  end if;

  insert into app_private.write_rate_limits(
    user_id, action, window_started_at, request_count, updated_at
  ) values (
    actor_id, quota_action, observed_at, 1, observed_at
  )
  on conflict (user_id, action) do update set
    window_started_at = case
      when app_private.write_rate_limits.window_started_at
        <= observed_at - make_interval(secs => window_seconds)
      then observed_at
      else app_private.write_rate_limits.window_started_at
    end,
    request_count = case
      when app_private.write_rate_limits.window_started_at
        <= observed_at - make_interval(secs => window_seconds)
      then 1
      else app_private.write_rate_limits.request_count + 1
    end,
    updated_at = observed_at
  returning request_count into observed_count;

  if observed_count > maximum_requests then
    raise exception 'Rate limit exceeded. Please try again later.'
      using errcode = 'P0001';
  end if;
end;
$$;

create function app_private.enforce_write_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app_private.consume_write_quota(
    tg_argv[0], tg_argv[1]::integer, tg_argv[2]::integer
  );
  return new;
end;
$$;

revoke all on function app_private.consume_write_quota(text, integer, integer)
  from public, anon, authenticated;
revoke all on function app_private.enforce_write_rate_limit()
  from public, anon, authenticated;

create trigger rate_limit_profile_writes
before insert or update on public.profiles
for each row execute function app_private.enforce_write_rate_limit(
  'profile_writes', '60', '3600'
);
create trigger rate_limit_follows
before insert on public.follows
for each row execute function app_private.enforce_write_rate_limit(
  'follows', '120', '60'
);
create trigger rate_limit_communities
before insert on public.communities
for each row execute function app_private.enforce_write_rate_limit(
  'communities', '10', '86400'
);
create trigger rate_limit_community_joins
before insert on public.community_members
for each row execute function app_private.enforce_write_rate_limit(
  'community_joins', '120', '3600'
);
create trigger rate_limit_projects
before insert on public.projects
for each row execute function app_private.enforce_write_rate_limit(
  'projects', '10', '86400'
);
create trigger rate_limit_project_applications
before insert on public.project_applications
for each row execute function app_private.enforce_write_rate_limit(
  'project_applications', '30', '3600'
);
create trigger rate_limit_project_saves
before insert on public.project_saves
for each row execute function app_private.enforce_write_rate_limit(
  'project_saves', '240', '60'
);
create trigger rate_limit_events
before insert on public.events
for each row execute function app_private.enforce_write_rate_limit(
  'events', '20', '86400'
);
create trigger rate_limit_event_attendance
before insert on public.event_attendees
for each row execute function app_private.enforce_write_rate_limit(
  'event_attendance', '120', '3600'
);
create trigger rate_limit_event_saves
before insert on public.event_saves
for each row execute function app_private.enforce_write_rate_limit(
  'event_saves', '240', '60'
);
create trigger rate_limit_posts
before insert on public.posts
for each row execute function app_private.enforce_write_rate_limit(
  'posts', '20', '3600'
);
create trigger rate_limit_comments
before insert on public.comments
for each row execute function app_private.enforce_write_rate_limit(
  'comments', '30', '60'
);
create trigger rate_limit_post_likes
before insert on public.post_likes
for each row execute function app_private.enforce_write_rate_limit(
  'post_likes', '240', '60'
);
create trigger rate_limit_post_bookmarks
before insert on public.post_bookmarks
for each row execute function app_private.enforce_write_rate_limit(
  'post_bookmarks', '240', '60'
);
create trigger rate_limit_resources
before insert on public.resources
for each row execute function app_private.enforce_write_rate_limit(
  'resources', '30', '86400'
);
create trigger rate_limit_resource_saves
before insert on public.resource_saves
for each row execute function app_private.enforce_write_rate_limit(
  'resource_saves', '240', '60'
);
create trigger rate_limit_messages
before insert on public.messages
for each row execute function app_private.enforce_write_rate_limit(
  'messages', '120', '60'
);

-- Profile and related-list writes now complete in one transaction.
create function public.save_my_profile(
  profile_username text,
  profile_full_name text,
  profile_bio text,
  profile_program_id uuid,
  profile_academic_year smallint,
  profile_available_for_projects boolean,
  profile_open_to_collaboration boolean,
  profile_visibility text,
  profile_onboarding_completed boolean,
  interest_ids uuid[],
  skill_ids uuid[]
)
returns public.profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  saved_profile public.profiles;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if cardinality(coalesce(interest_ids, '{}'::uuid[])) > 50
    or cardinality(coalesce(skill_ids, '{}'::uuid[])) > 50 then
    raise exception 'Too many profile references' using errcode = '23514';
  end if;

  insert into public.profiles(
    id, username, full_name, bio, program_id, academic_year,
    available_for_projects, open_to_collaboration, profile_visibility,
    onboarding_completed
  ) values (
    current_user_id, profile_username, profile_full_name, profile_bio,
    profile_program_id, profile_academic_year,
    profile_available_for_projects, profile_open_to_collaboration,
    profile_visibility, profile_onboarding_completed
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    bio = excluded.bio,
    program_id = excluded.program_id,
    academic_year = excluded.academic_year,
    available_for_projects = excluded.available_for_projects,
    open_to_collaboration = excluded.open_to_collaboration,
    profile_visibility = excluded.profile_visibility,
    onboarding_completed = excluded.onboarding_completed
  returning * into saved_profile;

  delete from public.profile_interests where profile_id = current_user_id;
  delete from public.profile_skills where profile_id = current_user_id;

  insert into public.profile_interests(profile_id, interest_id)
  select current_user_id, selected_id
  from (
    select distinct unnest(coalesce(interest_ids, '{}'::uuid[])) as selected_id
  ) normalized;

  insert into public.profile_skills(profile_id, skill_id)
  select current_user_id, selected_id
  from (
    select distinct unnest(coalesce(skill_ids, '{}'::uuid[])) as selected_id
  ) normalized;

  return saved_profile;
end;
$$;

revoke all on function public.save_my_profile(
  text, text, text, uuid, smallint, boolean, boolean, text, boolean,
  uuid[], uuid[]
) from public, anon;
grant execute on function public.save_my_profile(
  text, text, text, uuid, smallint, boolean, boolean, text, boolean,
  uuid[], uuid[]
) to authenticated;

-- Bound arrays accepted by the project-creation RPC so one request cannot
-- fan out into an arbitrary number of child rows.
create or replace function public.create_project(
  project_slug text,
  project_name text,
  project_tagline text,
  project_description text,
  project_category text,
  project_status public.project_status,
  technologies text[],
  roles_needed text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_project_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if coalesce(array_length(roles_needed, 1), 0) = 0 then
    raise exception 'At least one open role is required' using errcode = '23514';
  end if;
  if cardinality(coalesce(technologies, '{}'::text[])) > 20
    or cardinality(coalesce(roles_needed, '{}'::text[])) > 20 then
    raise exception 'Projects support at most 20 technologies and 20 roles'
      using errcode = '23514';
  end if;

  insert into public.projects(
    slug, name, tagline, description, category, status, creator_id
  ) values (
    project_slug, project_name, project_tagline, project_description,
    project_category, project_status, (select auth.uid())
  )
  returning id into new_project_id;

  insert into public.project_technologies(project_id, name)
  select new_project_id, value
  from (
    select distinct btrim(technology) as value
    from unnest(coalesce(technologies, '{}'::text[])) as technology
  ) normalized
  where value <> '';

  insert into public.project_roles(project_id, title)
  select new_project_id, value
  from (
    select distinct btrim(role_name) as value
    from unnest(roles_needed) as role_name
  ) normalized
  where value <> '';

  if not exists (
    select 1 from public.project_roles where project_id = new_project_id
  ) then
    raise exception 'At least one valid open role is required'
      using errcode = '23514';
  end if;
  return new_project_id;
end;
$$;

revoke all on function public.create_project(
  text, text, text, text, text, public.project_status, text[], text[]
) from public, anon;
grant execute on function public.create_project(
  text, text, text, text, text, public.project_status, text[], text[]
) to authenticated;

-- Direct-conversation creation is atomic already; quota the RPC entry point
-- and keep only the intended private helpers executable by authenticated users.
create or replace function app_private.get_or_create_direct_conversation(
  other_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  low_user_id uuid;
  high_user_id uuid;
  direct_conversation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  perform app_private.consume_write_quota('direct_conversations', 60, 3600);
  if other_profile_id is null or other_profile_id = current_user_id then
    raise exception 'A direct conversation requires another profile'
      using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = other_profile_id and onboarding_completed
  ) then
    raise exception 'Profile not found' using errcode = '23503';
  end if;

  low_user_id := least(current_user_id, other_profile_id);
  high_user_id := greatest(current_user_id, other_profile_id);

  insert into public.conversations(direct_user_low, direct_user_high)
  values (low_user_id, high_user_id)
  on conflict (direct_user_low, direct_user_high)
  do update set updated_at = public.conversations.updated_at
  returning id into direct_conversation_id;

  insert into public.conversation_members(conversation_id, user_id, last_read_at)
  values
    (direct_conversation_id, current_user_id, now()),
    (direct_conversation_id, other_profile_id, now())
  on conflict (conversation_id, user_id) do nothing;

  return direct_conversation_id;
end;
$$;

revoke all on function app_private.get_or_create_direct_conversation(uuid)
  from public, anon, authenticated;
grant execute on function app_private.get_or_create_direct_conversation(uuid)
  to authenticated;
revoke all on function app_private.is_conversation_member(uuid, uuid)
  from public, anon, authenticated;
grant execute on function app_private.is_conversation_member(uuid, uuid)
  to authenticated;

-- Keep conversation-list reads bounded even for an abusive account.
create or replace function public.list_my_conversations()
returns table (
  conversation_id uuid,
  other_profile_id uuid,
  other_username text,
  other_full_name text,
  other_avatar_url text,
  last_message_id uuid,
  last_message_body text,
  last_message_sender_id uuid,
  last_message_created_at timestamptz,
  unread_count bigint,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    conversation.id,
    other_member.user_id,
    other_profile.username,
    other_profile.full_name,
    other_profile.avatar_url,
    last_message.id,
    last_message.body,
    last_message.sender_id,
    last_message.created_at,
    coalesce(unread.total, 0),
    conversation.updated_at
  from public.conversation_members as own_member
  join public.conversations as conversation
    on conversation.id = own_member.conversation_id
  join public.conversation_members as other_member
    on other_member.conversation_id = conversation.id
   and other_member.user_id <> own_member.user_id
  join public.profiles as other_profile
    on other_profile.id = other_member.user_id
  left join lateral (
    select message.id, message.body, message.sender_id, message.created_at
    from public.messages as message
    where message.conversation_id = conversation.id
    order by message.created_at desc, message.id desc
    limit 1
  ) as last_message on true
  left join lateral (
    select count(*) as total
    from public.messages as unread_message
    where unread_message.conversation_id = conversation.id
      and unread_message.recipient_id = own_member.user_id
      and unread_message.created_at > coalesce(
        own_member.last_read_at,
        '-infinity'::timestamptz
      )
  ) as unread on true
  where own_member.user_id = (select auth.uid())
  order by last_message.created_at desc nulls last,
    conversation.updated_at desc,
    conversation.id
  limit 100;
$$;

revoke all on function public.list_my_conversations()
  from public, anon;
grant execute on function public.list_my_conversations()
  to authenticated;
