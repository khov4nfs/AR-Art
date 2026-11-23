"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/atoms/button";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { Modal } from "@/components/molecules/modal";
import type { ArtworkStatus } from "@/features/artwork/domain/artwork";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/local/collection-repository";
import {
  studioProductSchema,
  type StudioProductFormValues,
} from "@/features/studio/domain/studio-product-schema";

interface EditArtworkButtonProps {
  id: string;
  ownerId: string | null;
  title: string;
  artistName: string;
  description: string;
  status: ArtworkStatus;
}

export function EditArtworkButton({
  id,
  ownerId,
  title,
  artistName,
  description,
  status,
}: EditArtworkButtonProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [canEdit, setCanEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StudioProductFormValues>({
    resolver: zodResolver(studioProductSchema),
    mode: "onChange",
    defaultValues: { title, artistName, description, status },
  });

  useEffect(() => {
    let active = true;
    void getCurrentCollectionUser().then((user) => {
      if (active) setCanEdit(Boolean(ownerId && user?.id === ownerId));
    });
    return () => {
      active = false;
    };
  }, [ownerId]);

  useEffect(() => {
    if (!open) return;
    reset({ title, artistName, description, status });
  }, [artistName, description, open, reset, status, title]);

  const currentStatus = useWatch({ control, name: "status" });

  const submit = handleSubmit(async (values) => {
    try {
      const response = await fetch(`/api/studio/products/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to update product.");

      setOpen(false);
      if (values.status === "draft") {
        router.push("/studio/products");
        return;
      }
      router.refresh();
    } catch (cause) {
      setError("root", {
        message: cause instanceof Error ? cause.message : "Unable to update product.",
      });
    }
  });

  if (!canEdit) return null;

  return (
    <>
      <Button
        type="button"
        size="lg"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-12 border-white/12 bg-white/[0.025] px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 hover:border-white/25 hover:bg-white/[0.045] hover:text-white"
      >
        <Pencil className="size-4" aria-hidden="true" />
        {t("ar.common.edit")}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/10 bg-transparent text-white/55 hover:bg-white/[0.06] hover:text-white"
            >
              {t("ar.common.cancel")}
            </Button>
            <Button
              type="submit"
              form="product-editor-form"
              disabled={!isValid || isSubmitting}
              className="bg-white text-black hover:bg-amber-100"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {t("ar.manager.save")}
            </Button>
          </div>
        }
      >
        <form id="product-editor-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="edit-product-title" className="text-white/68">{t("ar.manager.productName")}</Label>
            <Input
              id="edit-product-title"
              className="h-12 rounded-none border-x-0 border-t-0 border-b-white/14 bg-transparent px-0 text-white focus-visible:border-white/42 focus-visible:ring-0"
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-rose-300">{errors.title.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-product-artist" className="text-white/68">{t("ar.manager.creator")}</Label>
            <Input
              id="edit-product-artist"
              className="h-12 rounded-none border-x-0 border-t-0 border-b-white/14 bg-transparent px-0 text-white focus-visible:border-white/42 focus-visible:ring-0"
              {...register("artistName")}
            />
            {errors.artistName ? <p className="text-xs text-rose-300">{errors.artistName.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-product-description" className="text-white/68">{t("ar.manager.description")}</Label>
            <Textarea
              id="edit-product-description"
              className="rounded-none border-x-0 border-t-0 border-b-white/14 bg-transparent px-0 text-white focus-visible:border-white/42 focus-visible:ring-0"
              {...register("description")}
            />
            {errors.description ? <p className="text-xs text-rose-300">{errors.description.message}</p> : null}
          </div>

          <div>
            <Label className="text-white/68">{t("ar.manager.visibility")}</Label>
            <div className="mt-2 flex gap-6">
              <button
                type="button"
                onClick={() => setValue("status", "draft", { shouldValidate: true, shouldDirty: true })}
                className={`relative py-3 text-sm transition after:absolute after:inset-x-0 after:-bottom-px after:h-px after:transition-transform ${
                  currentStatus === "draft"
                    ? "text-white after:scale-x-100 after:bg-white"
                    : "text-white/38 after:scale-x-0 after:bg-white hover:text-white/72"
                }`}
              >
                {t("ar.manager.draft")}
              </button>
              <button
                type="button"
                onClick={() => setValue("status", "published", { shouldValidate: true, shouldDirty: true })}
                className={`relative py-3 text-sm transition after:absolute after:inset-x-0 after:-bottom-px after:h-px after:transition-transform ${
                  currentStatus === "published"
                    ? "text-white after:scale-x-100 after:bg-white"
                    : "text-white/38 after:scale-x-0 after:bg-white hover:text-white/72"
                }`}
              >
                {t("ar.studio.live")}
              </button>
            </div>
          </div>

          {errors.root?.message ? <p className="text-sm text-rose-200">{errors.root.message}</p> : null}
        </form>
      </Modal>
    </>
  );
}
