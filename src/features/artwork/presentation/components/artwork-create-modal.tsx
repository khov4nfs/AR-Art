"use client";

import { EverieBrand } from "@/components/atoms/everie-brand";
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
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a new Everie product"
      headerContent={<EverieBrand href={null} className="opacity-80" />}
      maxWidthClassName="max-w-[92rem]"
    >
      <div data-motion-skip>
        <ArtworkCreateForm embedded onCreated={onCreated} onDone={onClose} />
      </div>
    </Modal>
  );
}
