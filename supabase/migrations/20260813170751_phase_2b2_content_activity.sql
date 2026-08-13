create type public.resource_type as enum (
  'guide',
  'notes',
  'repository',
  'link',
  'document'
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 4 and 5000),
  community_id uuid references public.communities(id) on delete cascade,
  tags text[] not null default '{}'::text[] check (cardinality(tags) <= 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text not null check (char_length(btrim(description)) between 8 and 4000),
  type public.resource_type not null,
  category text not null check (char_length(btrim(category)) between 2 and 80),
  tags text[] not null default '{}'::text[] check (cardinality(tags) <= 12),
  external_url text check (
    external_url is null
    or external_url ~* '^https?://[^[:space:]]+$'
  ),
  storage_object_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (external_url is not null or storage_object_path is not null)
);

create table public.resource_saves (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

create index posts_author_created_idx on public.posts(author_id, created_at desc);
create index posts_community_created_idx on public.posts(community_id, created_at desc)
  where community_id is not null;
create index posts_created_idx on public.posts(created_at desc, id desc);
create index comments_post_created_idx on public.comments(post_id, created_at);
create index comments_author_idx on public.comments(author_id);
create index post_bookmarks_post_idx on public.post_bookmarks(post_id);
create index resources_author_created_idx on public.resources(author_id, created_at desc);
create index resources_created_idx on public.resources(created_at desc, id desc);
create index resource_saves_user_idx on public.resource_saves(user_id, created_at desc);

create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create trigger set_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_bookmarks enable row level security;
alter table public.resources enable row level security;
alter table public.resource_saves enable row level security;

revoke all privileges on table public.posts, public.comments, public.post_likes,
  public.post_bookmarks, public.resources, public.resource_saves
  from public, anon, authenticated;

grant select, insert, update, delete on table public.posts to authenticated;
grant select, insert, delete on table public.comments, public.post_likes,
  public.post_bookmarks, public.resource_saves to authenticated;
grant select, insert, update, delete on table public.resources to authenticated;

create policy "Authenticated users read posts"
on public.posts for select to authenticated
using (true);

create policy "Users create campus posts as themselves"
on public.posts for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (
    community_id is null
    or exists (
      select 1
      from public.community_members
      where community_members.community_id = posts.community_id
        and community_members.profile_id = (select auth.uid())
    )
  )
);

create policy "Authors update own posts"
on public.posts for update to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and (
    community_id is null
    or exists (
      select 1
      from public.community_members
      where community_members.community_id = posts.community_id
        and community_members.profile_id = (select auth.uid())
    )
  )
);

create policy "Authors delete own posts"
on public.posts for delete to authenticated
using (author_id = (select auth.uid()));

create policy "Authenticated users read comments"
on public.comments for select to authenticated
using (true);

create policy "Users comment as themselves"
on public.comments for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (select 1 from public.posts where posts.id = comments.post_id)
);

create policy "Authors delete own comments"
on public.comments for delete to authenticated
using (author_id = (select auth.uid()));

create policy "Authenticated users read post likes"
on public.post_likes for select to authenticated
using (true);

create policy "Users like posts as themselves"
on public.post_likes for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.posts where posts.id = post_likes.post_id)
);

create policy "Users remove own post likes"
on public.post_likes for delete to authenticated
using (user_id = (select auth.uid()));

create policy "Users read own post bookmarks"
on public.post_bookmarks for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users bookmark posts as themselves"
on public.post_bookmarks for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.posts where posts.id = post_bookmarks.post_id)
);

create policy "Users remove own post bookmarks"
on public.post_bookmarks for delete to authenticated
using (user_id = (select auth.uid()));

create policy "Authenticated users read resources"
on public.resources for select to authenticated
using (true);

create policy "Users create resources as themselves"
on public.resources for insert to authenticated
with check (author_id = (select auth.uid()));

create policy "Authors update own resources"
on public.resources for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

create policy "Authors delete own resources"
on public.resources for delete to authenticated
using (author_id = (select auth.uid()));

create policy "Authenticated users read resource saves"
on public.resource_saves for select to authenticated
using (true);

create policy "Users save resources as themselves"
on public.resource_saves for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.resources where resources.id = resource_saves.resource_id)
);

create policy "Users remove own resource saves"
on public.resource_saves for delete to authenticated
using (user_id = (select auth.uid()));

create view public.post_feed_items
with (security_invoker = true)
as
select
  posts.id,
  posts.author_id,
  profiles.username as author_username,
  profiles.full_name as author_full_name,
  profiles.avatar_url as author_avatar_url,
  posts.content,
  posts.community_id,
  communities.slug as community_slug,
  communities.name as community_name,
  posts.tags,
  posts.created_at,
  posts.updated_at,
  (select count(*) from public.post_likes where post_likes.post_id = posts.id) as like_count,
  (select count(*) from public.comments where comments.post_id = posts.id) as comment_count,
  exists (
    select 1 from public.post_likes
    where post_likes.post_id = posts.id
      and post_likes.user_id = (select auth.uid())
  ) as liked_by_current_user,
  exists (
    select 1 from public.post_bookmarks
    where post_bookmarks.post_id = posts.id
      and post_bookmarks.user_id = (select auth.uid())
  ) as bookmarked_by_current_user
from public.posts
join public.profiles on profiles.id = posts.author_id
left join public.communities on communities.id = posts.community_id;

create view public.resource_items
with (security_invoker = true)
as
select
  resources.id,
  resources.author_id,
  profiles.username as author_username,
  profiles.full_name as author_full_name,
  profiles.avatar_url as author_avatar_url,
  resources.title,
  resources.description,
  resources.type,
  resources.category,
  resources.tags,
  resources.external_url,
  resources.storage_object_path,
  resources.created_at,
  resources.updated_at,
  (select count(*) from public.resource_saves where resource_saves.resource_id = resources.id) as save_count,
  exists (
    select 1 from public.resource_saves
    where resource_saves.resource_id = resources.id
      and resource_saves.user_id = (select auth.uid())
  ) as saved_by_current_user
from public.resources
join public.profiles on profiles.id = resources.author_id;

revoke all privileges on table public.post_feed_items, public.resource_items
  from public, anon, authenticated;
grant select on table public.post_feed_items, public.resource_items to authenticated;
