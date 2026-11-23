-- Additive production migration for a single EVERIE identity across commerce + AR.
-- Existing Supabase Auth user IDs and all legacy artworks/collections are preserved.
-- Apply once via the Supabase migration API after code review and before VPS cutover.
ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS everie_owner_id text;

CREATE INDEX IF NOT EXISTS artworks_everie_owner_created_idx
  ON public.artworks (everie_owner_id, created_at DESC)
  WHERE everie_owner_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.everie_user_collection (
  everie_user_id text NOT NULL CHECK (length(everie_user_id) BETWEEN 1 AND 128),
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  collected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (everie_user_id, artwork_id)
);

CREATE INDEX IF NOT EXISTS everie_collection_recent_idx
  ON public.everie_user_collection (everie_user_id, collected_at DESC);

ALTER TABLE public.everie_user_collection ENABLE ROW LEVEL SECURITY;
-- The shared EVERIE HttpOnly session is verified by the Next.js server.
-- Browser anon/authenticated tokens must not query this table directly.
REVOKE ALL ON public.everie_user_collection FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.everie_user_collection TO service_role;

-- Legacy Supabase-authenticated users must never see unpublished EVERIE-owned
-- drafts or assets merely because their legacy owner_id is NULL.
DROP POLICY IF EXISTS "Creators can view owned artworks" ON public.artworks;
CREATE POLICY "Creators can view owned artworks" ON public.artworks
  FOR SELECT TO authenticated
  USING (
    owner_id = (select auth.uid())
    OR (owner_id IS NULL AND everie_owner_id IS NULL AND status = 'published')
  );

DROP POLICY IF EXISTS "Creators can view their own AR assets" ON public.artwork_ar_assets;
CREATE POLICY "Creators can view their own AR assets" ON public.artwork_ar_assets
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.artworks a
    WHERE a.id = artwork_ar_assets.artwork_id
      AND (
        a.owner_id = (select auth.uid())
        OR (a.owner_id IS NULL AND a.everie_owner_id IS NULL AND a.status = 'published')
      )
  ));
