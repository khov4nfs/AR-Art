import { z } from "zod";

export const ARTWORK_UPLOAD_MAX_FILE_SIZE = 6 * 1024 * 1024;

const MAX_AR_ASSETS = 1;
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoTypes = new Set(["video/mp4", "video/webm"]);
const arAssetTypes = new Set([...videoTypes, ...imageTypes]);
function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function fileSchema(options: {
  missingMessage: string;
  typeMessage: string;
  allowedTypes: Set<string>;
}) {
  return z
    .custom<File>(isFile, options.missingMessage)
    .refine((file) => options.allowedTypes.has(file.type), options.typeMessage)
    .refine(
      (file) => file.size <= ARTWORK_UPLOAD_MAX_FILE_SIZE,
      "Each uploaded file must be 6 MB or smaller for this MVP.",
    );
}

const spatialFileSchema = z
  .custom<File>(isFile, "Choose a video or image.")
  .refine((file) => arAssetTypes.has(file.type), "Choose PNG, JPG, WebP, MP4 or WebM.")
  .refine((file) => file.size > 0 && file.size <= ARTWORK_UPLOAD_MAX_FILE_SIZE, "Images and converted videos must be between 1 byte and 6 MB.");

export const spatialLayerFormSchema = z.object({
  file: spatialFileSchema,
  animation: z.enum(["none", "float", "pulse", "rotate", "orbit"]),
  blendMode: z.enum(["normal", "additive"]),
  x: z.number().min(-1.5).max(1.5),
  y: z.number().min(-1.5).max(1.5),
  depth: z.number().min(0).max(1),
  scale: z.number().min(0.05).max(3),
});

export const artworkCreateFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Artwork title is required.")
      .max(120, "Artwork title must be 120 characters or fewer."),
    artistName: z
      .string()
      .trim()
      .min(1, "Artist / creator is required.")
      .max(120, "Artist / creator must be 120 characters or fewer."),
    arMode: z.literal("spatial_layers"),
    targetImage: fileSchema({
      missingMessage: "A tracking image could not be prepared from this media.",
      typeMessage: "Target image must be JPG, PNG, or WebP.",
      allowedTypes: imageTypes,
    }),
    spatialLayers: z.array(spatialLayerFormSchema).min(1, "Please upload a video or image.").max(MAX_AR_ASSETS, "Only one AR video or image is allowed."),
  });

export type ArtworkCreateFormValues = z.infer<typeof artworkCreateFormSchema>;
