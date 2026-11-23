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

## EVERIE + AR: one application, one account

The canonical Next.js application handles storefront, administration and AR.
EVERIE's existing signed HttpOnly everie_session cookie authenticates all AR
operations. AR has no login route of its own; use the existing /login.

### Persistence — the same approach as the EVERIE CMS

| Data | Private/public container path | Persistent VPS mount |
| --- | --- | --- |
| EVERIE CMS, users and orders | data/cms-store.json | /opt/everievn/data |
| AR artworks, views and collections | data/ar-artworks.json | /opt/everievn/data |
| EVERIE public media | public/uploads/ | /opt/everievn/public/uploads |
| AR images, .mind, MP4/WebM and GLB files | public/uploads/ar/<artwork-uuid>/ | /opt/everievn/public/uploads |

**Do not place credentials, passwords, user collections or database JSON in
public/**. Files under public/ are web-accessible; only intentionally public
AR media belongs there. Private AR JSON is atomically written in data/ with a
serialized queue. Use a **single application writer** as the EVERIE CMS does.

### Features and URLs

- / — EVERIE e-commerce, customer accounts, orders and checkout.
- /admin, /admin/ar — shared EVERIE administration; /admin/ar contains AR overview, all-creators product management, drafts, edit/delete, and in-place create/publish dialogs.
- /gallery — published AR products, newest shelf, popular sorting and views.
- /ar, /ar/[slug], /art/[slug] — AR camera, QR links, artwork details.
- /create — public image + video publishing using the shared EVERIE session. Legacy /studio and /studio/products redirect to /admin/ar; no independent AR management UI remains.
- /collection — saved AR discoveries under one EVERIE user account.
- /api/artworks/uploads — server upload with signed EVERIE cookie, origin
  checks, owner checks, content sniffing, 6 MB limit and short-lived path token.
- /uploads/ar/... — public media, including .mind and HTTP Range for video.

Product linking, storefront CMS and GLB configurator remain unchanged.

### Supabase archives (no runtime dependency)

Supabase SDK, runtime credentials, repository and deployment dependencies have
been removed. Prior SQL and migrations are preserved under
docs/legacy/ar-supabase/ only, outside active source.

The existing remote Supabase project is **not deleted**. A backup containing
one historical published work was written to the developer's private
data/ar-artworks.bak-supabase-20261123.json, with three media files and SHA-256
checksums under public/uploads/ar/. These assets are excluded from Git
and Docker images. They must be copied to the VPS persistent volumes before
the existing artwork can appear on the deployed site.

After deploying the new image and copying both backup and media into the existing volumes, import in the single EVERIE container with:

    docker exec everievn-web node scripts/import-legacy-ar-backup.mjs data/ar-artworks.bak-supabase-20261123.json

The offline script verifies all SHA-256 checksums, does not overwrite existing
artworks, and never assigns legacy Supabase Auth ownership to an EVERIE user
without a separate verified claim process.

### Ready-to-run production handoff

See [deploy/HANDOFF.md](deploy/HANDOFF.md) for the no-source-edit production
configuration, preflight, automatic backup/deploy/smoke/rollback, and
verification requirements. Existing production secrets, accounts and mounts
are preserved. Run ./deploy/production.sh check before deployment.

### VPS deployment sequence

1. Verify trusted SSH host key and access, then back up
   /opt/everievn/data and /opt/everievn/public/uploads.
2. Copy the private AR archive and media to the existing VPS volume paths,
   then run the offline importer, checking file counts and checksums.
3. Keep the existing SESSION_SECRET and other EVERIE settings in the private
   deploy/.env. No Supabase variables are necessary.
4. Run docker compose --env-file deploy/.env -f deploy/docker-compose.vps.yml config --quiet.
5. Build and deploy the single app container using existing vms_edge network
   and original EVERIE volumes.
6. Smoke-test shop, login/logout, Gallery, create/publish, Studio ownership,
   collection/view counters and /uploads/ar/ on HTTP Range. Validate physical
   camera tracking and video sync in Safari iOS and Chrome Android.

Maintain a rollback image and a private backup. ffmpeg/ffprobe for source MOV
conversion are included in the Docker runner. Before deployment, run npm run check.
