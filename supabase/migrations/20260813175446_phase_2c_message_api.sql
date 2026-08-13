create function public.send_message(
  target_conversation_id uuid,
  message_body text
)
returns public.messages
language plpgsql
security invoker
set search_path = ''
as $$
declare
  sent_message public.messages;
begin
  insert into public.messages(conversation_id, body)
  values (target_conversation_id, btrim(message_body))
  returning * into sent_message;
  return sent_message;
end;
$$;

revoke all on function public.send_message(uuid, text) from public, anon;
grant execute on function public.send_message(uuid, text) to authenticated;
