import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { buildArtworkOverlay } from "@/features/ar-experience/application/build-artwork-overlay";
import { selectScannerArtworks } from "@/features/ar-experience/domain/scanner-targets";
import { UniversalArViewer } from "@/features/ar-experience/presentation/components/universal-ar-viewer";

export const dynamic = "force-dynamic";

export default async function ArPage() {
  const { listPublishedArtworks } = createArtworkServices();
  const published = await listPublishedArtworks.execute();
  const artworks = selectScannerArtworks(published).map((artwork) => ({
    id: artwork.id,
    slug: artwork.slug,
    title: artwork.title,
    artistName: artwork.artistName,
    ownerId: artwork.ownerId,
    targetImageUrl: artwork.targetImageUrl,
    overlay: buildArtworkOverlay(artwork),
  }));

  return <UniversalArViewer artworks={artworks} />;
}
