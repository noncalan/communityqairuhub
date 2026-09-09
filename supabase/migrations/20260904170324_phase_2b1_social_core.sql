create type public.community_status as enum ('forming', 'active');
create type public.community_member_role as enum ('owner', 'moderator', 'member');
create type public.project_status as enum ('idea', 'building', 'launched', 'completed');
create type public.application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name text not null check (char_length(btrim(name)) between 3 and 80),
  category text not null check (char_length(btrim(category)) between 2 and 60),
  description text not null check (char_length(btrim(description)) between 8 and 600),
  status public.community_status not null default 'forming',
  creator_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.community_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (community_id, profile_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name text not null check (char_length(btrim(name)) between 3 and 100),
  tagline text not null check (char_length(btrim(tagline)) between 5 and 160),
  description text not null check (char_length(btrim(description)) between 10 and 3000),
  category text not null check (char_length(btrim(category)) between 2 and 60),
  status public.project_status not null default 'idea',
  creator_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_technologies (
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 50),
  primary key (project_id, name)
);

create table public.project_roles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 80),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, title),
  unique (id, project_id)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_title text not null check (char_length(btrim(role_title)) between 2 and 80),
  can_edit boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

create table public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  project_role_id uuid not null,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 5 and 1000),
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_role_id, project_id)
    references public.project_roles(id, project_id) on delete restrict
);

create unique index project_applications_one_pending_idx
  on public.project_applications(project_id, applicant_id)
  where status = 'pending';

create table public.project_saves (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null check (char_length(btrim(description)) between 8 and 2000),
  category text not null check (char_length(btrim(category)) between 2 and 60),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null check (char_length(btrim(location)) between 2 and 160),
  capacity integer not null check (capacity between 1 and 10000),
  organizer_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create table public.event_saves (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, event_id)
);

create index follows_following_idx on public.follows(following_id, created_at desc);
create index communities_status_created_idx on public.communities(status, created_at desc);
create index community_members_profile_idx on public.community_members(profile_id, joined_at desc);
create index projects_status_created_idx on public.projects(status, created_at desc);
create index project_members_profile_idx on public.project_members(profile_id, joined_at desc);
create index project_applications_owner_queue_idx on public.project_applications(project_id, status, created_at);
create index project_applications_applicant_idx on public.project_applications(applicant_id, created_at desc);
create index events_starts_idx on public.events(starts_at);
create index event_attendees_profile_idx on public.event_attendees(profile_id, created_at desc);

create trigger set_communities_updated_at before update on public.communities
for each row execute function public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger set_project_applications_updated_at before update on public.project_applications
for each row execute function public.set_updated_at();
create trigger set_events_updated_at before update on public.events
for each row execute function public.set_updated_at();

create function app_private.add_community_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.creator_id is distinct from (select auth.uid()) then
    raise exception 'Community creator must be the authenticated user'
      using errcode = '42501';
  end if;
  insert into public.community_members(community_id, profile_id, role)
  values (new.id, new.creator_id, 'owner');
  return new;
end;
$$;

create trigger add_community_owner
after insert on public.communities
for each row execute function app_private.add_community_owner();

create function app_private.add_project_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.creator_id is distinct from (select auth.uid()) then
    raise exception 'Project creator must be the authenticated user'
      using errcode = '42501';
  end if;
  insert into public.project_members(project_id, profile_id, role_title, can_edit)
  values (new.id, new.creator_id, 'Owner', true);
  return new;
end;
$$;

create trigger add_project_owner
after insert on public.projects
for each row execute function app_private.add_project_owner();

create function app_private.add_accepted_project_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    if not exists (
      select 1 from public.projects
      where id = new.project_id and creator_id = (select auth.uid())
    ) then
      raise exception 'Only the project creator can accept applications'
        using errcode = '42501';
    end if;
    select title into requested_role
    from public.project_roles
    where id = new.project_role_id and project_id = new.project_id;
    insert into public.project_members(project_id, profile_id, role_title, can_edit)
    values (new.project_id, new.applicant_id, requested_role, false)
    on conflict (project_id, profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger add_accepted_project_member
after update of status on public.project_applications
for each row execute function app_private.add_accepted_project_member();

create function app_private.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  maximum integer;
  current_count integer;
begin
  if (select auth.uid()) is null or new.profile_id is distinct from (select auth.uid()) then
    raise exception 'Attendance can only be created for the authenticated user'
      using errcode = '42501';
  end if;
  select capacity into maximum
  from public.events
  where id = new.event_id
  for update;
  if maximum is null then
    raise exception 'Event not found' using errcode = '23503';
  end if;
  select count(*) into current_count
  from public.event_attendees
  where event_id = new.event_id;
  if current_count >= maximum then
    raise exception 'Event is at capacity' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger enforce_event_capacity
before insert on public.event_attendees
for each row execute function app_private.enforce_event_capacity();

create function app_private.prevent_capacity_below_attendance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if new.capacity < old.capacity then
    select count(*) into current_count
    from public.event_attendees
    where event_id = new.id;
    if new.capacity < current_count then
      raise exception 'Capacity cannot be lower than current attendance'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_capacity_below_attendance
before update of capacity on public.events
for each row execute function app_private.prevent_capacity_below_attendance();

create function public.create_project(
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

alter table public.follows enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_technologies enable row level security;
alter table public.project_roles enable row level security;
alter table public.project_members enable row level security;
alter table public.project_applications enable row level security;
alter table public.project_saves enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.event_saves enable row level security;

revoke all privileges on table
  public.follows, public.communities, public.community_members,
  public.projects, public.project_technologies, public.project_roles,
  public.project_members, public.project_applications, public.project_saves,
  public.events, public.event_attendees, public.event_saves
from public, anon, authenticated;

grant select, insert, delete on public.follows to authenticated;
grant select, insert on public.communities to authenticated;
grant update(name, slug, category, description, status) on public.communities to authenticated;
grant select, insert, delete on public.community_members to authenticated;
grant select, insert on public.projects to authenticated;
grant update(name, slug, tagline, description, category, status) on public.projects to authenticated;
grant select, insert, delete on public.project_technologies to authenticated;
grant select, insert, delete on public.project_roles to authenticated;
grant update(title, is_open) on public.project_roles to authenticated;
grant select on public.project_members to authenticated;
grant select, insert on public.project_applications to authenticated;
grant update(status) on public.project_applications to authenticated;
grant select, insert, delete on public.project_saves to authenticated;
grant select, insert on public.events to authenticated;
grant update(slug, title, description, category, starts_at, ends_at, location, capacity) on public.events to authenticated;
grant select, insert, delete on public.event_attendees to authenticated;
grant select, insert, delete on public.event_saves to authenticated;

revoke all on function public.create_project(
  text, text, text, text, text, public.project_status, text[], text[]
) from public, anon;
grant execute on function public.create_project(
  text, text, text, text, text, public.project_status, text[], text[]
) to authenticated;

revoke all on function app_private.add_community_owner() from public, anon, authenticated;
revoke all on function app_private.add_project_owner() from public, anon, authenticated;
revoke all on function app_private.add_accepted_project_member() from public, anon, authenticated;
revoke all on function app_private.enforce_event_capacity() from public, anon, authenticated;
revoke all on function app_private.prevent_capacity_below_attendance() from public, anon, authenticated;

create policy "Authenticated users read follows"
on public.follows for select to authenticated using (true);
create policy "Users follow as themselves"
on public.follows for insert to authenticated
with check (follower_id = (select auth.uid()) and follower_id <> following_id);
create policy "Users delete their own follows"
on public.follows for delete to authenticated
using (follower_id = (select auth.uid()));

create policy "Authenticated users read communities"
on public.communities for select to authenticated using (true);
create policy "Users create communities as themselves"
on public.communities for insert to authenticated
with check (creator_id = (select auth.uid()));
create policy "Owners and moderators edit communities"
on public.communities for update to authenticated
using (
  creator_id = (select auth.uid())
  or exists (
    select 1 from public.community_members
    where community_id = communities.id
      and profile_id = (select auth.uid())
      and role in ('owner', 'moderator')
  )
)
with check (
  creator_id = (select auth.uid())
  or exists (
    select 1 from public.community_members
    where community_id = communities.id
      and profile_id = (select auth.uid())
      and role in ('owner', 'moderator')
  )
);

create policy "Authenticated users read community members"
on public.community_members for select to authenticated using (true);
create policy "Users join communities as themselves"
on public.community_members for insert to authenticated
with check (profile_id = (select auth.uid()) and role = 'member');
create policy "Members leave communities as themselves"
on public.community_members for delete to authenticated
using (profile_id = (select auth.uid()) and role = 'member');

create policy "Authenticated users read projects"
on public.projects for select to authenticated using (true);
create policy "Users create projects as themselves"
on public.projects for insert to authenticated
with check (creator_id = (select auth.uid()));
create policy "Owners and permitted members edit projects"
on public.projects for update to authenticated
using (
  creator_id = (select auth.uid())
  or exists (
    select 1 from public.project_members
    where project_id = projects.id
      and profile_id = (select auth.uid())
      and can_edit
  )
)
with check (
  creator_id = (select auth.uid())
  or exists (
    select 1 from public.project_members
    where project_id = projects.id
      and profile_id = (select auth.uid())
      and can_edit
  )
);

create policy "Authenticated users read project technologies"
on public.project_technologies for select to authenticated using (true);
create policy "Project editors add technologies"
on public.project_technologies for insert to authenticated
with check (
  exists (
    select 1 from public.projects
    where id = project_technologies.project_id
      and (
        creator_id = (select auth.uid())
        or exists (
          select 1 from public.project_members
          where project_id = projects.id
            and profile_id = (select auth.uid())
            and can_edit
        )
      )
  )
);
create policy "Project editors delete technologies"
on public.project_technologies for delete to authenticated
using (
  exists (
    select 1 from public.projects
    where id = project_technologies.project_id
      and creator_id = (select auth.uid())
  )
);

create policy "Authenticated users read project roles"
on public.project_roles for select to authenticated using (true);
create policy "Project creators add roles"
on public.project_roles for insert to authenticated
with check (
  exists (
    select 1 from public.projects
    where id = project_roles.project_id
      and creator_id = (select auth.uid())
  )
);
create policy "Project creators update roles"
on public.project_roles for update to authenticated
using (
  exists (
    select 1 from public.projects
    where id = project_roles.project_id
      and creator_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.projects
    where id = project_roles.project_id
      and creator_id = (select auth.uid())
  )
);
create policy "Project creators delete unused roles"
on public.project_roles for delete to authenticated
using (
  exists (
    select 1 from public.projects
    where id = project_roles.project_id
      and creator_id = (select auth.uid())
  )
);

create policy "Authenticated users read project members"
on public.project_members for select to authenticated using (true);

create policy "Applicants and project creators read applications"
on public.project_applications for select to authenticated
using (
  applicant_id = (select auth.uid())
  or exists (
    select 1 from public.projects
    where id = project_applications.project_id
      and creator_id = (select auth.uid())
  )
);
create policy "Users apply as themselves"
on public.project_applications for insert to authenticated
with check (
  applicant_id = (select auth.uid())
  and status = 'pending'
  and exists (
    select 1 from public.project_roles
    where id = project_applications.project_role_id
      and project_id = project_applications.project_id
      and is_open
  )
  and not exists (
    select 1 from public.projects
    where id = project_applications.project_id
      and creator_id = (select auth.uid())
  )
  and not exists (
    select 1 from public.project_members
    where project_id = project_applications.project_id
      and profile_id = (select auth.uid())
  )
);
create policy "Applicants withdraw pending applications"
on public.project_applications for update to authenticated
using (applicant_id = (select auth.uid()) and status = 'pending')
with check (applicant_id = (select auth.uid()) and status = 'withdrawn');
create policy "Project creators review pending applications"
on public.project_applications for update to authenticated
using (
  status = 'pending'
  and exists (
    select 1 from public.projects
    where id = project_applications.project_id
      and creator_id = (select auth.uid())
  )
)
with check (
  status in ('accepted', 'rejected')
  and exists (
    select 1 from public.projects
    where id = project_applications.project_id
      and creator_id = (select auth.uid())
  )
);

create policy "Users read own project saves"
on public.project_saves for select to authenticated
using (profile_id = (select auth.uid()));
create policy "Users save projects as themselves"
on public.project_saves for insert to authenticated
with check (profile_id = (select auth.uid()));
create policy "Users remove own project saves"
on public.project_saves for delete to authenticated
using (profile_id = (select auth.uid()));

create policy "Authenticated users read events"
on public.events for select to authenticated using (true);
create policy "Users create events as themselves"
on public.events for insert to authenticated
with check (organizer_id = (select auth.uid()));
create policy "Event organizers edit their events"
on public.events for update to authenticated
using (organizer_id = (select auth.uid()))
with check (organizer_id = (select auth.uid()));

create policy "Authenticated users read event attendance"
on public.event_attendees for select to authenticated using (true);
create policy "Users attend events as themselves"
on public.event_attendees for insert to authenticated
with check (profile_id = (select auth.uid()));
create policy "Users leave events as themselves"
on public.event_attendees for delete to authenticated
using (profile_id = (select auth.uid()));

create policy "Users read own event saves"
on public.event_saves for select to authenticated
using (profile_id = (select auth.uid()));
create policy "Users save events as themselves"
on public.event_saves for insert to authenticated
with check (profile_id = (select auth.uid()));
create policy "Users remove own event saves"
on public.event_saves for delete to authenticated
using (profile_id = (select auth.uid()));

