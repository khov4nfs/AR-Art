"use client";

import { Plus } from "lucide-react";

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
      variant="admin"
      onClose={onClose}
      title={t("ar.create.modalTitle")}
      icon={<Plus className="size-4" />}
      maxWidthClassName="max-w-2xl"
    >
      <div data-motion-skip>
        <ArtworkCreateForm embedded adminLayout onCreated={onCreated} onDone={onClose} />
      </div>
    </Modal>
  );
}
