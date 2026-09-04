begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);

select is(
  public.create_university_club(
    'prototype-active-club', 'Prototype Active Club',
    'A public active club used by the prototype authorization test.',
    'This active club exists only inside the rolled-back pgTAP transaction.',
    'Technology', null, 'Prototype Leader', 'prototype@qairu.edu.kz',
    'active', 'https://t.me/qairu_proto', 'qairu_proto', '-1001234567890'
  ),
  'prototype-active-club',
  'an authenticated organizer can create a club atomically'
);

select is(
  public.create_university_club(
    'prototype-inactive-club', 'Prototype Inactive Club',
    'An inactive draft excluded from every public club read path.',
    'This inactive club exists only inside the rolled-back pgTAP transaction.',
    'Research', null, 'Prototype Leader', null,
    'forming', null, null, null
  ),
  'prototype-inactive-club',
  'an organizer can create an inactive draft'
);

select throws_ok(
  $$select public.create_university_club(
    'prototype-active-club', 'Duplicate Prototype Club',
    'A duplicate slug must fail at the database boundary for every client.',
    'Duplicate slug behavior is verified without relying on UI validation.',
    'Technology', null, 'Prototype Leader', null,
    'active', null, null, null
  )$$,
  '23505',
  null,
  'duplicate club slugs are rejected'
);

select throws_ok(
  $$select public.create_university_club(
    'prototype-invalid-telegram', 'Invalid Telegram Club',
    'A malformed Telegram URL must fail inside the atomic database operation.',
    'The invalid integration must roll back the club insert in the same statement.',
    'Technology', null, 'Prototype Leader', null,
    'active', 'https://evil.example/group', null, null
  )$$,
  '23514',
  null,
  'invalid Telegram URLs are rejected at the database boundary'
);

select is(
  (select count(*) from public.communities where slug = 'prototype-invalid-telegram'),
  0::bigint,
  'failed integration creation leaves no partial club record'
);

reset role;
set local role anon;

select is(
  (select count(*) from public.public_clubs where slug = 'prototype-active-club'),
  1::bigint,
  'anonymous visitors can read an active club'
);

select is(
  (select count(*) from public.public_clubs where slug = 'prototype-inactive-club'),
  0::bigint,
  'anonymous visitors cannot read an inactive club'
);

reset role;
select ok(
  not has_table_privilege('anon', 'public.club_telegram_connections', 'SELECT'),
  'anonymous visitors cannot read private Telegram chat IDs'
);
select hasnt_column(
  'public',
  'public_clubs',
  'telegram_chat_id',
  'the public directory view does not expose Telegram chat IDs'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.update_university_club(uuid,text,text,text,text,text,text,text,text,public.community_status,text,text,text)',
    'EXECUTE'
  ),
  'anonymous visitors cannot execute the club update RPC'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
  true
);
select throws_ok(
  format(
    'select public.update_university_club(%L, %L, %L, %L, %L, %L, null, %L, null, %L, %L, %L, null)',
    (select id from public.communities where slug = 'prototype-active-club'),
    'prototype-active-club', 'Unauthorized edit',
    'An unauthorized edit must be denied by RLS.',
    'An unauthorized edit must never change this active club record.',
    'Technology', 'Wrong Leader', 'active',
    'https://t.me/qairu_proto', 'qairu_proto'
  ),
  '42501',
  null,
  'a different authenticated user cannot edit the club'
);

select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);
select is(
  public.update_university_club(
    (select id from public.communities where slug = 'prototype-active-club'),
    'prototype-active-club', 'Prototype Active Club Updated',
    'The authorized owner can update the shared club record safely.',
    'The website and bot both observe this updated active club description.',
    'Technology', null, 'Prototype Leader', 'prototype@qairu.edu.kz',
    'active', 'https://t.me/qairu_proto', 'qairu_proto', '-1001234567890'
  ),
  'prototype-active-club',
  'the owner can edit the club'
);

select * from finish();
rollback;
