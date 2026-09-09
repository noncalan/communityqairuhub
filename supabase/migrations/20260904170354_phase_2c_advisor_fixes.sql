create index conversations_direct_user_high_idx
  on public.conversations(direct_user_high);

create or replace function app_private.is_conversation_member(
  target_conversation_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.conversation_members
      where conversation_id = target_conversation_id
        and user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.conversation_members
      where conversation_id = target_conversation_id
        and user_id = target_user_id
    );
$$;
