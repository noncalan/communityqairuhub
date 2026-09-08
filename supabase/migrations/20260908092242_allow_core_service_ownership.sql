-- Core is a trusted server-to-server integration. Keep the existing user/RLS
-- ownership checks intact while allowing the service role to create records
-- for an explicitly validated profile. The owner membership side effects stay
-- in the same transaction as the parent insert.

create or replace function app_private.add_community_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
  if request_role <> 'service_role'
    and (
      (select auth.uid()) is null
      or new.creator_id is distinct from (select auth.uid())
    )
  then
    raise exception 'Community creator must be the authenticated user'
      using errcode = '42501';
  end if;

  insert into public.community_members(community_id, profile_id, role)
  values (new.id, new.creator_id, 'owner');
  return new;
end;
$$;

create or replace function app_private.add_project_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
  if request_role <> 'service_role'
    and (
      (select auth.uid()) is null
      or new.creator_id is distinct from (select auth.uid())
    )
  then
    raise exception 'Project creator must be the authenticated user'
      using errcode = '42501';
  end if;

  insert into public.project_members(project_id, profile_id, role_title, can_edit)
  values (new.id, new.creator_id, 'Owner', true);
  return new;
end;
$$;

revoke all on function app_private.add_community_owner()
  from public, anon, authenticated;
revoke all on function app_private.add_project_owner()
  from public, anon, authenticated;
