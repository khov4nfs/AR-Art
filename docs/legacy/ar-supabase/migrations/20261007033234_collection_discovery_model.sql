-- Everie collection business model v2
-- Collection is the user's automatic discovery archive, not a creator-managed grouping.

grant select, insert, delete on table public.user_collection to authenticated;

drop policy if exists "Users can remove items from their own collection" on public.user_collection;
create policy "Users can remove items from their own collection"
on public.user_collection
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Remove the retired creator-managed collection model and its links.
drop table if exists public.creator_collection_artworks;
drop table if exists public.creator_collections;