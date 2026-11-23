import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

/** One-way offline import. Requires a separately obtained private JSON backup and
 * all referenced, hash-verified media under public/uploads/ar. Never connects
 * to Supabase or alters the external service.
 */
const root = process.cwd();
const sourcePath = path.resolve(process.argv[2] || "data/ar-artworks.bak-supabase-20261123.json");
const targetPath = path.join(root, "data", "ar-artworks.json");
const mediaRoot = path.join(root, "public", "uploads", "ar");
const archive = JSON.parse(await fs.readFile(sourcePath, "utf8"));
if (!Array.isArray(archive.artworks) || !Array.isArray(archive.files))
  throw new Error("Invalid legacy AR backup.");

const manifestPaths = new Set();
for (const file of archive.files) {
  if (typeof file.path !== "string" || !/^[a-f0-9-]+\/(target\.(png|jpg|jpeg|webp|mind)|overlay\.(mp4|webm)|layers\/[0-9]{2}-[a-f0-9]{8}\.(mp4|webm|jpg|jpeg|png|webp|glb))$/.test(file.path))
    throw new Error("Unrecognized legacy media path.");
  const mediaPath = path.join(mediaRoot, file.path);
  if (!mediaPath.startsWith(mediaRoot + path.sep)) throw new Error("Unsafe media path");
  const buffer = await fs.readFile(mediaPath);
  if (buffer.byteLength !== file.bytes || createHash("sha256").update(buffer).digest("hex") !== file.sha256)
    throw new Error("Media checksum mismatch: " + file.path);
  manifestPaths.add(file.path);
}
let current;
try { current = JSON.parse(await fs.readFile(targetPath, "utf8")); }
catch (cause) {
  if (cause.code !== "ENOENT") throw cause;
  current = { schemaVersion: 1, artworks: [], collections: {} };
}
if (current.schemaVersion !== 1 || !Array.isArray(current.artworks) ||
  !current.collections || typeof current.collections !== "object") throw new Error("Invalid target data.");
let imported = 0;
for (const row of archive.artworks) {
  const paths = [row.target_image_path, row.target_file_path, row.overlay_path,
    ...(row.ar_config?.layers ?? []).map(x => x.assetPath)].filter(Boolean);
  if (!paths.every(file => manifestPaths.has(file))) throw new Error("Archive is missing media for " + row.slug);
  if (current.artworks.some(x => x.id === row.id || x.slug === row.slug)) continue;
  current.artworks.push({
    id: row.id, ownerId: row.everie_owner_id ?? null,
    slug: row.slug, title: row.title, artistName: row.artist_name,
    description: row.description ?? "", status: row.status,
    targetImagePath: row.target_image_path, targetFilePath: row.target_file_path,
    overlayPath: row.overlay_path ?? null, overlayType: row.overlay_type ?? null,
    overlayAspectRatio: row.overlay_aspect_ratio ?? null,
    arMode: row.ar_mode ?? "motion_extract", arConfig: row.ar_config ?? {},
    createdAt: row.created_at, publishedAt: row.published_at ?? null,
    viewCount: Math.max(0, Number(row.view_count ?? 0)),
  });
  imported++;
}
if (imported) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const temp = targetPath + "." + randomUUID() + ".tmp";
  try {
    await fs.writeFile(temp, JSON.stringify(current, null, 2), { mode: 0o600, flag: "wx" });
    await fs.rename(temp, targetPath);
  } catch (cause) {
    await fs.rm(temp, { force: true }).catch(() => undefined);
    throw cause;
  }
}
console.log(JSON.stringify({ imported, total: current.artworks.length, verifiedMediaFiles: manifestPaths.size }));
