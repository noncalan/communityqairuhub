begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

select ok(
  (
    select count(*) = 2
    from public.profiles
    where id in (
      '951a1a1b-c173-4b21-8ee7-3700899addb7',
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
    )
  ),
  'the two standard development profile fixtures are available'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);

select lives_ok(
  $$select public.create_project(
    'team-finder-open-project',
    'Team Finder Open Project',
    'A transaction-only project with discoverable roles.',
    'This project validates the existing application and membership model.',
    'Testing',
    'building',
    array['TypeScript', 'Postgres'],
    array['Builder', 'Designer', 'Researcher']
  )$$,
  'an authenticated project owner can create the finder fixture'
);

select lives_ok(
  $$select public.create_project(
    'team-finder-completed-project',
    'Team Finder Completed Project',
    'A completed project excluded from actionable discovery.',
    'This completed project keeps an open role to verify finder filtering.',
    'Testing',
    'completed',
    array['Postgres'],
    array['Historian']
  )$$,
  'a completed project fixture can retain a role for filtering coverage'
);

update public.project_roles
set is_open = false
where project_id = (
  select id from public.projects where slug = 'team-finder-open-project'
)
and title = 'Designer';

select is(
  (
    select count(*)
    from public.project_roles role
    join public.projects project on project.id = role.project_id
    where role.is_open
      and project.status <> 'completed'
      and project.slug like 'team-finder-%'
  ),
  2::bigint,
  'finder discovery includes only open roles on non-completed projects'
);

select ok(
  exists (
    select 1 from public.project_members member
    join public.projects project on project.id = member.project_id
    where project.slug = 'team-finder-open-project'
      and member.profile_id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
      and member.role_title = 'Owner'
      and member.can_edit
  ),
  'project creation gives Account A owner membership'
);

reset role;
set local role anon;
select throws_ok(
  $$insert into public.project_applications(
      project_id, project_role_id, applicant_id, message
    ) select
      project.id, role.id,
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
      'Anonymous callers must not be able to apply.'
    from public.projects project
    join public.project_roles role on role.project_id = project.id
    where project.slug = 'team-finder-open-project'
      and role.title = 'Builder'$$,
  '42501',
  null,
  'anonymous users cannot apply'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
  true
);

select throws_ok(
  $$insert into public.project_applications(
      project_id, project_role_id, applicant_id, message
    ) select
      project.id, role.id,
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
      'Closed roles must not accept applications.'
    from public.projects project
    join public.project_roles role on role.project_id = project.id
    where project.slug = 'team-finder-open-project'
      and role.title = 'Designer'$$,
  '42501',
  null,
  'closed roles reject applications at the RLS boundary'
);

select lives_ok(
  $$insert into public.project_applications(
      project_id, project_role_id, applicant_id, message
    ) select
      project.id, role.id,
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
      'Account B can contribute to the TypeScript application.'
    from public.projects project
    join public.project_roles role on role.project_id = project.id
    where project.slug = 'team-finder-open-project'
      and role.title = 'Builder'$$,
  'Account B can apply to an open role as itself'
);

select is(
  (
    select status
    from public.project_applications application
    join public.projects project on project.id = application.project_id
    where project.slug = 'team-finder-open-project'
      and application.applicant_id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
  ),
  'pending'::public.application_status,
  'Account B reads its pending application state'
);

select throws_ok(
  $$insert into public.project_applications(
      project_id, project_role_id, applicant_id, message
    ) select
      project.id, role.id,
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
      'A second pending application must be rejected.'
    from public.projects project
    join public.project_roles role on role.project_id = project.id
    where project.slug = 'team-finder-open-project'
      and role.title = 'Researcher'$$,
  '23505',
  null,
  'the partial unique index prevents duplicate pending applications'
);

select throws_ok(
  $$insert into public.project_applications(
      project_id, project_role_id, applicant_id, message
    ) select
      project.id, role.id,
      '951a1a1b-c173-4b21-8ee7-3700899addb7',
      'Account B must not apply as Account A.'
    from public.projects project
    join public.project_roles role on role.project_id = project.id
    where project.slug = 'team-finder-open-project'
      and role.title = 'Researcher'$$,
  '42501',
  null,
  'a user cannot apply as another profile'
);

select throws_ok(
  $$update public.project_applications
    set status = 'accepted'
    where project_id = (
      select id from public.projects where slug = 'team-finder-open-project'
    )$$,
  '42501',
  null,
  'an applicant cannot review its own application'
);

select throws_ok(
  $$insert into public.project_members(project_id, profile_id, role_title)
    select id, '100d348d-3d27-48ff-882d-f8c4bc86a7d8', 'Forged member'
    from public.projects where slug = 'team-finder-open-project'$$,
  '42501',
  null,
  'project membership cannot be forged by an authenticated client'
);

select set_config(
  'request.jwt.claim.sub',
  'f3000000-0000-4000-8000-000000000199',
  true
);
update public.project_applications
set status = 'accepted'
where project_id = (
  select id from public.projects where slug = 'team-finder-open-project'
);

reset role;
select is(
  (
    select status
    from public.project_applications application
    join public.projects project on project.id = application.project_id
    where project.slug = 'team-finder-open-project'
  ),
  'pending'::public.application_status,
  'an unrelated authenticated user cannot review project applications'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);
select lives_ok(
  $$update public.project_applications
    set status = 'accepted'
    where project_id = (
      select id from public.projects where slug = 'team-finder-open-project'
    )$$,
  'the project owner can accept Account B through the existing review path'
);

select ok(
  exists (
    select 1 from public.project_members member
    join public.projects project on project.id = member.project_id
    where project.slug = 'team-finder-open-project'
      and member.profile_id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
      and member.role_title = 'Builder'
  ),
  'acceptance adds Account B to project membership'
);

select set_config(
  'request.jwt.claim.sub',
  '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
  true
);
select throws_ok(
  $$insert into public.project_applications(
      project_id, project_role_id, applicant_id, message
    ) select
      project.id, role.id,
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
      'Existing members must not submit another application.'
    from public.projects project
    join public.project_roles role on role.project_id = project.id
    where project.slug = 'team-finder-open-project'
      and role.title = 'Researcher'$$,
  '42501',
  null,
  'an accepted member cannot apply again'
);

reset role;
select throws_ok(
  $$insert into public.project_members(project_id, profile_id, role_title)
    select id, '100d348d-3d27-48ff-882d-f8c4bc86a7d8', 'Duplicate member'
    from public.projects where slug = 'team-finder-open-project'$$,
  '23505',
  null,
  'the project membership primary key prevents duplicate membership'
);

update public.profiles
set profile_visibility = 'private'
where id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);
select is(
  (
    select count(*)
    from public.profiles
    where id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
  ),
  0::bigint,
  'Find People cannot read another user private profile'
);

reset role;
select is(
  (
    select count(*)
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'profiles', 'project_roles', 'project_applications', 'project_members'
      )
      and relation.relrowsecurity
  ),
  4::bigint,
  'RLS remains enabled on every Team Finder source table'
);

select * from finish();
rollback;
