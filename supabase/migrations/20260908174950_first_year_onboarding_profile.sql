-- First-year onboarding stores matching signals explicitly instead of
-- overloading the legacy program and skill fields.
alter table public.profiles
  add column academic_direction text,
  add column desired_role text,
  add column contribution_preferences text[] not null default '{}'::text[];

alter table public.profiles
  add constraint profiles_academic_direction_valid check (
    academic_direction is null
    or academic_direction in ('machine_learning', 'physical_ai')
  ),
  add constraint profiles_desired_role_valid check (
    desired_role is null
    or desired_role in (
      'machine_learning_engineer',
      'data_engineer',
      'data_scientist',
      'mlops_engineer',
      'nlp_engineer',
      'computer_vision_engineer',
      'ai_researcher',
      'ai_product_manager',
      'ai_safety_reliability_specialist',
      'robotics_engineer',
      'embedded_systems_engineer',
      'control_systems_engineer',
      'autonomous_systems_engineer',
      'mechatronics_engineer',
      'simulation_engineer',
      'physical_ai_product_manager',
      'still_exploring'
    )
  ),
  add constraint profiles_role_matches_direction check (
    (academic_direction is null and desired_role is null)
    or (
      academic_direction = 'machine_learning'
      and desired_role in (
        'machine_learning_engineer',
        'data_engineer',
        'data_scientist',
        'mlops_engineer',
        'nlp_engineer',
        'computer_vision_engineer',
        'ai_researcher',
        'ai_product_manager',
        'ai_safety_reliability_specialist',
        'still_exploring'
      )
    )
    or (
      academic_direction = 'physical_ai'
      and desired_role in (
        'robotics_engineer',
        'embedded_systems_engineer',
        'control_systems_engineer',
        'computer_vision_engineer',
        'autonomous_systems_engineer',
        'mechatronics_engineer',
        'simulation_engineer',
        'ai_researcher',
        'physical_ai_product_manager',
        'still_exploring'
      )
    )
  );

create function app_private.valid_contribution_preferences(candidate text[])
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select candidate is not null
    and cardinality(candidate) <= 5
    and array_position(candidate, null) is null
    and candidate <@ array[
      'build_code',
      'research',
      'design',
      'product',
      'data',
      'hardware',
      'organize_lead',
      'present_demo'
    ]::text[]
    and cardinality(candidate) = (
      select count(distinct preference)
      from unnest(candidate) as preference
    );
$$;

revoke all on function app_private.valid_contribution_preferences(text[])
  from public, anon;
grant execute on function app_private.valid_contribution_preferences(text[])
  to authenticated, service_role;

alter table public.profiles
  add constraint profiles_contribution_preferences_valid
  check (app_private.valid_contribution_preferences(contribution_preferences));

grant insert (academic_direction, desired_role, contribution_preferences)
  on table public.profiles to authenticated;
grant update (academic_direction, desired_role, contribution_preferences)
  on table public.profiles to authenticated;

create index profiles_matching_idx
  on public.profiles(academic_direction, desired_role)
  where onboarding_completed;

insert into public.interests(name) values
  ('AI Agents'),
  ('Computer Vision'),
  ('Natural Language Processing'),
  ('Robotics'),
  ('Autonomous Systems'),
  ('Drones'),
  ('Smart Devices / IoT'),
  ('AI for Education'),
  ('AI for Healthcare'),
  ('AI for Finance'),
  ('AI for Science'),
  ('Research Projects'),
  ('Startup / Product Building'),
  ('Open Source'),
  ('Hackathons'),
  ('Automation'),
  ('Data Products'),
  ('Human-AI Interaction'),
  ('Hardware + AI'),
  ('Simulation')
on conflict (name) do nothing;

create function public.complete_my_onboarding(
  profile_username text,
  profile_full_name text,
  profile_bio text,
  profile_academic_direction text,
  profile_desired_role text,
  profile_contribution_preferences text[],
  interest_ids uuid[]
)
returns public.profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_interest_ids uuid[] := coalesce(interest_ids, '{}'::uuid[]);
  normalized_preferences text[] := coalesce(
    profile_contribution_preferences,
    '{}'::text[]
  );
  saved_profile public.profiles;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if cardinality(normalized_interest_ids) < 1
    or cardinality(normalized_interest_ids) > 5
    or cardinality(normalized_interest_ids) <> (
      select count(distinct selected_id)
      from unnest(normalized_interest_ids) as selected_id
    ) then
    raise exception 'Choose between 1 and 5 unique project interests'
      using errcode = '23514';
  end if;
  if exists (
    select 1
    from unnest(normalized_interest_ids) as selected_id
    left join public.interests on interests.id = selected_id
    where interests.id is null
      or interests.name not in (
        'AI Agents',
        'Computer Vision',
        'Natural Language Processing',
        'Robotics',
        'Autonomous Systems',
        'Drones',
        'Smart Devices / IoT',
        'AI for Education',
        'AI for Healthcare',
        'AI for Finance',
        'AI for Science',
        'Research Projects',
        'Startup / Product Building',
        'Open Source',
        'Hackathons',
        'Automation',
        'Data Products',
        'Human-AI Interaction',
        'Hardware + AI',
        'Simulation'
      )
  ) then
    raise exception 'Unsupported project interest' using errcode = '23514';
  end if;
  if cardinality(normalized_preferences) < 1
    or not app_private.valid_contribution_preferences(normalized_preferences) then
    raise exception 'Choose between 1 and 5 unique contribution preferences'
      using errcode = '23514';
  end if;

  insert into public.profiles(
    id,
    username,
    full_name,
    bio,
    academic_year,
    academic_direction,
    desired_role,
    contribution_preferences,
    available_for_projects,
    open_to_collaboration,
    profile_visibility,
    onboarding_completed
  ) values (
    current_user_id,
    profile_username,
    profile_full_name,
    profile_bio,
    1,
    profile_academic_direction,
    profile_desired_role,
    normalized_preferences,
    true,
    true,
    'campus',
    true
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    bio = excluded.bio,
    academic_year = 1,
    academic_direction = excluded.academic_direction,
    desired_role = excluded.desired_role,
    contribution_preferences = excluded.contribution_preferences,
    available_for_projects = true,
    open_to_collaboration = true,
    profile_visibility = 'campus',
    onboarding_completed = true
  returning * into saved_profile;

  delete from public.profile_interests where profile_id = current_user_id;
  insert into public.profile_interests(profile_id, interest_id)
  select current_user_id, selected_id
  from unnest(normalized_interest_ids) as selected_id;

  return saved_profile;
end;
$$;

revoke all on function public.complete_my_onboarding(
  text, text, text, text, text, text[], uuid[]
) from public, anon;
grant execute on function public.complete_my_onboarding(
  text, text, text, text, text, text[], uuid[]
) to authenticated;
