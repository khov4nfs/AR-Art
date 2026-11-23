import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Artwork } from "@/features/artwork/domain/artwork";

export interface StoredArtwork extends Artwork { viewCount: number; }
export interface ArData { schemaVersion: 1; artworks: StoredArtwork[]; collections: Record<string, string[]>; }
const filePath = path.join(process.cwd(), "data", "ar-artworks.json");
const fresh = (): ArData => ({ schemaVersion: 1, artworks: [], collections: {} });

/** Read private state; never silently replace a corrupted file. */
export async function readArData(): Promise<ArData> {
  let source: string;
  try { source = await fs.readFile(filePath, "utf8"); }
  catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") return fresh();
    throw cause;
  }
  const parsed: unknown = JSON.parse(source);
  if (!parsed || typeof parsed !== "object") throw new Error("AR data is corrupt.");
  const data = parsed as Partial<ArData>;
  if (data.schemaVersion !== 1 || !Array.isArray(data.artworks) || !data.collections ||
      typeof data.collections !== "object" || Array.isArray(data.collections)) {
    throw new Error("Unrecognized AR data schema; restore a backup.");
  }
  return data as ArData;
}

let queue: Promise<unknown> = Promise.resolve();
/** Serialized atomic transactions for the single-container EVERIE VPS. */
export function updateArData<T>(fn: (data: ArData) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const data = await readArData();
    const result = await fn(data);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temp = filePath + "." + process.pid + "." + randomUUID() + ".tmp";
    try {
      await fs.writeFile(temp, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
      await fs.rename(temp, filePath);
    } catch (cause) {
      await fs.rm(temp, { force: true }).catch(() => undefined);
      throw cause;
    }
    return result;
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}
