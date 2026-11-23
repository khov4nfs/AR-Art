/**
 * Engraving helpers shared by the 3D scene (canvas texture) and the form
 * (validation). Kept free of three.js so the product page can validate
 * without loading the 3D bundle.
 */

export type EngravingFontId = "serif" | "script" | "classic";

/** Plaque texture size: the same numbers are used to draw and to validate. */
export const ENGRAVE_CANVAS_W = 1024;
export const ENGRAVE_CANVAS_H = 256;
/** Usable width on the plaque (keeps margin from the bevel/thin ceramic). */
export const ENGRAVE_SAFE_W = ENGRAVE_CANVAS_W * 0.84;
export const ENGRAVE_FONT_PX: Record<EngravingFontId, number> = {
  serif: 118,
  script: 150,
  classic: 124,
};

/** Letters (incl. Vietnamese diacritics), digits, spaces and a few gift symbols. */
const ALLOWED = /^[\p{L}\p{M}\p{N} &.,'’\-+♥♡★∞]*$/u;

export const ENGRAVE_SYMBOLS = ["♥", "∞", "★", "&"] as const;

export function normalizeEngraving(text: string) {
  return text.normalize("NFC").replace(/\s+/g, " ");
}

export function engravingCharCount(text: string) {
  return Array.from(normalizeEngraving(text)).length;
}

export function hasInvalidEngravingChars(text: string) {
  return !ALLOWED.test(normalizeEngraving(text));
}

let measureCtx: CanvasRenderingContext2D | null = null;

/** Smallest scale the plaque may shrink a long message to (still legible). */
export const ENGRAVE_MIN_SCALE = 0.6;

export function engravingCssFont(fontFamily: string, id: EngravingFontId, px = ENGRAVE_FONT_PX[id]) {
  const weight = id === "classic" ? 600 : 400;
  const style = id === "serif" ? "italic " : "";
  return `${style}${weight} ${Math.round(px)}px ${fontFamily}`;
}

export function engravingLetterSpacing(id: EngravingFontId, px = ENGRAVE_FONT_PX[id]) {
  return id === "classic" ? Math.round(0.065 * px) : 0;
}

function measureWidth(ctx: CanvasRenderingContext2D, text: string, fontFamily: string, id: EngravingFontId, px: number) {
  ctx.font = engravingCssFont(fontFamily, id, px);
  const chars = engravingCharCount(text);
  return ctx.measureText(normalizeEngraving(text)).width + Math.max(0, chars - 1) * engravingLetterSpacing(id, px);
}

/**
 * Font size (px) that makes the text fit the plaque: the nominal size, shrunk
 * down to ENGRAVE_MIN_SCALE for long messages. Returns null when even the
 * smallest size does not fit. Used both to draw and to validate.
 */
export function engravingFontPx(
  text: string,
  fontFamily: string,
  id: EngravingFontId,
  ctx?: CanvasRenderingContext2D | null,
): number | null {
  const nominal = ENGRAVE_FONT_PX[id];
  if (!ctx) {
    if (typeof document === "undefined") return nominal;
    if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
    ctx = measureCtx;
  }
  if (!ctx) return nominal;
  const w = measureWidth(ctx, text, fontFamily, id, nominal);
  if (w <= ENGRAVE_SAFE_W) return nominal;
  const px = Math.floor(nominal * (ENGRAVE_SAFE_W / w));
  if (px < nominal * ENGRAVE_MIN_SCALE) return null;
  return measureWidth(ctx, text, fontFamily, id, px) <= ENGRAVE_SAFE_W ? px : px - 2;
}

/** Returns true when the text fits the plaque (after allowed shrinking). */
export function engravingFits(text: string, fontFamily: string, id: EngravingFontId) {
  return engravingFontPx(text, fontFamily, id) !== null;
}

/* ------------------------------------------------------------------ */
/* Placement: where on the plinth band the text is engraved            */
/* ------------------------------------------------------------------ */

/**
 * Stored as a compact string: "front" | "back" | "both" | "a<deg>" where
 * <deg> is 0-359, measured clockwise (seen from above) from the front.
 */
export type EngravingPlacement = "front" | "back" | "both" | "spot" | `a${number}`;

/** Text placed freely on the flower (petal, stem, leaf) is small: keep it short. */
export const ENGRAVE_SPOT_MAX_CHARS = 12;

/**
 * A point the customer clicked on the 3D model. `frame: "model"` = local to the
 * flower model (follows the admin fit), "world" = the fixed ceramic plinth.
 */
export interface EngraveSpot {
  frame: "model" | "world";
  p: [number, number, number];
  n: [number, number, number];
  /** Text rotation around the surface normal, degrees (-180..180). */
  rot: number;
  /** Text size multiplier (0.5..1.5). */
  scale: number;
}

/** Server-side/untrusted input → a clean spot, or null if invalid. */
export function sanitizeSpot(v: unknown): EngraveSpot | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const vec = (a: unknown, lim: number) =>
    Array.isArray(a) && a.length === 3 && a.every((x) => typeof x === "number" && Number.isFinite(x) && Math.abs(x) <= lim)
      ? (a.map((x) => Math.round((x as number) * 1000) / 1000) as [number, number, number])
      : null;
  const p = vec(o.p, 10);
  const n = vec(o.n, 1.01);
  if (!p || !n || Math.hypot(...n) < 0.5) return null;
  if (o.frame !== "model" && o.frame !== "world") return null;
  const rot = Number(o.rot ?? 0);
  const scale = Number(o.scale ?? 1);
  if (!Number.isFinite(rot) || rot < -180 || rot > 180) return null;
  if (!Number.isFinite(scale) || scale < 0.5 || scale > 1.5) return null;
  return { frame: o.frame, p, n, rot: Math.round(rot), scale: Math.round(scale * 100) / 100 };
}
export const DEFAULT_PLACEMENT: EngravingPlacement = "front";

export function engravingAngle(p: string | undefined): number | null {
  const m = /^a(\d{1,3})$/.exec(p ?? "");
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 0 && n < 360 ? n : null;
}

export function isValidPlacement(p: unknown): p is EngravingPlacement {
  return p === "front" || p === "back" || p === "both" || p === "spot" || (typeof p === "string" && engravingAngle(p) !== null);
}

export function placementFromAngle(deg: number): EngravingPlacement {
  const n = ((Math.round(deg) % 360) + 360) % 360;
  if (n === 0) return "front";
  if (n === 180) return "back";
  return `a${n}`;
}

/** Main text angle in degrees (0 = front). "both" also engraves at +180°. */
export function placementDegrees(p: string | undefined): number {
  if (p === "back") return 180;
  const a = engravingAngle(p);
  return a ?? 0;
}

export function placementLabel(p: string | undefined, lang: "vi" | "en" = "vi"): string {
  const en = lang === "en";
  if (!p || p === "front") return en ? "Base · front" : "Đế · mặt trước";
  if (p === "back") return en ? "Base · back" : "Đế · mặt sau";
  if (p === "both") return en ? "Base · front & back" : "Đế · hai mặt (trước & sau)";
  if (p === "spot") return en ? "Custom spot on the flower (see 3D preview)" : "Vị trí tự chọn trên hoa (xem ảnh 3D)";
  const a = engravingAngle(p);
  return a === null ? (en ? "Front" : "Mặt trước") : en ? `Base · ${a}°` : `Đế · góc ${a}°`;
}
