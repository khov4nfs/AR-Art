import { NodeIO, type Document } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

export interface GlbStats {
  bytes: number;
  triangles: number;
  vertices: number;
  meshes: string[];
  materials: string[];
  textures: number;
  maxTexture: number;
  draco: boolean;
}

export const GLB_LIMITS = { bytes: 3 * 1024 * 1024, triangles: 100_000 };
const TARGET_TRIS = 60_000;

async function io() {
  await MeshoptDecoder.ready;
  await MeshoptEncoder.ready;
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });
}

function countTris(doc: Document) {
  let tris = 0;
  let verts = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      const idx = prim.getIndices();
      verts += pos?.getCount() ?? 0;
      if (prim.getMode() === 4) tris += Math.floor((idx?.getCount() ?? pos?.getCount() ?? 0) / 3);
    }
  }
  return { tris, verts };
}

async function statsOf(doc: Document, bytes: number): Promise<GlbStats> {
  const { tris, verts } = countTris(doc);
  let maxTexture = 0;
  for (const tex of doc.getRoot().listTextures()) {
    const size = tex.getSize();
    if (size) maxTexture = Math.max(maxTexture, size[0], size[1]);
  }
  return {
    bytes,
    triangles: tris,
    vertices: verts,
    meshes: doc.getRoot().listMeshes().map((m) => m.getName()),
    materials: doc.getRoot().listMaterials().map((m) => m.getName()),
    textures: doc.getRoot().listTextures().length,
    maxTexture,
    draco: doc.getRoot().listExtensionsUsed().some((e) => e.extensionName === "KHR_draco_mesh_compression"),
  };
}

/** Read stats; Draco files can't be decoded here (no draco3d), so report that instead of failing. */
export async function inspectGlb(buf: Uint8Array): Promise<GlbStats> {
  const reader = await io();
  try {
    const doc = await reader.readBinary(buf);
    return statsOf(doc, buf.byteLength);
  } catch (e) {
    if (/draco/i.test(String(e))) {
      return { bytes: buf.byteLength, triangles: -1, vertices: -1, meshes: [], materials: [], textures: 0, maxTexture: 0, draco: true };
    }
    throw e;
  }
}

/** weld → simplify (~60k tris) → WebP ≤2048 textures → meshopt. Keeps material/mesh names. */
export async function optimizeGlb(buf: Uint8Array) {
  const rw = await io();
  const doc = await rw.readBinary(buf);
  const before = await statsOf(doc, buf.byteLength);
  const ratio = before.triangles > TARGET_TRIS ? TARGET_TRIS / before.triangles : 1;
  await doc.transform(
    dedup(),
    weld(),
    ...(ratio < 1 ? [simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002, lockBorder: false })] : []),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [2048, 2048], quality: 85 }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );
  const out = await rw.writeBinary(doc);
  const after = await statsOf(await rw.readBinary(out), out.byteLength);
  return { out, before, after };
}
