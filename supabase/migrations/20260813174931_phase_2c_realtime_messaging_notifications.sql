create type public.notification_type as enum (
  'new_follower',
  'post_comment',
  'post_like',
  'project_application',
  'project_application_accepted',
  'project_application_rejected'
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind = 'direct'),
  direct_user_low uuid not null references public.profiles(id) on delete cascade,
  direct_user_high uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_direct_users
    check (direct_user_low < direct_user_high),
  constraint conversations_one_direct_pair
    unique (direct_user_low, direct_user_high)
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000 and body = btrim(body)),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.notification_type not null,
  entity_type text not null check (entity_type in ('profile', 'post', 'project')),
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  dedupe_key text not null unique check (char_length(dedupe_key) between 3 and 180),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (actor_id is null or actor_id <> recipient_id)
);

create index conversation_members_user_idx
  on public.conversation_members(user_id, conversation_id);
create index messages_conversation_created_idx
  on public.messages(conversation_id, created_at desc, id desc);
create index messages_sender_idx
  on public.messages(sender_id, created_at desc);
create index messages_recipient_created_idx
  on public.messages(recipient_id, created_at desc);
create index notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);
create index notifications_recipient_unread_idx
  on public.notifications(recipient_id, created_at desc)
  where read_at is null;
create index notifications_actor_idx
  on public.notifications(actor_id)
  where actor_id is not null;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

create function app_private.is_conversation_member(
  target_conversation_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = target_conversation_id
      and user_id = target_user_id
  );
$$;

create policy "Participants read conversations"
on public.conversations for select to authenticated
using (
  app_private.is_conversation_member(id, (select auth.uid()))
);

create policy "Participants read conversation members"
on public.conversation_members for select to authenticated
using (
  app_private.is_conversation_member(conversation_id, (select auth.uid()))
);

create policy "Members update only their read state"
on public.conversation_members for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Participants read messages"
on public.messages for select to authenticated
using (
  app_private.is_conversation_member(conversation_id, (select auth.uid()))
);

create policy "Participants send messages as themselves"
on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and recipient_id <> sender_id
  and app_private.is_conversation_member(conversation_id, (select auth.uid()))
  and app_private.is_conversation_member(conversation_id, recipient_id)
);

create policy "Recipients read their notifications"
on public.notifications for select to authenticated
using (recipient_id = (select auth.uid()));

create policy "Recipients update their notification read state"
on public.notifications for update to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

revoke all privileges on table public.conversations, public.conversation_members,
  public.messages, public.notifications from public, anon, authenticated;

grant select on table public.conversations to authenticated;
grant select on table public.conversation_members to authenticated;
grant update(last_read_at) on table public.conversation_members to authenticated;
grant select on table public.messages to authenticated;
grant insert(conversation_id, body) on table public.messages to authenticated;
grant select on table public.notifications to authenticated;
grant update(read_at) on table public.notifications to authenticated;

create function app_private.get_or_create_direct_conversation(other_profile_id uuid)
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

create function public.get_or_create_direct_conversation(other_profile_id uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select app_private.get_or_create_direct_conversation(other_profile_id);
$$;

create function public.mark_conversation_read(target_conversation_id uuid)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  read_through timestamptz;
begin
  select max(created_at) into read_through
  from public.messages
  where conversation_id = target_conversation_id;

  if read_through is null then
    return null;
  end if;

  update public.conversation_members
  set last_read_at = greatest(
    coalesce(last_read_at, '-infinity'::timestamptz),
    read_through
  )
  where conversation_id = target_conversation_id
    and user_id = (select auth.uid())
  returning last_read_at into read_through;

  return read_through;
end;
$$;

create function public.get_my_unread_message_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)
  from public.conversation_members as membership
  join public.messages as message
    on message.conversation_id = membership.conversation_id
   and message.recipient_id = membership.user_id
  where membership.user_id = (select auth.uid())
    and message.created_at > coalesce(
      membership.last_read_at,
      '-infinity'::timestamptz
    );
$$;

create function public.list_my_conversations()
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
    conversation.id;
$$;

create function app_private.prepare_direct_message()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  new.body := btrim(new.body);
  new.sender_id := current_user_id;

  select member.user_id into new.recipient_id
  from public.conversation_members as member
  where member.conversation_id = new.conversation_id
    and member.user_id <> current_user_id
  limit 1;

  if new.recipient_id is null then
    raise exception 'You are not a participant in this conversation'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger prepare_direct_message
before insert on public.messages
for each row execute function app_private.prepare_direct_message();

create function app_private.touch_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger touch_conversation_after_message
after insert on public.messages
for each row execute function app_private.touch_conversation_after_message();

create function app_private.put_notification(
  target_recipient_id uuid,
  source_actor_id uuid,
  notification_kind public.notification_type,
  target_entity_type text,
  target_entity_id uuid,
  presentation_payload jsonb,
  notification_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_recipient_id is null
    or source_actor_id is null
    or target_recipient_id = source_actor_id then
    return;
  end if;

  insert into public.notifications(
    recipient_id, actor_id, type, entity_type, entity_id, payload, dedupe_key
  ) values (
    target_recipient_id, source_actor_id, notification_kind,
    target_entity_type, target_entity_id,
    coalesce(presentation_payload, '{}'::jsonb), notification_dedupe_key
  )
  on conflict (dedupe_key) do update set
    actor_id = excluded.actor_id,
    type = excluded.type,
    entity_type = excluded.entity_type,
    entity_id = excluded.entity_id,
    payload = excluded.payload,
    read_at = null,
    created_at = now();
end;
$$;

create function app_private.notify_follow_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform app_private.put_notification(
      new.following_id,
      new.follower_id,
      'new_follower',
      'profile',
      new.follower_id,
      '{}'::jsonb,
      format('follow:%s:%s', new.follower_id, new.following_id)
    );
    return new;
  end if;

  delete from public.notifications
  where dedupe_key = format('follow:%s:%s', old.follower_id, old.following_id);
  return old;
end;
$$;

create trigger notify_follow_change
after insert or delete on public.follows
for each row execute function app_private.notify_follow_change();

create function app_private.notify_post_like_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_author_id uuid;
begin
  if tg_op = 'INSERT' then
    select author_id into post_author_id
    from public.posts where id = new.post_id;
    perform app_private.put_notification(
      post_author_id,
      new.user_id,
      'post_like',
      'post',
      new.post_id,
      '{}'::jsonb,
      format('post-like:%s:%s', new.post_id, new.user_id)
    );
    return new;
  end if;

  delete from public.notifications
  where dedupe_key = format('post-like:%s:%s', old.post_id, old.user_id);
  return old;
end;
$$;

create trigger notify_post_like_change
after insert or delete on public.post_likes
for each row execute function app_private.notify_post_like_change();

create function app_private.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_author_id uuid;
begin
  select author_id into post_author_id
  from public.posts where id = new.post_id;
  perform app_private.put_notification(
    post_author_id,
    new.author_id,
    'post_comment',
    'post',
    new.post_id,
    jsonb_build_object('comment_id', new.id),
    format('post-comment:%s', new.id)
  );
  return new;
end;
$$;

create trigger notify_post_comment
after insert on public.comments
for each row execute function app_private.notify_post_comment();

create function app_private.notify_project_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_owner_id uuid;
  project_slug text;
begin
  select creator_id, slug into project_owner_id, project_slug
  from public.projects where id = new.project_id;
  perform app_private.put_notification(
    project_owner_id,
    new.applicant_id,
    'project_application',
    'project',
    new.project_id,
    jsonb_build_object('application_id', new.id, 'project_slug', project_slug),
    format('project-application:%s', new.id)
  );
  return new;
end;
$$;

create trigger notify_project_application
after insert on public.project_applications
for each row execute function app_private.notify_project_application();

create function app_private.notify_project_application_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_owner_id uuid;
  project_slug text;
  review_type public.notification_type;
begin
  if new.status is not distinct from old.status
    or new.status not in ('accepted', 'rejected') then
    return new;
  end if;

  select creator_id, slug into project_owner_id, project_slug
  from public.projects where id = new.project_id;
  review_type := case new.status
    when 'accepted' then 'project_application_accepted'::public.notification_type
    else 'project_application_rejected'::public.notification_type
  end;

  perform app_private.put_notification(
    new.applicant_id,
    project_owner_id,
    review_type,
    'project',
    new.project_id,
    jsonb_build_object('application_id', new.id, 'project_slug', project_slug),
    format('project-application-review:%s', new.id)
  );
  return new;
end;
$$;

create trigger notify_project_application_review
after update of status on public.project_applications
for each row execute function app_private.notify_project_application_review();

grant usage on schema app_private to authenticated;
grant execute on function app_private.is_conversation_member(uuid, uuid)
  to authenticated;
grant execute on function app_private.get_or_create_direct_conversation(uuid)
  to authenticated;

revoke all on function public.get_or_create_direct_conversation(uuid)
  from public, anon;
grant execute on function public.get_or_create_direct_conversation(uuid)
  to authenticated;
revoke all on function public.mark_conversation_read(uuid)
  from public, anon;
grant execute on function public.mark_conversation_read(uuid)
  to authenticated;
revoke all on function public.get_my_unread_message_count()
  from public, anon;
grant execute on function public.get_my_unread_message_count()
  to authenticated;
revoke all on function public.list_my_conversations()
  from public, anon;
grant execute on function public.list_my_conversations()
  to authenticated;

revoke all on function app_private.prepare_direct_message()
  from public, anon, authenticated;
revoke all on function app_private.touch_conversation_after_message()
  from public, anon, authenticated;
revoke all on function app_private.put_notification(
  uuid, uuid, public.notification_type, text, uuid, jsonb, text
) from public, anon, authenticated;
revoke all on function app_private.notify_follow_change()
  from public, anon, authenticated;
revoke all on function app_private.notify_post_like_change()
  from public, anon, authenticated;
revoke all on function app_private.notify_post_comment()
  from public, anon, authenticated;
revoke all on function app_private.notify_project_application()
  from public, anon, authenticated;
revoke all on function app_private.notify_project_application_review()
  from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversation_members'
  ) then
    alter publication supabase_realtime add table public.conversation_members;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
