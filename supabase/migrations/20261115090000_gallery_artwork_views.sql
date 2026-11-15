-- Gallery ordering is based on real visits to published artwork detail pages.
alter table public.artworks
  add column if not exists view_count bigint not null default 0;

create index if not exists artworks_gallery_views_idx
  on public.artworks (view_count desc, published_at desc)
  where status = 'published';

-- Only the server-side service role may increment counters; no public mutation.
create or replace function public.increment_published_artwork_view(p_slug text)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  update public.artworks
  set view_count = view_count + 1
  where slug = p_slug and status = 'published'
  returning view_count;
$$;

revoke all on function public.increment_published_artwork_view(text) from public, anon, authenticated;
grant execute on function public.increment_published_artwork_view(text) to service_role;
