begin;

create extension if not exists pgtap with schema extensions;

select plan(35);

-- Two existing fixture accounts are used only inside this transaction. Every
-- mutation below is rolled back, so the test is safe against the linked
-- development project as well as a local Supabase stack.
select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);

insert into public.resources(
  id, author_id, title, description, type, category, tags, external_url
) values (
  'f3000000-0000-4000-8000-000000000101',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  'Phase 3 security resource',
  'Transactional security-test fixture',
  'link',
  'Security',
  array['security'],
  'https://example.com/security'
);
insert into public.resource_saves(resource_id, user_id) values (
  'f3000000-0000-4000-8000-000000000101',
  '951a1a1b-c173-4b21-8ee7-3700899addb7'
);
insert into public.posts(id, author_id, content, tags) values (
  'f3000000-0000-4000-8000-000000000102',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  'Phase 3 security post fixture',
  array['security']
);

select set_config(
  'request.jwt.claim.sub',
  '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
  true
);
insert into public.comments(id, post_id, author_id, body) values (
  'f3000000-0000-4000-8000-000000000103',
  'f3000000-0000-4000-8000-000000000102',
  '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
  'Cross-account delete fixture'
);

select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);
insert into public.events(
  id, slug, title, description, category, starts_at, ends_at,
  location, capacity, organizer_id
) values (
  'f3000000-0000-4000-8000-000000000104',
  'phase-3-security-event',
  'Phase 3 security event',
  'Transactional capacity fixture',
  'Security',
  now() + interval '1 day',
  now() + interval '2 days',
  'QAIRU',
  1,
  '951a1a1b-c173-4b21-8ee7-3700899addb7'
);
insert into public.event_attendees(event_id, profile_id) values (
  'f3000000-0000-4000-8000-000000000104',
  '951a1a1b-c173-4b21-8ee7-3700899addb7'
);
insert into public.notifications(
  id, recipient_id, actor_id, type, entity_type, entity_id,
  dedupe_key, payload
) values (
  'f3000000-0000-4000-8000-000000000105',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
  'post_comment',
  'post',
  'f3000000-0000-4000-8000-000000000102',
  'phase3:security:notification',
  '{}'::jsonb
);
insert into public.user_roles(user_id, role) values (
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  'admin'
) on conflict do nothing;
insert into public.communities(
  id, slug, name, category, description, status, creator_id
) values (
  'f3000000-0000-4000-8000-000000000106',
  'phase-3-security-community',
  'Phase 3 security community',
  'Security',
  'Transactional role-escalation fixture',
  'forming',
  '951a1a1b-c173-4b21-8ee7-3700899addb7'
);
insert into app_private.write_rate_limits(
  user_id, action, window_started_at, request_count, updated_at
) values (
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  'posts',
  now(),
  20,
  now()
) on conflict (user_id, action) do update set
  window_started_at = excluded.window_started_at,
  request_count = excluded.request_count,
  updated_at = excluded.updated_at;

select is(
  (
    select count(*)
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p')
      and not relation.relrowsecurity
  ),
  0::bigint,
  'every public table has RLS enabled'
);
select is(
  (
    select array_agg(tablename order by tablename)
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
  ),
  array['conversation_members', 'messages', 'notifications']::name[],
  'Realtime publication contains only scoped private activity tables'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'app_private.write_rate_limits',
    'SELECT'
  ),
  'authenticated callers cannot inspect quota state'
);
select ok(
  not has_column_privilege(
    'authenticated', 'public.posts', 'created_at', 'INSERT'
  ),
  'authenticated callers cannot forge post timestamps'
);
select ok(
  not has_column_privilege(
    'authenticated', 'public.resources', 'storage_object_path', 'INSERT'
  ),
  'Storage paths are not writable while Storage is disabled'
);
select is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'resource_saves'
      and policyname = 'Users read own resource saves'
  ),
  1::bigint,
  'resource save identities use an owner-only read policy'
);

set local role anon;
select throws_ok(
  $$select * from public.profiles limit 1$$,
  '42501',
  null,
  'anonymous callers cannot read profiles'
);
select throws_ok(
  $$select public.save_my_profile(
    'anon-test', 'Anon Test', '', null, 1::smallint, false, false,
    'private', false, '{}'::uuid[], '{}'::uuid[]
  )$$,
  '42501',
  null,
  'anonymous callers cannot invoke profile writes'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);
select is(
  (select count(*) from public.resource_saves),
  1::bigint,
  'account A can read its own resource save'
);
select ok(
  (
    select save_count = 1 and saved_by_current_user
    from public.resource_items
    where id = 'f3000000-0000-4000-8000-000000000101'
  ),
  'account A sees the aggregate and its own saved state'
);
update public.profiles
set full_name = 'Cross-account overwrite'
where id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8';
select ok(
  not exists (
    select 1 from public.profiles
    where id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
      and full_name = 'Cross-account overwrite'
  ),
  'account A cannot update account B profile'
);
delete from public.comments
where id = 'f3000000-0000-4000-8000-000000000103';
select ok(
  exists (
    select 1 from public.comments
    where id = 'f3000000-0000-4000-8000-000000000103'
  ),
  'account A cannot delete account B comment'
);
select throws_ok(
  $$insert into public.posts(author_id, content, tags, created_at)
    values (
      '951a1a1b-c173-4b21-8ee7-3700899addb7',
      'Forged time', '{}', '2000-01-01'
    )$$,
  '42501',
  null,
  'direct callers cannot mass-assign post timestamps'
);
select throws_ok(
  $$insert into public.resources(
      author_id, title, description, type, category, tags,
      external_url, storage_object_path
    ) values (
      '951a1a1b-c173-4b21-8ee7-3700899addb7', 'Storage bypass',
      'Attempt to bypass disabled Storage', 'document', 'Security', '{}',
      'https://example.com', 'other-user/private-object'
    )$$,
  '42501',
  null,
  'direct callers cannot mass-assign Storage object paths'
);
select throws_ok(
  $$insert into public.resources(
      author_id, title, description, type, category, tags, external_url
    ) values (
      '951a1a1b-c173-4b21-8ee7-3700899addb7', 'Unsafe URL',
      'Attempt to share an unsafe scheme', 'link', 'Security', '{}',
      'javascript:alert(1)'
    )$$,
  '23514',
  null,
  'database rejects active-content resource URLs'
);
select throws_ok(
  $$insert into public.resources(
      author_id, title, description, type, category, tags, external_url
    ) values (
      '951a1a1b-c173-4b21-8ee7-3700899addb7', 'Unsafe tag',
      'Attempt to submit a non-normalized tag', 'link', 'Security',
      array[' padded'], 'https://example.com'
    )$$,
  '23514',
  null,
  'database rejects non-normalized tags'
);
select throws_ok(
  $$insert into public.posts(author_id, content, tags) values (
    '951a1a1b-c173-4b21-8ee7-3700899addb7',
    'Write quota bypass attempt',
    '{}'
  )$$,
  'P0001',
  null,
  'database rate limit rejects writes after the action quota'
);
select throws_ok(
  $$select public.create_project(
    'phase3-array-abuse', 'Array abuse', 'Bounded project creation',
    'Tests a bounded project child-row fanout', 'Security', 'idea',
    array_fill('technology'::text, array[21]), array['Reviewer']
  )$$,
  '23514',
  null,
  'project RPC rejects oversized child arrays'
);
select is(
  public.get_or_create_direct_conversation(
    '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
  ),
  public.get_or_create_direct_conversation(
    '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
  ),
  'direct-conversation creation is idempotent'
);
select is(
  (
    select count(*)
    from public.conversation_members member
    join public.conversations conversation
      on conversation.id = member.conversation_id
    where conversation.direct_user_low = least(
      '951a1a1b-c173-4b21-8ee7-3700899addb7'::uuid,
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8'::uuid
    )
      and conversation.direct_user_high = greatest(
        '951a1a1b-c173-4b21-8ee7-3700899addb7'::uuid,
        '100d348d-3d27-48ff-882d-f8c4bc86a7d8'::uuid
      )
  ),
  2::bigint,
  'a direct conversation has exactly two members'
);
select ok(
  (
    select sender_id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
      and recipient_id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
    from public.send_message(
      public.get_or_create_direct_conversation(
        '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
      ),
      'phase3 security test from account A'
    )
  ),
  'message RPC derives account A sender and recipient identities'
);
select throws_ok(
  $$insert into public.notifications(
    recipient_id, actor_id, type, entity_type, entity_id, dedupe_key
  ) values (
    '951a1a1b-c173-4b21-8ee7-3700899addb7',
    '951a1a1b-c173-4b21-8ee7-3700899addb7',
    'new_follower', 'profile',
    '951a1a1b-c173-4b21-8ee7-3700899addb7', 'forged'
  )$$,
  '42501',
  null,
  'authenticated callers cannot forge notifications'
);

select set_config(
  'request.jwt.claim.sub',
  '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
  true
);
select is(
  (select count(*) from public.resource_saves),
  0::bigint,
  'account B cannot read account A resource save identity'
);
select ok(
  (
    select save_count = 1 and not saved_by_current_user
    from public.resource_items
    where id = 'f3000000-0000-4000-8000-000000000101'
  ),
  'account B sees only aggregate resource-save state'
);
select is(
  (
    select count(*) from public.user_roles
    where user_id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
  ),
  0::bigint,
  'account B cannot read account A roles'
);
select throws_ok(
  $$update public.user_roles set role = 'admin'
    where user_id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8'$$,
  '42501',
  null,
  'account B cannot elevate its role'
);
select throws_ok(
  $$insert into public.community_members(community_id, profile_id, role)
    values (
      'f3000000-0000-4000-8000-000000000106',
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8',
      'owner'
    )$$,
  '42501',
  null,
  'account B cannot self-assign a community owner role'
);
select is(
  (
    select count(*) from public.notifications
    where id = 'f3000000-0000-4000-8000-000000000105'
  ),
  0::bigint,
  'account B cannot read account A notification'
);
select throws_ok(
  $$insert into public.event_attendees(event_id, profile_id) values (
    'f3000000-0000-4000-8000-000000000104',
    '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
  )$$,
  '23514',
  null,
  'event capacity is enforced at the database boundary'
);
select ok(
  exists (
    select 1 from public.messages
    where body = 'phase3 security test from account A'
      and recipient_id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
  ),
  'account B can receive account A message'
);
select ok(
  (
    select sender_id = '100d348d-3d27-48ff-882d-f8c4bc86a7d8'
      and recipient_id = '951a1a1b-c173-4b21-8ee7-3700899addb7'
    from public.send_message(
      public.get_or_create_direct_conversation(
        '951a1a1b-c173-4b21-8ee7-3700899addb7'
      ),
      'phase3 security test from account B'
    )
  ),
  'message RPC derives account B sender and recipient identities'
);

select set_config(
  'request.jwt.claim.sub',
  'f3000000-0000-4000-8000-000000000199',
  true
);
select is(
  (
    select count(*) from public.conversations
    where direct_user_low = least(
      '951a1a1b-c173-4b21-8ee7-3700899addb7'::uuid,
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8'::uuid
    ) and direct_user_high = greatest(
      '951a1a1b-c173-4b21-8ee7-3700899addb7'::uuid,
      '100d348d-3d27-48ff-882d-f8c4bc86a7d8'::uuid
    )
  ),
  0::bigint,
  'a nonparticipant cannot read the direct conversation'
);
select is(
  (
    select count(*) from public.messages
    where body like 'phase3 security test from account %'
  ),
  0::bigint,
  'a nonparticipant cannot read direct messages'
);

reset role;
select ok(
  not has_function_privilege(
    'public',
    'app_private.get_or_create_direct_conversation(uuid)',
    'EXECUTE'
  ),
  'PUBLIC cannot execute the private conversation helper'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '951a1a1b-c173-4b21-8ee7-3700899addb7',
  true
);
select throws_ok(
  $$select public.get_or_create_direct_conversation(
    '951a1a1b-c173-4b21-8ee7-3700899addb7'
  )$$,
  '23514',
  null,
  'self-directed conversations are rejected'
);

reset role;
select * from finish();
rollback;
