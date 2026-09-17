-- Personal archive: clean initial schema for a new Supabase project.

begin;

create extension if not exists pgcrypto;

create table public.site_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_site_owner(check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select check_user_id is not null
    and exists (select 1 from public.site_owners where user_id = check_user_id);
$$;
revoke all on function public.is_site_owner(uuid) from public;
grant execute on function public.is_site_owner(uuid) to authenticated;

create table public.site_settings (
  id boolean primary key default true check (id = true),
  site_title text not null default '我的记录' check (char_length(site_title) between 1 and 60),
  site_description text not null default '记录生活、照片与影像的个人小站' check (char_length(site_description) between 1 and 160),
  home_intro text not null default '在这里，我慢慢记录生活里的光——一些照片、一些影像，和一些想留住的心情。' check (char_length(home_intro) between 1 and 300),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (true);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null default 'article' check (kind in ('article', 'note', 'photo_story', 'video', 'year_review')),
  title text not null check (char_length(title) between 1 and 200),
  excerpt text not null default '' check (char_length(excerpt) <= 500),
  content_markdown text not null default '',
  occurred_at date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'public' check (visibility in ('public', 'unlisted')),
  cover_url text not null default '',
  location text not null default '',
  mood text not null default '',
  is_pinned boolean not null default false,
  owner_id uuid references auth.users(id) on delete set null default auth.uid(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint entries_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
create index entries_public_timeline_idx on public.entries (is_pinned desc, occurred_at desc)
where status = 'published' and visibility = 'public' and deleted_at is null;

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 50),
  created_at timestamptz not null default now()
);

create table public.entry_tags (
  entry_id uuid not null references public.entries(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'video')),
  storage_path text not null unique,
  public_url text not null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  caption text not null default '' check (char_length(caption) <= 500),
  captured_at date,
  location text not null default '' check (char_length(location) <= 200),
  purpose text not null default 'gallery' check (purpose in ('gallery', 'article')),
  owner_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index media_gallery_timeline_idx on public.media (captured_at desc nulls last, created_at desc)
where purpose = 'gallery';

create table public.entry_revisions (
  id bigint generated always as identity primary key,
  entry_id uuid not null references public.entries(id) on delete cascade,
  snapshot jsonb not null,
  snapshot_at timestamptz not null default now(),
  snapshot_by uuid references auth.users(id) on delete set null default auth.uid()
);
create index entry_revisions_entry_idx on public.entry_revisions (entry_id, snapshot_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.capture_entry_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_tags jsonb;
begin
  if row(old.title, old.slug, old.kind, old.excerpt, old.content_markdown, old.occurred_at,
         old.cover_url, old.location, old.mood, old.status, old.visibility, old.is_pinned)
     is distinct from
     row(new.title, new.slug, new.kind, new.excerpt, new.content_markdown, new.occurred_at,
         new.cover_url, new.location, new.mood, new.status, new.visibility, new.is_pinned) then
    select coalesce(jsonb_agg(t.name order by t.name), '[]'::jsonb) into old_tags
    from public.entry_tags et join public.tags t on t.id = et.tag_id
    where et.entry_id = old.id;
    insert into public.entry_revisions (entry_id, snapshot, snapshot_by)
    values (old.id, jsonb_build_object(
      'title', old.title, 'slug', old.slug, 'kind', old.kind,
      'excerpt', old.excerpt, 'content_markdown', old.content_markdown,
      'occurred_at', old.occurred_at, 'cover_url', old.cover_url,
      'location', old.location, 'mood', old.mood, 'status', old.status,
      'visibility', old.visibility, 'is_pinned', old.is_pinned,
      'published_at', old.published_at, 'tags', old_tags
    ), auth.uid());
  end if;
  return new;
end;
$$;

create trigger entries_set_updated_at before update on public.entries
for each row execute function public.set_updated_at();
create trigger media_set_updated_at before update on public.media
for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();
create trigger entries_capture_revision before update on public.entries
for each row execute function public.capture_entry_revision();

alter table public.site_owners enable row level security;
alter table public.site_settings enable row level security;
alter table public.entries enable row level security;
alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;
alter table public.media enable row level security;
alter table public.entry_revisions enable row level security;

create policy owners_self_read on public.site_owners for select to authenticated using (user_id = auth.uid());
create policy settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy settings_owner_all on public.site_settings for all to authenticated
using ((select public.is_site_owner())) with check ((select public.is_site_owner()));
create policy entries_public_read on public.entries for select to anon, authenticated
using (status = 'published' and visibility in ('public', 'unlisted') and deleted_at is null);
create policy entries_owner_all on public.entries for all to authenticated
using ((select public.is_site_owner())) with check ((select public.is_site_owner()));
create policy tags_public_read on public.tags for select to anon, authenticated using (exists (
  select 1 from public.entry_tags et join public.entries e on e.id = et.entry_id
  where et.tag_id = tags.id and e.status = 'published'
  and e.visibility in ('public', 'unlisted') and e.deleted_at is null
));
create policy tags_owner_all on public.tags for all to authenticated
using ((select public.is_site_owner())) with check ((select public.is_site_owner()));
create policy entry_tags_public_read on public.entry_tags for select to anon, authenticated using (exists (
  select 1 from public.entries e where e.id = entry_tags.entry_id
  and e.status = 'published' and e.visibility in ('public', 'unlisted') and e.deleted_at is null
));
create policy entry_tags_owner_all on public.entry_tags for all to authenticated
using ((select public.is_site_owner())) with check ((select public.is_site_owner()));
create policy media_gallery_read on public.media for select to anon, authenticated using (purpose = 'gallery');
create policy media_owner_all on public.media for all to authenticated
using ((select public.is_site_owner())) with check ((select public.is_site_owner()));
create policy revisions_owner_read on public.entry_revisions for select to authenticated
using ((select public.is_site_owner()));
create policy revisions_owner_insert on public.entry_revisions for insert to authenticated
with check ((select public.is_site_owner()));

grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.entries, public.tags, public.entry_tags, public.media to anon, authenticated;
grant select on public.site_owners to authenticated;
grant insert, update, delete on public.site_settings, public.entries, public.tags, public.entry_tags, public.media to authenticated;
grant select, insert on public.entry_revisions to authenticated;
grant usage, select on sequence public.entry_revisions_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-media', 'public-media', true, 104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm']);
create policy storage_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'public-media' and (select public.is_site_owner()));
create policy storage_owner_update on storage.objects for update to authenticated
using (bucket_id = 'public-media' and (select public.is_site_owner()))
with check (bucket_id = 'public-media' and (select public.is_site_owner()));
create policy storage_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'public-media' and (select public.is_site_owner()));

commit;
