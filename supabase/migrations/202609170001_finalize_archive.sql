-- One-time upgrade for projects created with the earlier draft schema.
-- Preserves existing content while removing unused reservations and ambiguous fields.

begin;

do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'private-media') then
    raise exception 'private-media still contains files; remove them in Storage before running this migration';
  end if;
  if exists (select 1 from storage.buckets where id = 'private-media') then
    raise exception 'delete the empty private-media bucket in the Supabase Storage page, then run this migration again';
  end if;
end $$;

drop policy if exists storage_owner_insert on storage.objects;
drop policy if exists storage_owner_update on storage.objects;
drop policy if exists storage_owner_delete on storage.objects;
drop policy if exists storage_owner_private_read on storage.objects;

update public.entries
set status = 'draft', visibility = 'public', published_at = null
where visibility not in ('public', 'unlisted');
alter table public.entries drop constraint if exists entries_visibility_check;
alter table public.entries add constraint entries_visibility_check
check (visibility in ('public', 'unlisted'));

drop table if exists public.album_media cascade;
drop table if exists public.albums cascade;
alter table public.tags drop column if exists slug;

drop policy if exists media_public_read on public.media;
drop policy if exists media_gallery_read on public.media;
drop policy if exists media_owner_all on public.media;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'media' and column_name = 'visibility'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'media' and column_name = 'purpose'
  ) then
    alter table public.media rename column visibility to purpose;
  end if;
end $$;

alter table public.media drop constraint if exists media_visibility_check;
alter table public.media drop constraint if exists media_purpose_check;
update public.media
set purpose = case purpose when 'public' then 'gallery' when 'private' then 'article' else purpose end;
alter table public.media alter column purpose set default 'gallery';
alter table public.media add constraint media_purpose_check check (purpose in ('gallery', 'article'));
alter table public.media drop constraint if exists media_kind_check;
update public.media set kind = 'image' where kind not in ('image', 'video');
alter table public.media add constraint media_kind_check check (kind in ('image', 'video'));
alter table public.media drop column if exists bucket;
alter table public.media drop column if exists width;
alter table public.media drop column if exists height;
alter table public.media drop column if exists duration_seconds;
alter table public.media drop column if exists alt_text;
alter table public.media drop column if exists deleted_at;
alter table public.media alter column captured_at type date using captured_at::date;
drop index if exists public.media_public_timeline_idx;
create index if not exists media_gallery_timeline_idx
  on public.media (captured_at desc nulls last, created_at desc)
  where purpose = 'gallery';
create policy media_gallery_read on public.media for select to anon, authenticated using (purpose = 'gallery');
create policy media_owner_all on public.media for all to authenticated
using ((select public.is_site_owner())) with check ((select public.is_site_owner()));

drop trigger if exists site_settings_set_updated_at on public.site_settings;
drop policy if exists settings_public_read on public.site_settings;
drop policy if exists settings_owner_all on public.site_settings;
create table public.site_settings_next (
  id boolean primary key default true check (id = true),
  site_title text not null check (char_length(site_title) between 1 and 60),
  site_description text not null check (char_length(site_description) between 1 and 160),
  home_intro text not null check (char_length(home_intro) between 1 and 300),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.site_settings_next (id, site_title, site_description, home_intro)
select
  true,
  coalesce((select value #>> '{}' from public.site_settings where key = 'site_title'), '我的记录'),
  coalesce((select value #>> '{}' from public.site_settings where key = 'site_description'), '记录生活、照片与影像的个人小站'),
  coalesce((select value #>> '{}' from public.site_settings where key = 'home_intro'), '在这里，我慢慢记录生活里的光——一些照片、一些影像，和一些想留住的心情。');
drop table public.site_settings cascade;
alter table public.site_settings_next rename to site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();
alter table public.site_settings enable row level security;
create policy settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy settings_owner_all on public.site_settings for all to authenticated
using ((select public.is_site_owner())) with check ((select public.is_site_owner()));

drop trigger if exists entries_capture_revision on public.entries;
alter table public.entry_revisions rename to entry_revisions_legacy;
create table public.entry_revisions (
  id bigint primary key,
  entry_id uuid not null references public.entries(id) on delete cascade,
  snapshot jsonb not null,
  snapshot_at timestamptz not null default now(),
  snapshot_by uuid references auth.users(id) on delete set null default auth.uid()
);
insert into public.entry_revisions (id, entry_id, snapshot, snapshot_at, snapshot_by)
select
  r.id,
  r.entry_id,
  jsonb_build_object(
    'title', r.title, 'slug', e.slug, 'kind', e.kind,
    'excerpt', r.excerpt, 'content_markdown', r.content_markdown,
    'occurred_at', e.occurred_at, 'cover_url', e.cover_url,
    'location', e.location, 'mood', e.mood,
    'status', case when r.status in ('draft', 'published', 'archived') then r.status else 'draft' end,
    'visibility', case when r.visibility in ('public', 'unlisted') then r.visibility else 'public' end,
    'is_pinned', e.is_pinned, 'published_at', e.published_at,
    'tags', coalesce((
      select jsonb_agg(t.name order by t.name)
      from public.entry_tags et join public.tags t on t.id = et.tag_id
      where et.entry_id = r.entry_id
    ), '[]'::jsonb)
  ),
  r.snapshot_at,
  r.snapshot_by
from public.entry_revisions_legacy r
join public.entries e on e.id = r.entry_id;
drop table public.entry_revisions_legacy cascade;
create sequence public.entry_revisions_id_seq owned by public.entry_revisions.id;
select setval(
  'public.entry_revisions_id_seq',
  coalesce((select max(id) from public.entry_revisions), 0) + 1,
  false
);
alter table public.entry_revisions alter column id set default nextval('public.entry_revisions_id_seq');
create index entry_revisions_entry_idx on public.entry_revisions (entry_id, snapshot_at desc);

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
create trigger entries_capture_revision before update on public.entries
for each row execute function public.capture_entry_revision();
alter table public.entry_revisions enable row level security;
create policy revisions_owner_read on public.entry_revisions for select to authenticated
using ((select public.is_site_owner()));
create policy revisions_owner_insert on public.entry_revisions for insert to authenticated
with check ((select public.is_site_owner()));

grant select on public.site_settings, public.media to anon, authenticated;
grant insert, update, delete on public.site_settings, public.media to authenticated;
grant select, insert on public.entry_revisions to authenticated;
grant usage, select on sequence public.entry_revisions_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-media', 'public-media', true, 104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
create policy storage_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'public-media' and (select public.is_site_owner()));
create policy storage_owner_update on storage.objects for update to authenticated
using (bucket_id = 'public-media' and (select public.is_site_owner()))
with check (bucket_id = 'public-media' and (select public.is_site_owner()));
create policy storage_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'public-media' and (select public.is_site_owner()));

commit;
