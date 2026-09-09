-- Cover foreign keys used by ownership and reverse-lookup queries.
create index communities_creator_idx on public.communities (creator_id);
create index projects_creator_idx on public.projects (creator_id);
create index events_organizer_idx on public.events (organizer_id);
create index project_applications_role_project_idx
  on public.project_applications (project_role_id, project_id);
create index project_saves_project_idx on public.project_saves (project_id);
create index event_saves_event_idx on public.event_saves (event_id);

-- One UPDATE policy avoids evaluating two permissive policies per row while
-- preserving the separate applicant-withdraw and owner-review paths.
drop policy "Applicants withdraw pending applications"
  on public.project_applications;
drop policy "Project creators review pending applications"
  on public.project_applications;

create policy "Applicants withdraw or project creators review applications"
on public.project_applications for update to authenticated
using (
  status = 'pending'
  and (
    applicant_id = (select auth.uid())
    or exists (
      select 1 from public.projects
      where id = project_applications.project_id
        and creator_id = (select auth.uid())
    )
  )
)
with check (
  (
    applicant_id = (select auth.uid())
    and status = 'withdrawn'
  )
  or (
    status in ('accepted', 'rejected')
    and exists (
      select 1 from public.projects
      where id = project_applications.project_id
        and creator_id = (select auth.uid())
    )
  )
);
