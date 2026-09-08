begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

insert into public.communities(
  id, slug, name, category, description, status, creator_id
) values (
  'c0000000-0000-4000-8000-000000000001',
  'core-api-test-community', 'Core API Test Community', 'Testing',
  'A transaction-only fixture for Core API ownership.', 'forming',
  '951a1a1b-c173-4b21-8ee7-3700899addb7'
);

select ok(
  exists (
    select 1 from public.community_members
    where community_id = 'c0000000-0000-4000-8000-000000000001'
      and profile_id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
      and role = 'owner'
  ),
  'service role community creation retains automatic owner membership'
);

insert into public.projects(
  id, slug, name, tagline, description, category, status, creator_id
) values (
  'c0000000-0000-4000-8000-000000000002',
  'core-api-test-project', 'Core API Test Project',
  'A transaction-only Core API fixture',
  'A transaction-only fixture for Core API project ownership.',
  'Testing', 'idea', '951a1a1b-c173-4b21-8ee7-3700899addb7'
);

select ok(
  exists (
    select 1 from public.project_members
    where project_id = 'c0000000-0000-4000-8000-000000000002'
      and profile_id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
      and role_title = 'Owner'
      and can_edit
  ),
  'service role project creation retains automatic owner membership'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"100d348d-3d27-48ff-882d-f8c4bc86a7d8"}',
  true
);

select throws_ok(
  $$insert into public.communities(slug, name, category, description, creator_id)
    values (
      'core-api-owner-forgery', 'Core owner forgery', 'Testing',
      'An authenticated caller must not forge another community owner.',
      '951a1a1b-c173-4b21-8ee7-3700899addb7'
    )$$,
  '42501',
  null,
  'authenticated users still cannot forge community ownership'
);

select throws_ok(
  $$insert into public.projects(
      slug, name, tagline, description, category, creator_id
    ) values (
      'core-api-project-forgery', 'Core project forgery',
      'A forbidden project ownership attempt',
      'An authenticated caller must not forge another project owner.',
      'Testing', '951a1a1b-c173-4b21-8ee7-3700899addb7'
    )$$,
  '42501',
  null,
  'authenticated users still cannot forge project ownership'
);

reset role;
select ok(
  not has_function_privilege('anon', 'app_private.add_community_owner()', 'EXECUTE'),
  'anonymous callers cannot execute the community owner trigger function'
);
select ok(
  not has_function_privilege('authenticated', 'app_private.add_project_owner()', 'EXECUTE'),
  'authenticated callers cannot execute the project owner trigger function'
);

select * from finish();
rollback;
