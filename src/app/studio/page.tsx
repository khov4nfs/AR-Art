import { ArBackendUnavailable, isArBackendConfigured } from "@/components/everie-ar/ar-backend-unavailable";
import { StudioApp } from "@/features/studio/presentation/components/studio-app";

export default function StudioPage() {
  if (!isArBackendConfigured()) return <ArBackendUnavailable area="AR Studio" />;

  return <StudioApp view="overview" />;
}
