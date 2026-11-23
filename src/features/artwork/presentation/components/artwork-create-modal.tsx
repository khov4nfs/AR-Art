"use client";

import { EverieBrand } from "@/components/atoms/everie-brand";
import { useLanguage } from "@/context/LanguageContext";
import { Modal } from "@/components/molecules/modal";
import { ArtworkCreateForm } from "@/features/artwork/presentation/components/artwork-create-form";

export function ArtworkCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (productId: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("ar.create.modalTitle")}
      headerContent={<EverieBrand href={null} className="opacity-80" />}
      maxWidthClassName="max-w-[92rem]"
    >
      <div data-motion-skip>
        <ArtworkCreateForm embedded onCreated={onCreated} onDone={onClose} />
      </div>
    </Modal>
  );
}
