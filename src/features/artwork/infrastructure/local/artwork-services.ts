import { CreateArtworkUploadSession } from "@/features/artwork/application/use-cases/create-artwork-upload-session";
import { DeleteStudioArtwork } from "@/features/artwork/application/use-cases/delete-studio-artwork";
import { GetPublishedArtwork } from "@/features/artwork/application/use-cases/get-published-artwork";
import { ListPublishedArtworks } from "@/features/artwork/application/use-cases/list-published-artworks";
import { ListStudioArtworks } from "@/features/artwork/application/use-cases/list-studio-artworks";
import { PublishArtwork } from "@/features/artwork/application/use-cases/publish-artwork";
import { UpdateStudioArtwork } from "@/features/artwork/application/use-cases/update-studio-artwork";
import { LocalArtworkRepository } from "./local-artwork-repository";
import { LocalArtworkStorage } from "./local-artwork-storage";

export function createArtworkServices() {
  const repository = new LocalArtworkRepository();
  const storage = new LocalArtworkStorage();
  return {
    createUploadSession: new CreateArtworkUploadSession(repository, storage, "everie-public-uploads"),
    publishArtwork: new PublishArtwork(repository, storage),
    getPublishedArtwork: new GetPublishedArtwork(repository, storage),
    listPublishedArtworks: new ListPublishedArtworks(repository, storage),
    listStudioArtworks: new ListStudioArtworks(repository, storage),
    updateStudioArtwork: new UpdateStudioArtwork(repository, storage),
    deleteStudioArtwork: new DeleteStudioArtwork(repository, storage),
  };
}
