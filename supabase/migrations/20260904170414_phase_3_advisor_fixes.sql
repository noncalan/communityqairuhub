-- Make the private quota table's deny-all RLS posture explicit so automated
-- checks can distinguish it from an accidentally policy-free public table.
drop policy if exists "Deny API access to write quotas"
  on app_private.write_rate_limits;
create policy "Deny API access to write quotas"
on app_private.write_rate_limits for all to anon, authenticated
using (false)
with check (false);
