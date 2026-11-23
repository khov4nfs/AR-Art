import { notFound } from "next/navigation";

import { buildArtworkOverlay } from "@/features/ar-experience/application/build-artwork-overlay";
import { ArViewer } from "@/features/ar-experience/presentation/components/ar-viewer";
import { createArtworkServices } from "@/features/artwork/infrastructure/local/artwork-services";

export const dynamic = "force-dynamic";

export default async function PublishedArPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { getPublishedArtwork } = createArtworkServices();
  const artwork = await getPublishedArtwork.execute(slug);

  if (!artwork) notFound();

  return (
    <ArViewer
      backHref={`/art/${artwork.slug}`}
      config={{
        targetUrl: artwork.targetFileUrl,
        targetIndex: 0,
        overlay: buildArtworkOverlay(artwork),
      }}
      artwork={{
        id: artwork.id,
        slug: artwork.slug,
        title: artwork.title,
        artistName: artwork.artistName,
        ownerId: artwork.ownerId,
      }}
    />
  );
}
