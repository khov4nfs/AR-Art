# Production handoff — EVERIE + AR

## One app and one account

The same Next.js service serves EVERIE commerce, administration and AR at
/gallery, /ar, /create, /studio/products and /collection. Authentication
uses the existing signed HttpOnly everie_session cookie, its original
SESSION_SECRET and the existing EVERIE CMS user store. There is no
separate AR login, user database, or Supabase runtime dependency.
Legacy /ar-login links redirect to EVERIE /login.

Fogewise demo and EVERIE production are different hosts with separate
private data and cookies. Never move Fogewise demo credentials, sessions,
or CMS seed data to the production VPS.

## Existing production volumes

| Data | VPS path | Container path |
| --- | --- | --- |
| CMS, accounts, orders | /opt/everievn/data/ | /app/data |
| AR, views, collections | /opt/everievn/data/ar-artworks.json | /app/data/ar-artworks.json |
| Public media + uploads | /opt/everievn/public/uploads/ | /app/public/uploads |

Only public images/videos/.mind/GLB assets belong under public. Never store
credentials, private Collections, or user records in public. Use only
ONE web container writing to these JSON files.

The preflight refuses missing or malformed existing CMS data to avoid
seeding demo accounts in production. Production data and upload dirs must
be writable by UID:GID 1000:1000 (official Node image user).

## Requirements

On the production VPS: provider-verified SSH host key, Docker with Compose
v2, Node 22+, Python 3, curl, tar, sha256sum, free backup capacity,
existing network vms_edge, and a production TLS reverse proxy routing
everievn.com to everievn-web:3000 on that network.

Do NOT use the Fogewise SSH alias for production deployment.

## Configure once, no source edits

If production already has deploy/.env, retain it, especially the original
SESSION_SECRET. Do not overwrite it with the example or rotate the signing key.
For a new deployment against an existing production CMS:

~~~bash
cp deploy/.env.production.example deploy/.env
chmod 600 deploy/.env
# Supply the SAME existing production SESSION_SECRET in deploy/.env.
# SITE_URL and volume/network/container defaults already target EVERIE VPS.
~~~

Optional SMTP_* and HUNYUAN3D_* keys belong in deploy/.env and are forwarded
into the container at runtime. Generate 3D only works when a functioning
HUNYUAN3D_API_URL is configured. There are no new GLB processing steps.

The application origin is SITE_URL=https://everievn.com. The runtime
CSRF checks expect this HTTPS origin. COOKIE_SECURE must not be false.

## Deploy, verify and roll back

Run from the repository root on the production VPS:

~~~bash
./deploy/production.sh check
./deploy/production.sh deploy
./deploy/production.sh smoke
# Or create a backup without deploying:
./deploy/production.sh backup
~~~

Check validates: HTTPS origin, session secret, existing CMS, AR registry
schema (when present), writable host mounts, existing proxy network,
and current container mount consistency.

Deploy creates a dated backup of both mounted directories with checksums,
tags the previous image for rollback, builds/starts the integrated app,
waits for health, and runs anonymous HTTP and public HTTPS smoke tests.
It does NOT run docker down --volumes, prune, or overwrite CMS data.

The /api/health endpoint returns 200 only if data and uploads are readable
and writable, 503 otherwise. No account or filesystem content is exposed.

Backups are stored under /opt/everievn/backups/handoff-... (override with
EVERIE_BACKUP_ROOT). Transfer a copy offsite. The tar backup runs while
requests may still modify data; schedule a low-write maintenance window
for a consistent full snapshot.

To restore the previous application image (without changing CMS/media):

~~~bash
./deploy/production.sh rollback /opt/everievn/backups/handoff-YYYYMMDDTHHMMSSZ-XXXXXXXX
~~~

A full data restore must be handled separately, after verifying checksums
and obtaining approval. Rollback does not automatically replace private data.

## Optional legacy artwork import

The Supabase migration archive and associated media are private files,
excluded from Git and Docker. To preserve the single historical artwork
on production, copy data/ar-artworks.bak-supabase-20261123.json into the
existing production data volume, and its three verified media objects into
the uploads/ar directory, without overwriting existing data. Then run:

~~~bash
docker exec everievn-web node scripts/import-legacy-ar-backup.mjs \
  data/ar-artworks.bak-supabase-20261123.json
~~~

The importer verifies file checksums and never silently assigns an old
Supabase user to an unrelated EVERIE account by email.

## Acceptance checklist

- Public homepage, /gallery, /ar, /login and published /ar/[slug] return 200.
- AR scanning works for guests; saving a recognized work uses the shared
  EVERIE account and is protected by HTTP 401 for guests.
- Existing EVERIE admin, customer login, catalog and orders remain intact.
- Uploaded images/.mind/GLB return 200, MP4 range requests return 206.
- Verify complete create/upload/publish/Collection flows with real accounts.
- Test image tracking and video stability on physical iOS Safari and Android
  Chrome devices before final acceptance.

Source and CI tests cannot substitute for verifying the real production
SSH key, secrets, existing CMS, proxy or mobile-camera behavior.
