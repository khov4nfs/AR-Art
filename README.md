# AR Art

Open-source browser AR for physical artwork. Creators upload an artwork image and an AR video, AR Art compiles the MindAR tracking target in the browser, stores the assets, publishes a visitor page, and generates a QR code.

## Product flow

```text
Creator
  → /create
  → artwork info + target image + AR video
  → browser compiles target.mind
  → signed direct upload to Supabase Storage
  → metadata saved in Postgres
  → QR generated for /ar/[slug]

Visitor
  → opens /ar to discover published artworks OR scans a QR
  → /ar/[slug] for a single artwork
  → camera recognizes physical artwork
  → AR video locks onto it
```

## Universal AR scanner (MVP)

- Open `/ar` on a phone and tap **Open camera** after target preparation completes.
- The public scanner loads **up to 6 distinct, published artwork images**, compiles a temporary multi-target MindAR bundle in the browser, and uses `targetIndex` to choose the correct artwork overlay. Published records with the same target-image storage path are deduplicated.
- Only the recognized artwork's motion or 3D scene is loaded. MindAR tracks one target at a time to limit mobile GPU load.
- Recognition by MindAR's actual `targetFound` event is the sole Collection trigger. Anonymous visitors can scan but need to sign in to save a work; owners do not auto-collect their own work.
- Individual QR links continue to open `/ar/[slug]`. The original MindAR sample is available at `/ar/demo` using `/demo-target`.
- The compiler downloads published images cross-origin: Supabase Storage must allow CORS. Preparation can take time on a phone; for larger exhibitions, build/cache image-target bundles in advance rather than raising the six-target limit.

## Implemented

- Next.js 16 App Router + React 19
- Tailwind CSS 4
- shadcn/ui-compatible local primitives
- Atomic Design for shared UI
- feature-based Clean Architecture
- MindAR image-target tracking
- browser-side MindAR target compilation
- Three.js AR renderer
- image-tracked video overlays
- creator upload page
- Supabase Postgres metadata
- Supabase Storage with signed direct uploads
- public artwork page
- dynamic AR page per artwork
- downloadable QR generation
- zero-config demo routes remain available

## Architecture

```text
src/
├── app/                              # routes / API composition only
├── components/
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   └── templates/
├── features/
│   ├── ar-experience/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   └── artwork/
│       ├── domain/
│       ├── application/
│       │   ├── ports/
│       │   └── use-cases/
│       ├── infrastructure/
│       │   └── supabase/
│       └── presentation/
└── lib/
```

Dependencies point inward: presentation → application → domain. Supabase and MindAR are infrastructure adapters behind application ports/use cases.

## Tech choices

- **Next.js 16.3.5 / React 19.3 / Tailwind CSS 4.3**
- **@supabase/supabase-js 2.117.2** for free-tier Postgres + object storage
- **qrcode 1.5.4** for QR output
- **MindAR 1.2.5** for free/open-source browser image tracking
- **Three.js 0.160.1** intentionally pinned for compatibility with MindAR 1.2.5
- **TypeScript 6.0.2** intentionally pinned to the supported Next/typescript-eslint API line

No paid AR SDK is required.

## Local setup

Requirements: Node.js 22+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The basic demo at `/ar` works without Supabase. The creator/published artwork workflow needs Supabase.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy the project URL, publishable key, and service-role key into `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_ASSET_BUCKET=ar-art-assets
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

The bucket is public because published artwork media must be retrievable by visitors. Uploads are still protected: the browser receives short-lived signed upload tokens from the Next.js server and never receives the service-role key.

The MVP bucket limit is **6 MB per file**. This keeps standard signed uploads simple and reliable. For longer/larger videos, move the overlay upload path to Supabase's TUS resumable upload flow.

## Creator test

1. Open `/create`.
2. Enter artwork title, artist, and description.
3. Upload the physical artwork image (JPG/PNG/WebP).
4. Upload a short MP4/WebM animation.
5. Click **Publish & generate QR**.
6. Download or copy the generated QR.
7. Open the QR link on a phone.
8. Tap **Start AR** and point the camera at the physical artwork.

## Demo test

1. Open `/demo-target` on a laptop/second screen.
2. Open `/ar` on a phone.
3. Start the camera.
4. Point at the target image.
5. Confirm the Three.js overlay stays anchored while the camera moves.

## Production notes

- Camera access requires HTTPS outside localhost.
- Tracking works best with detailed, high-contrast target artwork.
- Public creator access can consume storage. Add authentication, quotas/rate limits, and draft cleanup before opening `/create` to an untrusted public audience.
- The current asset path is optimized for short exhibition loops. Large video uploads should use resumable TUS uploads.