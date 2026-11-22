import { ArBackendUnavailable, isArBackendConfigured } from "@/components/everie-ar/ar-backend-unavailable";
import { ProtectedCreatePage } from "@/features/auth/presentation/components/protected-create-page";

export default function CreateArtworkPage() {
  if (!isArBackendConfigured()) return <ArBackendUnavailable area="Xuất bản AR" />;

  return <ProtectedCreatePage />;
}
