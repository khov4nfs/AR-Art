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

### Ready-to-run production handoff

See [deploy/HANDOFF.md](deploy/HANDOFF.md) for the no-source-edit production
configuration, preflight, automatic backup/deploy/smoke/rollback, and
verification requirements. Existing production secrets, accounts and mounts
are preserved. Run ./deploy/production.sh check before deployment.

### VPS deployment sequence

1. Verify trusted SSH host key and access, then back up
   /opt/everievn/data and /opt/everievn/public/uploads.
2. Keep the existing SESSION_SECRET and other EVERIE settings in the private
   deploy/.env.
3. Run docker compose --env-file deploy/.env -f deploy/docker-compose.vps.yml config --quiet.
4. Build and deploy the single app container using existing vms_edge network
   and original EVERIE volumes.
5. Smoke-test shop, login/logout, Gallery, create/publish, Studio ownership,
   collection/view counters and /uploads/ar/ on HTTP Range. Validate physical
   camera tracking and video sync in Safari iOS and Chrome Android.

Maintain a rollback image and a private backup. ffmpeg/ffprobe for source MOV
conversion are included in the Docker runner. Before deployment, run npm run check.

For the **Fogewise standalone systemd demo**, FFmpeg/FFprobe are *not* bundled
by Next.js standalone output. Install the authenticated Ubuntu `ffmpeg` package
on the host and verify both commands are reachable by the service account:

```bash
sudo apt-get update
sudo apt-get install --no-install-recommends ffmpeg
sudo -u ar-art-integrated ffprobe -version
sudo -u ar-art-integrated ffmpeg -encoders | grep libx264
```

The AR video conversion endpoint now checks both tools **before** uploading the
original MOV/MP4/WebM; without them it responds with a server-unavailable error
instead of incorrectly reporting that the video is unreadable. Source limits
remain 240 MB and 60 seconds; the finished AR MP4 must be at most 6 MB.
