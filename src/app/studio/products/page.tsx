import { ArBackendUnavailable, isArBackendConfigured } from "@/components/everie-ar/ar-backend-unavailable";
import { StudioApp } from "@/features/studio/presentation/components/studio-app";

export default function StudioProductsPage() {
  if (!isArBackendConfigured()) return <ArBackendUnavailable area="Quản lý AR" />;

  return <StudioApp view="products" />;
}
