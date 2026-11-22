export const ENGRAVING_MAX_CHARS = 24;
export const BESPOKE_MAX_REVISIONS = 3;

export const CRAFT_DAYS = {
  classic: { min: 14, max: 21 },
  themed: { min: 21, max: 28 },
  bespoke: { min: 30, max: 45 },
} as const;

export const SHIPPING_DAYS = { min: 2, max: 5 } as const;

export type ProductLine = "classic" | "themed";

export function productHref(product: {
  line?: string;
  slug?: string;
  id: string;
}): string {
  const slug = product.slug || product.id;
  if (product.line === "themed") return `/themed/${slug}`;
  if (product.line === "classic") return `/classic/${slug}`;
  return `/products/${slug}`;
}

export function cartLineKey(
  productId: string,
  color?: string,
  engraving?: string,
): string {
  return `${productId}::${color || ""}::${(engraving || "").trim()}`;
}

export function expectedReceiveRange(
  craftMin: number,
  craftMax: number,
  shipMin: number = SHIPPING_DAYS.min,
  shipMax: number = SHIPPING_DAYS.max,
): { min: number; max: number } {
  return { min: craftMin + shipMin, max: craftMax + shipMax };
}

export function formatDayRange(min: number, max: number, lang: "vi" | "en" = "vi"): string {
  if (lang === "en") return `${min}–${max} days`;
  return `${min}–${max} ngày`;
}

export type CraftSettings = {
  craftClassicMin?: number;
  craftClassicMax?: number;
  craftThemedMin?: number;
  craftThemedMax?: number;
  craftBespokeMin?: number;
  craftBespokeMax?: number;
  shippingDaysMin?: number;
  shippingDaysMax?: number;
};

export function craftDaysForLine(
  line?: string,
  settings?: CraftSettings,
): { min: number; max: number } {
  if (line === "themed") {
    return {
      min: settings?.craftThemedMin ?? CRAFT_DAYS.themed.min,
      max: settings?.craftThemedMax ?? CRAFT_DAYS.themed.max,
    };
  }
  if (line === "bespoke") {
    return {
      min: settings?.craftBespokeMin ?? CRAFT_DAYS.bespoke.min,
      max: settings?.craftBespokeMax ?? CRAFT_DAYS.bespoke.max,
    };
  }
  return {
    min: settings?.craftClassicMin ?? CRAFT_DAYS.classic.min,
    max: settings?.craftClassicMax ?? CRAFT_DAYS.classic.max,
  };
}

/** "dd/mm/yyyy HH:MM" in Vietnam time, regardless of the server's timezone. */
export function formatNowStamp(date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

export function nextUniqueCode(existing: string[], prefix: string): string {
  const used = new Set(existing.map((code) => code.toUpperCase()));
  for (let i = 0; i < 80; i += 1) {
    const code = `${prefix}-${1000 + Math.floor(Math.random() * 9000)}`;
    if (!used.has(code)) return code;
  }
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function phonesMatch(stored: string, input: string): boolean {
  const a = normalizePhone(stored);
  const b = normalizePhone(input);
  if (!a || !b || b.length < 9) return false;
  return a.endsWith(b.slice(-9));
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isCodMethod(method?: string): boolean {
  const value = (method || "").toLowerCase();
  return value.includes("cod") || value.includes("khi nhận");
}

/** Server-validated promo codes (percent off the merchandise subtotal). */
export const PROMO_CODES: Record<string, number> = { EVERIE10: 10 };

/** Vietnamese mobile/landline: 0xxxxxxxxx (10 digits) or +84/84 prefix. */
export function isValidVnPhone(value: string): boolean {
  let digits = normalizePhone(value);
  if (digits.startsWith("84")) digits = `0${digits.slice(2)}`;
  return /^0(3|5|7|8|9)\d{8}$/.test(digits) || /^02\d{9}$/.test(digits);
}

/** Allowed bespoke status transitions (enforced by PUT /api/bespoke/[id]). */
export const BESPOKE_FLOW: Record<string, string[]> = {
  "Mới": ["Đang tư vấn", "Đã hủy"],
  "Đang tư vấn": ["Chờ duyệt thiết kế", "Đã hủy"],
  "Chờ duyệt thiết kế": ["Yêu cầu sửa", "Đã duyệt", "Đã hủy"],
  "Yêu cầu sửa": ["Chờ duyệt thiết kế", "Đã hủy"],
  "Đã duyệt": ["Đã thanh toán", "Đã hủy"],
  "Đã thanh toán": [],
  "Đã hủy": [],
};
