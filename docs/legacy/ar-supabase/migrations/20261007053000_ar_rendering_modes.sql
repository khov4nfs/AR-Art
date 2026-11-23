-- Everie AR Rendering Spec v1
-- Adds mode-aware AR configuration while keeping legacy overlay columns readable.

alter table public.artworks
  add column if not exists ar_mode text not null default 'motion_extract';

alter table public.artworks
  add column if not exists ar_config jsonb not null default '{}'::jsonb;

alter table public.artworks
  drop constraint if exists artworks_ar_mode_check;

alter table public.artworks
  add constraint artworks_ar_mode_check
  check (ar_mode in ('motion_extract', 'transparent_motion', 'spatial_layers'));

alter table public.artworks
  alter column overlay_path drop not null,
  alter column overlay_type drop not null,
  alter column overlay_aspect_ratio drop not null;

-- Existing rows keep their previous full-frame video assets, but the runtime now
-- interprets them as motion-extract overlays so the physical artwork remains visible.
update public.artworks
set ar_mode = 'motion_extract'
where ar_mode is null;

create table if not exists public.artwork_ar_assets (
  id uuid primary key,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  asset_type text not null check (asset_type in ('image', 'video', 'model')),
  storage_path text not null,
  mime_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (artwork_id, storage_path)
);

create index if not exists artwork_ar_assets_artwork_id_idx
  on public.artwork_ar_assets (artwork_id);

alter table public.artwork_ar_assets enable row level security;
revoke all privileges on table public.artwork_ar_assets from anon;
revoke all privileges on table public.artwork_ar_assets from authenticated;
grant select on table public.artwork_ar_assets to authenticated;

drop policy if exists "Creators can view their own AR assets" on public.artwork_ar_assets;
create policy "Creators can view their own AR assets"
on public.artwork_ar_assets
for select
to authenticated
using (
  exists (
    select 1
    from public.artworks
    where artworks.id = artwork_ar_assets.artwork_id
      and ((select auth.uid()) = artworks.owner_id or artworks.owner_id is null)
  )
);

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'model/gltf-binary',
  'application/octet-stream'
]
where id = 'ar-art-assets';
