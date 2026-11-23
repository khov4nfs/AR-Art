import fs from "fs/promises";
import path from "path";
import { bcryptCompareSync, hashPassword, isHashed } from "@/lib/server/security";
import { storesList as defaultStores } from "@/data/hanoiaData";
import {
  everieHeroSlides as defaultHeroSlides,
  everieProducts as defaultProducts,
  everieTopPicks as defaultTopPicks,
  everieMenus as defaultMenus,
  everiePages,
} from "@/data/everieData";

export const CURRENT_SCHEMA_VERSION = 2;

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logoHeader: string;
  logoFooter: string;
  favicon: string;
  hotline: string;
  workingHours: string;
  email: string;
  copyrightVi: string;
  copyrightEn: string;
  bctCertificateUrl: string;
  bctBadgeImage: string;
  announcements: { id: string; text: string; link: string; active: boolean }[];
  showScrollToTop?: boolean;
  showSocialSupport?: boolean;
  messengerUrl?: string;
  zaloNumber?: string;
  supportPhone?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoOgImage?: string;
  seoCanonical?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  craftClassicMin?: number;
  craftClassicMax?: number;
  craftThemedMin?: number;
  craftThemedMax?: number;
  craftBespokeMin?: number;
  craftBespokeMax?: number;
  shippingDaysMin?: number;
  shippingDaysMax?: number;
}

export interface MenuItem {
  label: string;
  href: string;
  columns: {
    title: string;
    links: { text: string; href: string }[];
  }[];
  featuredImage?: string;
  featuredText?: string;
}

export interface ProductItem {
  id: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  galleryImages?: string[];
  category: string;
  collection: string;
  tag?: string;
  description: string;
  dimensions?: string;
  material?: string;
  finish?: string;
  inStock: boolean;
  colors?: { name: string; hex: string }[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoCanonical?: string;
  seoOgImage?: string;
  seoRobots?: "index, follow" | "noindex, nofollow";
  model3dGlb?: string;
  /** Seating of the GLB on the plinth: scale (1 = auto), rotY degrees, offsetY units. */
  model3dFit?: { scale?: number; rotY?: number; offsetY?: number };
  /** Procedural placeholder used until the artisan GLB is ready. */
  model3dPreset?: "rose" | "tulip";
  model3dUsdz?: string;
  enableAr?: boolean;
  /** Slug of a published image-tracked AR artwork (separate from 3D configurator). */
  arArtworkSlug?: string;
  line?: "classic" | "themed";
  species?: string;
  craftDaysMin?: number;
  craftDaysMax?: number;
  engravingEnabled?: boolean;
  maxEngravingChars?: number;
  meaning?: string;
  inspiration?: string;
  isSet?: boolean;
  setProductIds?: string[];
}

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "SUPER_ADMIN" | "CONTENT_EDITOR" | "CUSTOMER";
  tier: "Silver" | "Gold" | "Platinum";
  points: number;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  /** bcrypt hash — never expose (see publicUser). */
  password?: string;
  gender?: "Nam" | "Nữ" | "Khác";
  birthday?: string;
  addresses?: CustomerAddress[];
  /** Product ids saved by the customer. */
  wishlist?: string[];
  emailVerified?: boolean;
  verifyTokenHash?: string;
  resetTokenHash?: string;
  resetTokenExp?: number;
}

export interface CustomerAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  shippingFee?: number;
  discountAmount?: number;
  status:
    | "Chờ xác nhận"
    | "Đang chế tác"
    | "Đang xử lý"
    | "Đang vận chuyển"
    | "Đã giao hàng"
    | "Hư hỏng khi vận chuyển"
    | "Đã hủy";
  paymentMethod: string;
  paymentStatus?: "Chưa thanh toán" | "Đã thanh toán" | "Đã hoàn tiền";
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  trackingCode?: string;
  timeline?: { time: string; title: string; note: string; actor?: string }[];
  items: {
    productId?: string;
    sku?: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    color?: string;
    engravingText?: string;
    engravingFont?: string;
    /** "front" | "back" | "both" | "a<deg>" | "spot" (see lib/engraving). */
    engravingPlacement?: string;
    engravingSpot?: import("@/lib/engraving").EngraveSpot;
    giftMessage?: string;
    /** URL of the configured 3D view captured at add-to-cart. */
    previewImage?: string;
  }[];
  expectedMinDays?: number;
  expectedMaxDays?: number;
  hasEngraving?: boolean;
  /** Set when placed while signed in, or claimed later by the customer. */
  customerId?: string;
}

export type BespokeStatus =
  | "Mới"
  | "Đang tư vấn"
  | "Chờ duyệt thiết kế"
  | "Yêu cầu sửa"
  | "Đã duyệt"
  | "Đã thanh toán"
  | "Đã hủy";

export interface BespokeRequest {
  id: string;
  code: string;
  createdAt: string;
  customerName: string;
  phone: string;
  email: string;
  occasion: string;
  flowerPreference: string;
  colorPreference: string;
  engravingText: string;
  notes: string;
  attachments: string[];
  revisionCount: number;
  maxRevisions: number;
  status: BespokeStatus;
  orderId?: string;
  quoteAmount?: number;
  customerId?: string;
}

export interface MediaAsset {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  navigationLabel: string;
  excerpt: string;
  content: string;
  status: "published" | "draft";
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
  sections: PageSection[];
}

export type PageSectionType =
  | "hero"
  | "story"
  | "stats"
  | "process"
  | "feature"
  | "cta"
  | "stores"
  | "policies"
  | "contact"
  | "showcase"
  | "gallery";

export interface PageSectionItem {
  id: string;
  title: string;
  description: string;
  value?: string;
  subtitle?: string;
  badge?: string;
  image?: string;
  icon?: string;
  link?: string;
  highlight?: boolean;
}

export interface PageSection {
  id: string;
  type: PageSectionType;
  name: string;
  eyebrow: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  secondaryImage?: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  enabled: boolean;
  items: PageSectionItem[];
  variant?: string;
}

export interface CMSDatabase {
  schemaVersion: number;
  settings: SiteSettings;
  menus: MenuItem[];
  heroSlides: typeof defaultHeroSlides;
  topPicks: typeof defaultTopPicks;
  products: ProductItem[];
  stores: typeof defaultStores;
  orders: OrderItem[];
  users: UserItem[];
  media: MediaAsset[];
  pages: PageContent[];
  bespokeRequests: BespokeRequest[];
}

const DB_PATH = path.join(process.cwd(), "data", "cms-store.json");

// Default initial state seeded directly from current website
export const defaultDatabase: CMSDatabase = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  settings: {
    siteName: "EVERIE",
    siteTagline: "Vẻ đẹp ở lại cùng thời gian",
    logoHeader: "/images/hanoia/logo-lettering.png",
    logoFooter: "/images/hanoia/logo-lettering.png",
    favicon: "/favicon.ico",
    hotline: "0908 188 188",
    workingHours: "9:00 - 18:00",
    email: "hello@everievn.com",
    copyrightVi:
      "© 2026 EVERIE. Hoa gốm thủ công — làng gốm Thanh Hà.",
    copyrightEn:
      "© 2026 EVERIE. Handmade ceramic flowers from Thanh Ha.",
    bctCertificateUrl: "http://online.gov.vn",
    bctBadgeImage: "/images/hanoia/logo-bct.webp",
    announcements: [
      {
        id: "1",
        text: "Vẻ đẹp ở lại cùng thời gian — hoa gốm Classic, Themed, Bespoke",
        link: "/",
        active: true,
      },
      {
        id: "2",
        text: "Classic Flowers: chọn màu men, khắc chữ, chế tác 14–21 ngày",
        link: "/classic",
        active: true,
      },
      {
        id: "3",
        text: "Themed Collection PHẤP · DỆT · VANG — mua lẻ hoặc cả bộ",
        link: "/themed",
        active: true,
      },
      {
        id: "4",
        text: "Bespoke: gửi yêu cầu, sửa tối đa 3 lần, 30–45 ngày",
        link: "/bespoke",
        active: true,
      },
      {
        id: "5",
        text: "Hoa gốm dễ vỡ — đóng gói chống sốc, tra cứu đơn bằng mã + email",
        link: "/lookup",
        active: true,
      },
    ],
    showScrollToTop: true,
    showSocialSupport: true,
    messengerUrl: "https://m.me/everie.vn",
    zaloNumber: "0908 188 188",
    supportPhone: "0908 188 188",
    seoTitle: "EVERIE | Hoa gốm thủ công — Vẻ đẹp ở lại cùng thời gian",
    seoDescription:
      "Hoa gốm Classic, Themed và Bespoke. Làm theo đơn, khắc chữ, giao theo khoảng ngày chế tác.",
    seoKeywords:
      "everie, hoa gốm, gốm thủ công, classic flowers, themed collection, bespoke, thanh hà",
    seoOgImage: "/images/hanoia/hero-banner-3.webp",
    seoCanonical: "https://everievn.com",
    facebookUrl: "https://facebook.com/everie.vn",
    instagramUrl: "https://instagram.com/everie.vn",
    tiktokUrl: "https://tiktok.com/@everie.vn",
    bankName: "Vietcombank",
    bankAccount: "0123456789",
    bankAccountName: "EVERIE CERAMIC",
    craftClassicMin: 14,
    craftClassicMax: 21,
    craftThemedMin: 21,
    craftThemedMax: 28,
    craftBespokeMin: 30,
    craftBespokeMax: 45,
    shippingDaysMin: 2,
    shippingDaysMax: 5,
  },
  menus: defaultMenus as MenuItem[],
  heroSlides: defaultHeroSlides,
  topPicks: defaultTopPicks,
  products: defaultProducts as ProductItem[],
  stores: defaultStores,
  orders: [
    {
      id: "ord-1",
      orderNumber: "EVR-2401",
      date: "20/10/2026 10:15",
      total: 1890000,
      status: "Đang chế tác",
      paymentMethod: "Chuyển khoản ngân hàng",
      paymentStatus: "Đã thanh toán",
      customerName: "Nguyễn Hoàng Long",
      phone: "0912 345 678",
      email: "long.nguyen@gmail.com",
      address: "Số 15 Ngô Quyền, Hoàn Kiếm, Hà Nội",
      expectedMinDays: 16,
      expectedMaxDays: 26,
      hasEngraving: true,
      items: [
        {
          productId: "ev-tulip",
          sku: "EV-CL-TULIP",
          name: "Hoa Tulip",
          price: 1890000,
          quantity: 1,
          image: "/images/hanoia/product-vase-monument.webp",
          color: "Hồng đào",
          engravingText: "Long & Hà",
        },
      ],
    },
    {
      id: "ord-2",
      orderNumber: "EVR-2398",
      date: "18/10/2026 15:40",
      total: 3490000,
      status: "Đang vận chuyển",
      paymentMethod: "COD (Thanh toán khi nhận hàng)",
      paymentStatus: "Chưa thanh toán",
      customerName: "Trần Mai Phương",
      phone: "0988 765 432",
      email: "phuong.tran@gmail.com",
      address: "Tòa tháp Landmark 81, P.22, Bình Thạnh, TP. HCM",
      trackingCode: "GHN-EVR-5521",
      expectedMinDays: 23,
      expectedMaxDays: 33,
      hasEngraving: false,
      items: [
        {
          productId: "ev-phap",
          sku: "EV-TH-PHAP",
          name: "PHẤP",
          price: 3490000,
          quantity: 1,
          image: "/images/hanoia/hero-banner-1.webp",
          color: "Đỏ son",
        },
      ],
    },
  ],
  users: [
    {
      id: "usr-1",
      fullName: "Nguyễn Thế Hùng (Admin)",
      email: "admin@everie.vn",
      phone: "0901 234 567",
      role: "SUPER_ADMIN",
      tier: "Platinum",
      points: 12500,
      avatar: "/images/hanoia/logo-circle-h.png",
      createdAt: "15/01/2026",
      isActive: true,
      password: process.env.ADMIN_INITIAL_PASSWORD || "admin123",
    },
    {
      id: "usr-2",
      fullName: "Lê Thu Hà (Biên Tập Viên)",
      email: "editor@everie.vn",
      phone: "0912 888 999",
      role: "CONTENT_EDITOR",
      tier: "Gold",
      points: 4200,
      avatar: "/images/hanoia/logo-circle-h.png",
      createdAt: "20/02/2026",
      isActive: true,
      password: process.env.EDITOR_INITIAL_PASSWORD || "editor123",
    },
    {
      id: "usr-3",
      fullName: "Nguyễn Hoàng Long (Khách VIP)",
      email: "long.nguyen@gmail.com",
      phone: "0912 345 678",
      role: "CUSTOMER",
      tier: "Platinum",
      points: 8900,
      avatar: "/images/hanoia/logo-circle-h.png",
      createdAt: "01/03/2026",
      isActive: true,
      password: "customer123",
    },
    {
      id: "usr-4",
      fullName: "Trần Mai Phương",
      email: "phuong.tran@gmail.com",
      phone: "0988 765 432",
      role: "CUSTOMER",
      tier: "Gold",
      points: 3100,
      avatar: "/images/hanoia/logo-circle-h.png",
      createdAt: "12/03/2026",
      isActive: true,
      password: "customer123",
    },
    {
      id: "usr-5",
      fullName: "Phạm Hải Đăng",
      email: "dang.pham@gmail.com",
      phone: "0903 112 233",
      role: "CUSTOMER",
      tier: "Silver",
      points: 500,
      avatar: "/images/hanoia/logo-circle-h.png",
      createdAt: "25/04/2026",
      isActive: true,
      password: "customer123",
    },
  ],
  media: [
    {
      id: "med-1",
      fileName: "logo-lettering.png",
      fileUrl: "/images/hanoia/logo-lettering.png",
      fileSize: 18450,
      uploadedAt: "28/09/2026",
    },
    {
      id: "med-2",
      fileName: "hero-banner-1.webp",
      fileUrl: "/images/hanoia/hero-banner-1.webp",
      fileSize: 124500,
      uploadedAt: "28/09/2026",
    },
  ],
  pages: everiePages as PageContent[],
  bespokeRequests: [],
};

/**
 * Đọc dữ liệu từ file JSON, nếu chưa có sẽ tự sinh từ dữ liệu mặc định
 */
function hydrateDatabase(parsed: CMSDatabase): CMSDatabase {
  const pagesSource =
    parsed.pages && parsed.pages.length > 0
      ? parsed.pages
      : defaultDatabase.pages;

  // Make sure all core pages in defaultDatabase (like page-home) are present in the list
  const existingIds = new Set(pagesSource.map((p) => p.id));
  const mergedPages = [...pagesSource];
  for (const defPage of defaultDatabase.pages) {
    if (!existingIds.has(defPage.id)) {
      mergedPages.unshift(defPage);
    }
  }

  return {
    ...defaultDatabase,
    ...parsed,
    schemaVersion: parsed.schemaVersion ?? CURRENT_SCHEMA_VERSION,
    settings: { ...defaultDatabase.settings, ...parsed.settings },
    bespokeRequests: parsed.bespokeRequests ?? defaultDatabase.bespokeRequests,
    menus: parsed.menus?.length ? parsed.menus : defaultDatabase.menus,
    heroSlides: parsed.heroSlides?.length
      ? parsed.heroSlides
      : defaultDatabase.heroSlides,
    topPicks: parsed.topPicks?.length
      ? parsed.topPicks
      : defaultDatabase.topPicks,
    products: parsed.products?.length
      ? parsed.products
      : defaultDatabase.products,
    stores: (() => {
      const incoming = parsed.stores;
      const sample = incoming?.[0]?.stores?.[0] as
        | { image?: string }
        | undefined;
      // Re-seed if disk stores lack enriched boutique fields
      if (!incoming?.length || !sample?.image) return defaultDatabase.stores;
      return incoming;
    })(),
    orders: parsed.orders ?? defaultDatabase.orders,
    users: parsed.users?.length ? parsed.users : defaultDatabase.users,
    media: parsed.media ?? defaultDatabase.media,
    pages: mergedPages.map((page) => {
      const fallback = defaultDatabase.pages.find(
        (item) => item.id === page.id || item.slug === page.slug,
      );
      const isContactPage = page.id === "page-contact" || page.slug === "contact";
      const hasOutdatedContact =
        isContactPage &&
        (!page.sections?.some((s) => s.id === "contact-form") ||
          page.sections?.some((s) => s.id === "contact-hero"));

      const baseSections =
        page.sections?.length && !hasOutdatedContact
          ? page.sections
          : (fallback?.sections ?? []);

      return {
        ...fallback,
        ...page,
        sections: baseSections.map((section) => {
          const fallbackSection = fallback?.sections.find(
            (item) => item.id === section.id,
          );
          return {
            ...fallbackSection,
            ...section,
            items:
              (section.items?.length ?? 0) >=
              (fallbackSection?.items?.length ?? 0)
                ? (section.items ?? [])
                : (fallbackSection?.items ?? section.items ?? []),
          };
        }),
      };
    }),
  };
}

/** Hash any legacy plaintext passwords in place. Returns true when something changed. */
function migratePasswords(db: CMSDatabase): boolean {
  let changed = false;
  for (const user of db.users ?? []) {
    if (user.password && !isHashed(user.password)) {
      let plain = user.password;
      // Demo seed admin: let ADMIN_INITIAL_PASSWORD replace the published default.
      if (user.id === "usr-1" && plain === "admin123" && process.env.ADMIN_INITIAL_PASSWORD) {
        plain = process.env.ADMIN_INITIAL_PASSWORD;
      }
      user.password = hashPassword(plain);
      changed = true;
    }
  }
  // A store started before ADMIN_INITIAL_PASSWORD was set may hold a hash of the
  // published default; swap it once (checked once per process).
  if (process.env.ADMIN_INITIAL_PASSWORD && !defaultAdminChecked) {
    defaultAdminChecked = true;
    const admin = db.users?.find((u) => u.id === "usr-1");
    if (admin?.password && isHashed(admin.password) && bcryptCompareSync("admin123", admin.password)) {
      admin.password = hashPassword(process.env.ADMIN_INITIAL_PASSWORD);
      changed = true;
    }
  }
  return changed;
}

let defaultAdminChecked = false;
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

async function backupFile(reason: string): Promise<string | null> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = DB_PATH.replace(/\.json$/, `.bak-${reason}-${stamp}.json`);
  try {
    await fs.copyFile(DB_PATH, target);
    return target;
  } catch {
    return null;
  }
}

function seedDatabase(): CMSDatabase {
  const seed = structuredClone(defaultDatabase);
  migratePasswords(seed);
  return seed;
}

export async function getDatabase(): Promise<CMSDatabase> {
  let raw: string;
  try {
    raw = await fs.readFile(DB_PATH, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    // First run: create the store from the seed.
    const seed = seedDatabase();
    await saveDatabase(seed);
    return seed;
  }

  let parsed: CMSDatabase;
  try {
    parsed = JSON.parse(raw) as CMSDatabase;
  } catch (err) {
    // Never silently reset real data: keep a copy and fail loudly.
    const backup = await backupFile("corrupt");
    console.error(`[store] ${DB_PATH} is not valid JSON. Backup: ${backup ?? "failed"}`, err);
    throw new Error("Dữ liệu CMS bị hỏng (JSON không hợp lệ). Đã sao lưu, cần khôi phục thủ công.");
  }

  let needsSave = false;
  if ((parsed.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION) {
    // Older schema: back up, then merge missing defaults instead of wiping data.
    await backupFile(`schema-v${parsed.schemaVersion ?? 0}`);
    parsed.schemaVersion = CURRENT_SCHEMA_VERSION;
    needsSave = true;
  }
  const hydrated = hydrateDatabase(parsed);
  if (migratePasswords(hydrated)) needsSave = true;

  const sampleStore = parsed.stores?.[0]?.stores?.[0] as
    | { image?: string }
    | undefined;
  const pagesNeedItemFill =
    !parsed.pages?.length ||
    parsed.pages.some((page) => {
      if (
        (page.id === "page-contact" || page.slug === "contact") &&
        (!page.sections?.some((s) => s.id === "contact-form") ||
          page.sections?.some((s) => s.id === "contact-hero"))
      ) {
        return true;
      }
      const hydratedPage = hydrated.pages.find((item) => item.id === page.id);
      if (!hydratedPage) return true;
      return (page.sections ?? []).some((section) => {
        const hydratedSection = hydratedPage.sections.find(
          (item) => item.id === section.id,
        );
        return (
          (section.items?.length ?? 0) <
          (hydratedSection?.items?.length ?? 0)
        );
      });
    });

  if (
    needsSave ||
    !parsed.users?.length ||
    !parsed.products?.length ||
    !sampleStore?.image ||
    pagesNeedItemFill
  ) {
    await saveDatabase(hydrated);
  }
  return hydrated;
}

let writeQueue: Promise<void> = Promise.resolve();

/**
 * Atomic save: write a temp file then rename over the store, serialized so
 * concurrent requests never interleave partial writes.
 */
export function saveDatabase(data: CMSDatabase): Promise<void> {
  // `next build` prerenders pages: never rewrite the store (or hash passwords) at build time.
  if (IS_BUILD) return Promise.resolve();
  const run = async () => {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const tmp = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tmp, DB_PATH);
  };
  const next = writeQueue.then(run, run);
  writeQueue = next.catch(() => undefined);
  return next;
}
