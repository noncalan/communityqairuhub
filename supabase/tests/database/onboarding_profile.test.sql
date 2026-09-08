begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

select has_column(
  'public',
  'profiles',
  'academic_direction',
  'profiles store an explicit academic direction'
);
select has_column(
  'public',
  'profiles',
  'desired_role',
  'profiles store a single desired role'
);
select has_column(
  'public',
  'profiles',
  'contribution_preferences',
  'profiles store contribution preferences'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.complete_my_onboarding(text,text,text,text,text,text[],uuid[])',
    'EXECUTE'
  ),
  'anonymous callers cannot execute onboarding writes'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);

select lives_ok(
  $$select public.complete_my_onboarding(
    'onboarding_test_a',
    'Onboarding Test A',
    'Testing the first-year onboarding profile.',
    'machine_learning',
    'machine_learning_engineer',
    array['build_code', 'research'],
    array[
      (select id from public.interests where name = 'AI Agents'),
      (select id from public.interests where name = 'Data Products')
    ]
  )$$,
  'Machine Learning onboarding saves successfully'
);
select ok(
  (
    select academic_year = 1
      and academic_direction = 'machine_learning'
      and desired_role = 'machine_learning_engineer'
      and contribution_preferences = array['build_code', 'research']
      and onboarding_completed
    from public.profiles
    where id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
  ),
  'Machine Learning profile data is persisted and Year 1 is derived'
);
select is(
  (
    select count(*)
    from public.profile_interests
    where profile_id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
  ),
  2::bigint,
  'selected project interests are persisted'
);

select lives_ok(
  $$select public.complete_my_onboarding(
    'onboarding_test_a',
    'Onboarding Test A',
    '',
    'physical_ai',
    'robotics_engineer',
    array['hardware', 'present_demo'],
    array[(select id from public.interests where name = 'Robotics')]
  )$$,
  'Physical AI onboarding saves successfully'
);
select ok(
  (
    select academic_direction = 'physical_ai'
      and desired_role = 'robotics_engineer'
      and contribution_preferences = array['hardware', 'present_demo']
    from public.profiles
    where id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
  ),
  'Physical AI role and contribution data are persisted'
);
select throws_ok(
  $$select public.complete_my_onboarding(
    'onboarding_test_a',
    'Onboarding Test A',
    '',
    'physical_ai',
    'machine_learning_engineer',
    array['build_code'],
    array[(select id from public.interests where name = 'Robotics')]
  )$$,
  '23514',
  null,
  'a role from the other direction is rejected'
);
select throws_ok(
  $$select public.complete_my_onboarding(
    'onboarding_test_a',
    'Onboarding Test A',
    '',
    'machine_learning',
    'ai_researcher',
    array['research'],
    array(
      select id
      from public.interests
      where name in (
        'AI Agents',
        'Computer Vision',
        'Natural Language Processing',
        'AI for Science',
        'Research Projects',
        'Data Products'
      )
    )
  )$$,
  '23514',
  null,
  'more than five project interests are rejected'
);

reset role;
select * from finish();
rollback;
