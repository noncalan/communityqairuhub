create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'community_moderator', 'admin');

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (char_length(name) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (char_length(name) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (char_length(name) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null
    check (username ~ '^[a-z0-9_]{3,30}$')
    check (username not in ('admin', 'api', 'auth', 'login', 'onboarding', 'qairu', 'root', 'settings', 'signup', 'support', 'system', 'www')),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_url text,
  program_id uuid references public.programs(id) on delete set null,
  academic_year smallint not null check (academic_year between 1 and 8),
  available_for_projects boolean not null default false,
  open_to_collaboration boolean not null default true,
  profile_visibility text not null default 'campus' check (profile_visibility in ('campus', 'private')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  primary key (profile_id, interest_id)
);

create table public.profile_skills (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (profile_id, skill_id)
);

create index profiles_program_idx on public.profiles(program_id, academic_year);
create index profiles_completed_idx on public.profiles(onboarding_completed) where onboarding_completed;
create index profile_interests_interest_idx on public.profile_interests(interest_id, profile_id);
create index profile_skills_skill_idx on public.profile_skills(skill_id, profile_id);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.programs enable row level security;
alter table public.interests enable row level security;
alter table public.skills enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.profile_interests enable row level security;
alter table public.profile_skills enable row level security;

revoke all on public.programs, public.interests, public.skills, public.profiles,
  public.user_roles, public.profile_interests, public.profile_skills from anon;

grant select on public.programs, public.interests, public.skills to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, delete on public.profile_interests, public.profile_skills to authenticated;

create policy "Authenticated users read programs"
on public.programs for select to authenticated using (true);

create policy "Authenticated users read interests"
on public.interests for select to authenticated using (true);

create policy "Authenticated users read skills"
on public.skills for select to authenticated using (true);

create policy "Completed campus profiles are visible"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (onboarding_completed and profile_visibility = 'campus')
);

create policy "Users insert own profile"
on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

create policy "Users update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Users read own roles"
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()));

create policy "Visible profile interests are readable"
on public.profile_interests for select to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1 from public.profiles
    where profiles.id = profile_interests.profile_id
      and profiles.onboarding_completed
      and profiles.profile_visibility = 'campus'
  )
);

create policy "Users insert own interests"
on public.profile_interests for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy "Users delete own interests"
on public.profile_interests for delete to authenticated
using (profile_id = (select auth.uid()));

create policy "Visible profile skills are readable"
on public.profile_skills for select to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1 from public.profiles
    where profiles.id = profile_skills.profile_id
      and profiles.onboarding_completed
      and profiles.profile_visibility = 'campus'
  )
);

create policy "Users insert own skills"
on public.profile_skills for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy "Users delete own skills"
on public.profile_skills for delete to authenticated
using (profile_id = (select auth.uid()));

insert into public.programs (name) values
  ('Artificial Intelligence'),
  ('Business'),
  ('Computer Science'),
  ('Data Science'),
  ('Product Management')
on conflict (name) do nothing;

insert into public.interests (name) values
  ('Artificial Intelligence'),
  ('Climate'),
  ('Data'),
  ('Debate'),
  ('Design'),
  ('Film'),
  ('Football'),
  ('Open source'),
  ('Robotics'),
  ('Startups')
on conflict (name) do nothing;

insert into public.skills (name) values
  ('Finance'),
  ('JavaScript'),
  ('Machine Learning'),
  ('Marketing'),
  ('Python'),
  ('Research'),
  ('Robotics'),
  ('UI/UX'),
  ('Video'),
  ('Writing')
on conflict (name) do nothing;
