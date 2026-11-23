# Everie / Hanoia E-Commerce Website

Website thương mại điện tử và trang quản trị (Admin Dashboard) xây dựng trên Next.js App Router, Tailwind CSS và shadcn/ui.

## Công nghệ sử dụng
- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4, Base UI / Radix primitives, Lucide React
- **Data & Store**: File-based atomic JSON storage (`data/cms-store.json`) & API routes

## Cấu trúc thư mục chính
```
src/
  app/
    (storefront)/       # Giao diện người dùng mua sắm (Storefront)
    admin/              # Trang quản trị quản lý sản phẩm, đơn hàng, người dùng, cài đặt
    api/                # Next.js API Routes (CRUD products, categories, orders, auth...)
  components/           # UI Components (Storefront, Admin, Common)
  context/              # React Contexts (Cart, Auth, Theme, Settings, Language)
  hooks/                # Custom hooks
  lib/                  # Utilities & Store data layer
  types/                # TypeScript interface definitions
public/                 # Ảnh, media & static assets
data/                   # Dữ liệu lưu trữ JSON (cms-store.json)
```

## Hướng dẫn cài đặt và chạy dự án

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy môi trường Development
```bash
npm run dev
```
Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để xem trang bán hàng.
Trang quản trị: [http://localhost:3000/admin](http://localhost:3000/admin).

### 3. Build & kiểm tra
```bash
npm run typecheck   # Kiểm tra lỗi TypeScript
npm run build       # Build production
npm run start       # Chạy server production
```

## EVERIE Digital Atelier (AR integrated)

`everievn-main` is the canonical Next.js storefront/admin source. AR Art is integrated as an internal feature module (`src/features/{ar-experience,artwork,auth,collection,gallery,studio}`) with separate Supabase persistence. The product catalog, orders, customer accounts and CMS remain the original EVERIE file-backed application.

| Route | Function |
| --- | --- |
| `/` | Original EVERIE storefront and product discovery |
| `/admin` | Existing EVERIE CMS/admin (unchanged login/session) |
| `/admin/ar` | AR hub in EVERIE admin |
| `/gallery` | Public AR gallery, newest and most viewed |
| `/ar` | Universal image scanner |
| `/ar/[slug]` | Single image-tracked AR animation (QR destination) |
| `/art/[slug]` | Public artwork details and QR |
| `/studio/products` | AR artwork publishing/management |
| `/create` | Upload target image and animation, generate `.mind` and QR |
| `/ar-login` | Legacy redirect to the shared EVERIE `/login` |

**Product linkage:** Admin > Products > editing a product > AR artwork slug. It is a reference to an already published AR artwork slug and exposes a “Trải nghiệm AR” CTA on the public product detail page. Existing GLB 3D configurator remains independent.

### AR setup

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as environment secrets. Use the existing `supabase/schema.sql` and migrations for new installs. Never expose the service-role key to the browser. In production, ensure these public values exist at **Docker build time** via Compose build args and at runtime. AR publishing and collection use the same HttpOnly `everie_session` as storefront, checkout and admin. Supabase Auth is not used for new AR logins.

The AR video-conversion server uses `ffmpeg` and `ffprobe`; both are installed in the VPS Docker runner image. Preserve the existing `/opt/everievn/data` and `/opt/everievn/public/uploads` volume mounts. Do not commit `data/cms-store.json`, sample user uploads, or local session secrets. A local copy of runtime data may be needed when migrating an existing installation.

### Validation

`npm run check` runs AR domain tests plus ESLint, TypeScript and Next production build. After deploying, perform physical camera tests on iOS Safari and Android Chrome to validate video/image scale, stabilisation, and alpha playback. Production deployment requires applying `supabase/everie-unified-identity.sql`, configuring server Supabase credentials in `deploy/.env`, backing up VPS data, and validating mobile camera tracking before switching traffic.

### Three.js compatibility

EVERIE keeps Three.js 0.183 for the advanced GLB configurator. `mind-ar@1.2.5` embeds a legacy renderer call; the pinned `scripts/patch-mindar-three.mjs` postinstall adapter converts the removed `sRGBEncoding`/`outputEncoding` names to `SRGBColorSpace`/`outputColorSpace`. The browser-only `node-fetch` shim prevents bundling Node HTTP/FS modules through MindAR's TensorFlow dependency. `npm run dev` and `npm run build` explicitly run the compatibility adapter, because the optional native `canvas` dependency is not required for browser AR and dependency installation scripts are disabled for portable CI/Docker installs. The adapter fails closed if the pinned MindAR bundle changes unexpectedly. Validate on physical mobile cameras before production cutover.

### Unified EVERIE login for AR

AR Studio, scanner Collection and checkout share the original EVERIE account. The browser never receives Supabase server credentials. AR writes require the signed `everie_session` cookie plus same-origin verification, while AR asset uploads use short-lived signed URLs. Only the Next.js server may access `everie_user_collection` via the server key.

The additive migration at `supabase/everie-unified-identity.sql` adds `artworks.everie_owner_id` and `everie_user_collection`, leaving older Supabase Auth-owned artworks untouched and publicly visible. Do **not** silently map existing Supabase Auth creators to EVERIE by unverified email; a separate proof-of-ownership/administrator reconciliation is required. Never delete legacy Supabase users or media during cutover.

The VPS Compose config now **refuses to start** without `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Put them exclusively in the private VPS `deploy/.env` (mode 0600), not in the repository or browser. Verify `docker compose --env-file deploy/.env -f deploy/docker-compose.vps.yml config --quiet` after backing up the existing `/opt/everievn/data` and `/opt/everievn/public/uploads` volumes, and keep a rollback image/tag.
