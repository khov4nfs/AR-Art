import type { Language } from "@/context/LanguageContext";

/** Translate known validation messages without changing domain/API validation contracts. */
const validationKeys: Record<string, string> = {
  "Artwork title is required.": "ar.create.validationTitleRequired",
  "Artwork title must be 120 characters or fewer.": "ar.create.validationTitleLength",
  "Artist / creator is required.": "ar.create.validationCreatorRequired",
  "Artist / creator must be 120 characters or fewer.": "ar.create.validationCreatorLength",
  "Upload the artwork image visitors will scan.": "ar.create.validationImageRequired",
  "Target image must be JPG, PNG, or WebP.": "ar.create.validationImageType",
  "Each uploaded file must be 6 MB or smaller for this MVP.": "ar.create.validationFileSize",
  "Upload the animation video.": "ar.create.validationVideoRequired",
  "The animation must be MP4 or WebM (MOV is converted on Save).": "ar.create.validationVideoType",
  "The converted animation must be between 1 byte and 6 MB.": "ar.create.validationVideoSize",
  "Only one animation video is allowed.": "ar.create.validationVideoCount",
  "Video conversion is unavailable on this server. Please try again later.": "ar.create.converterUnavailable",
};

/** Keep actionable backend detail in English; offer a friendly fallback in Vietnamese. */
export function localizedArFormError(
  message: string | undefined,
  language: Language,
  t: (key: string) => string,
  fallback: string,
): string | undefined {
  if (!message) return undefined;
  const key = validationKeys[message];
  if (key) return t(key);
  return language === "vi" ? t(fallback) : message;
}
