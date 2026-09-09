-- University clubs + Telegram prototype.
-- Existing communities remain the canonical club records. Public browsing is
-- exposed through a narrow security-invoker view; private Telegram chat IDs
-- live in a manager-only table.

alter table public.communities
  add column short_description text,
  add column logo_url text,
  add column leader_name text,
  add column contact text,
  add column telegram_bot_key text not null default encode(gen_random_bytes(12), 'hex');

alter table public.communities
  add constraint communities_short_description_length
    check (short_description is null or char_length(btrim(short_description)) between 8 and 180),
  add constraint communities_logo_url_https
    check (logo_url is null or (char_length(logo_url) <= 500 and logo_url ~ '^https://')),
  add constraint communities_leader_name_length
    check (leader_name is null or char_length(btrim(leader_name)) between 2 and 100),
  add constraint communities_contact_length
    check (contact is null or char_length(btrim(contact)) between 3 and 160),
  add constraint communities_telegram_bot_key_format
    check (telegram_bot_key ~ '^[a-f0-9]{24}$'),
  add constraint communities_telegram_bot_key_key unique (telegram_bot_key);

create table public.club_telegram_integrations (
  community_id uuid primary key references public.communities(id) on delete cascade,
  group_url text not null
    check (
      char_length(group_url) between 14 and 200
      and group_url ~ '^https://t\.me/[A-Za-z0-9_+/-]+$'
    ),
  public_username text
    check (public_username is null or public_username ~ '^[A-Za-z0-9_]{5,32}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.club_telegram_connections (
  community_id uuid primary key references public.communities(id) on delete cascade,
  telegram_chat_id text not null
    check (telegram_chat_id ~ '^-?[0-9]{5,20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_club_telegram_integrations_updated_at
before update on public.club_telegram_integrations
for each row execute function public.set_updated_at();

create trigger set_club_telegram_connections_updated_at
before update on public.club_telegram_connections
for each row execute function public.set_updated_at();

alter table public.club_telegram_integrations enable row level security;
alter table public.club_telegram_connections enable row level security;

revoke all privileges on table
  public.club_telegram_integrations,
  public.club_telegram_connections
from public, anon, authenticated;

-- Anonymous clients can only read the explicitly listed club columns. Existing
-- authenticated community access remains unchanged.
grant select (
  id, slug, name, short_description, description, category, logo_url,
  leader_name, contact, status, telegram_bot_key, created_at, updated_at
) on table public.communities to anon;

grant insert (short_description, logo_url, leader_name, contact)
  on table public.communities to authenticated;
grant update (short_description, logo_url, leader_name, contact)
  on table public.communities to authenticated;

grant select on table public.club_telegram_integrations to anon, authenticated;
grant insert (community_id, group_url, public_username)
  on table public.club_telegram_integrations to authenticated;
grant update (group_url, public_username)
  on table public.club_telegram_integrations to authenticated;
grant delete on table public.club_telegram_integrations to authenticated;

grant select on table public.club_telegram_connections to authenticated;
grant insert (community_id, telegram_chat_id)
  on table public.club_telegram_connections to authenticated;
grant update (telegram_chat_id)
  on table public.club_telegram_connections to authenticated;
grant delete on table public.club_telegram_connections to authenticated;

create policy "Public reads active university clubs"
on public.communities for select to anon
using (status = 'active');

create policy "Public reads active club Telegram links"
on public.club_telegram_integrations for select to anon, authenticated
using (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_integrations.community_id
      and communities.status = 'active'
  )
);

create policy "Managers read club Telegram links"
on public.club_telegram_integrations for select to authenticated
using (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_integrations.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
);

create policy "Managers create club Telegram links"
on public.club_telegram_integrations for insert to authenticated
with check (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_integrations.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
);

create policy "Managers update club Telegram links"
on public.club_telegram_integrations for update to authenticated
using (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_integrations.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_integrations.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
);

create policy "Managers delete club Telegram links"
on public.club_telegram_integrations for delete to authenticated
using (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_integrations.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
);

create policy "Managers read club Telegram chat IDs"
on public.club_telegram_connections for select to authenticated
using (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_connections.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
);

create policy "Managers create club Telegram chat IDs"
on public.club_telegram_connections for insert to authenticated
with check (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_connections.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
);

create policy "Managers update club Telegram chat IDs"
on public.club_telegram_connections for update to authenticated
using (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_connections.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_connections.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
);

create policy "Managers delete club Telegram chat IDs"
on public.club_telegram_connections for delete to authenticated
using (
  exists (
    select 1
    from public.communities
    where communities.id = club_telegram_connections.community_id
      and (
        communities.creator_id = (select auth.uid())
        or exists (
          select 1
          from public.community_members
          where community_members.community_id = communities.id
            and community_members.profile_id = (select auth.uid())
            and community_members.role in ('owner', 'moderator')
        )
      )
  )
);

-- The public directory view intentionally contains no profile IDs or private
-- Telegram chat IDs. security_invoker keeps the underlying RLS policies active.
create view public.public_clubs
with (security_invoker = true)
as
select
  communities.id,
  communities.slug,
  communities.name,
  coalesce(
    nullif(communities.short_description, ''),
    left(communities.description, 180)
  ) as short_description,
  communities.description,
  communities.category,
  communities.logo_url,
  coalesce(nullif(communities.leader_name, ''), 'Club organizer') as leader_name,
  communities.contact,
  communities.status,
  communities.telegram_bot_key,
  integrations.group_url as telegram_group_url,
  integrations.public_username as telegram_public_username,
  (integrations.community_id is not null) as telegram_configured,
  communities.created_at,
  communities.updated_at
from public.communities
left join public.club_telegram_integrations as integrations
  on integrations.community_id = communities.id
where communities.status = 'active';

revoke all privileges on table public.public_clubs
from public, anon, authenticated;
grant select on table public.public_clubs to anon, authenticated;

create function public.create_university_club(
  club_slug text,
  club_name text,
  club_short_description text,
  club_description text,
  club_category text,
  club_logo_url text,
  club_leader_name text,
  club_contact text,
  club_status public.community_status,
  telegram_group_url text,
  telegram_public_username text,
  telegram_chat_id text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_community_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.communities (
    slug, name, short_description, description, category, logo_url,
    leader_name, contact, status, creator_id
  ) values (
    club_slug, club_name, club_short_description, club_description,
    club_category, club_logo_url, club_leader_name, club_contact,
    club_status, (select auth.uid())
  )
  returning id into new_community_id;

  if telegram_group_url is not null then
    insert into public.club_telegram_integrations (
      community_id, group_url, public_username
    ) values (
      new_community_id, telegram_group_url, telegram_public_username
    );
  end if;

  if telegram_chat_id is not null then
    insert into public.club_telegram_connections (
      community_id, telegram_chat_id
    ) values (
      new_community_id, telegram_chat_id
    );
  end if;

  return club_slug;
end;
$$;

create function public.update_university_club(
  club_id uuid,
  club_slug text,
  club_name text,
  club_short_description text,
  club_description text,
  club_category text,
  club_logo_url text,
  club_leader_name text,
  club_contact text,
  club_status public.community_status,
  telegram_group_url text,
  telegram_public_username text,
  telegram_chat_id text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.communities
  set
    slug = club_slug,
    name = club_name,
    short_description = club_short_description,
    description = club_description,
    category = club_category,
    logo_url = club_logo_url,
    leader_name = club_leader_name,
    contact = club_contact,
    status = club_status
  where id = club_id;

  if not found then
    raise exception 'Club not found or edit not permitted' using errcode = '42501';
  end if;

  if telegram_group_url is null then
    delete from public.club_telegram_integrations
    where community_id = club_id;
  else
    insert into public.club_telegram_integrations (
      community_id, group_url, public_username
    ) values (
      club_id, telegram_group_url, telegram_public_username
    )
    on conflict (community_id) do update set
      group_url = excluded.group_url,
      public_username = excluded.public_username;
  end if;

  if telegram_chat_id is null then
    delete from public.club_telegram_connections
    where community_id = club_id;
  else
    insert into public.club_telegram_connections (
      community_id, telegram_chat_id
    ) values (
      club_id, telegram_chat_id
    )
    on conflict (community_id) do update set
      telegram_chat_id = excluded.telegram_chat_id;
  end if;

  return club_slug;
end;
$$;

revoke all on function public.create_university_club(
  text, text, text, text, text, text, text, text,
  public.community_status, text, text, text
) from public, anon, authenticated;
grant execute on function public.create_university_club(
  text, text, text, text, text, text, text, text,
  public.community_status, text, text, text
) to authenticated;

revoke all on function public.update_university_club(
  uuid, text, text, text, text, text, text, text, text,
  public.community_status, text, text, text
) from public, anon, authenticated;
grant execute on function public.update_university_club(
  uuid, text, text, text, text, text, text, text, text,
  public.community_status, text, text, text
) to authenticated;
