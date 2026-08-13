revoke all privileges on table public.programs, public.interests, public.skills,
  public.profiles, public.user_roles, public.profile_interests, public.profile_skills
  from public, anon, authenticated;

grant select on table public.programs, public.interests, public.skills to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select on table public.user_roles to authenticated;
grant select, insert, delete on table public.profile_interests, public.profile_skills to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;

