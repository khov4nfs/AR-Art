# EVERIE: post-process an image-to-3D GLB (Hunyuan3D-2 output) for the configurator.
# Usage: python ai3d-postprocess.py raw.glb source-photo.jpg out.glb 60000
# Needs: pip install trimesh numpy scipy pillow fast-simplification
# Then: npx @gltf-transform/cli optimize out.glb final.glb --compress meshopt --simplify false
import sys, numpy as np, trimesh, colorsys
from PIL import Image
import fast_simplification
src, img, out, target = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
m = trimesh.load(src).to_geometry()
if target < len(m.faces):
    v, f = fast_simplification.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32), target_count=target)
else:
    v, f = m.vertices.astype(np.float32), m.faces.astype(np.int32)
m = trimesh.Trimesh(v, f, process=True)
m.merge_vertices()
trimesh.smoothing.filter_taubin(m, iterations=6)
trimesh.repair.fix_winding(m); trimesh.repair.fix_inversion(m, multibody=True)
print('watertight', m.is_watertight, 'winding', m.is_winding_consistent)
im = np.asarray(Image.open(img).convert("RGB")).astype(np.float32) / 255
mask = (im.min(axis=2) < 0.9)
ys, xs = np.where(mask)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
b = m.bounds
V = m.vertices
u = x0 + (V[:, 0] - b[0, 0]) / (b[1, 0] - b[0, 0]) * (x1 - x0)
w = y1 - (V[:, 1] - b[0, 1]) / (b[1, 1] - b[0, 1]) * (y1 - y0)
# Fit the projection to the photo silhouette (scale/offset grid search).
cx, cy = u.mean(), w.mean()
sample = np.random.default_rng(0).choice(len(u), min(6000, len(u)), replace=False)
best = (-1, 1, 1, 0, 0)
msmall = mask[: mask.shape[0] // 8 * 8, : mask.shape[1] // 8 * 8].reshape(mask.shape[0] // 8, 8, mask.shape[1] // 8, 8).mean((1, 3)) > 0.5
for sx in np.linspace(0.8, 1.2, 9):
    for sy in np.linspace(0.85, 1.15, 7):
        for dx in range(-60, 61, 10):
            for dy in range(-60, 61, 10):
                uu = (cx + (u[sample] - cx) * sx + dx).round().astype(int).clip(0, msmall.shape[1] * 8 - 1)
                ww = (cy + (w[sample] - cy) * sy + dy).round().astype(int).clip(0, msmall.shape[0] * 8 - 1)
                hit = np.zeros(msmall.shape, bool); hit[ww // 8, uu // 8] = True
                sc = mask[ww, uu].mean() * (hit & msmall).sum() / msmall.sum()
                if sc > best[0]: best = (sc, sx, sy, dx, dy)
print("fit", best)
_, sx, sy, dx, dy = best
u = cx + (u - cx) * sx + dx; w = cy + (w - cy) * sy + dy
ui = np.clip(u.round().astype(int), 0, im.shape[1] - 1); wi = np.clip(w.round().astype(int), 0, im.shape[0] - 1)
# sample with small blur, ignoring white bg: search nearest masked pixel
from scipy import ndimage
idx = ndimage.distance_transform_edt(~mask, return_distances=False, return_indices=True)
ny, nx = idx[0][wi, ui], idx[1][wi, ui]
col = ndimage.uniform_filter(im, size=(5, 5, 1))[ny, nx]
hsv = np.array([colorsys.rgb_to_hsv(*c) for c in col])
h, s, val = hsv[:, 0], hsv[:, 1], hsv[:, 2]
green = (h > 0.2) & (h < 0.55) & (s > 0.1)
gold = (h > 0.08) & (h <= 0.18) & (s > 0.35)
cls = np.where(gold, 2, np.where(green, 1, 0))
# Height prior: nothing below the lowest blossom row in the photo is petal.
pim = np.asarray(Image.open(img).convert("HSV")).astype(np.float32) / 255
pink = mask & ((pim[..., 0] > 0.85) | (pim[..., 0] < 0.06)) & (pim[..., 1] > 0.12)
prow = np.percentile(np.where(pink)[0], 99.5)
cls[(w > prow + 6) & (cls == 0)] = 1
# smooth labels across neighbours (majority vote over 2 rings)
adj = m.vertex_neighbors
for _ in range(6):
    cls = np.array([np.bincount(np.r_[cls[i], cls[n]], minlength=3).argmax() if len(n) else cls[i] for i, n in enumerate(adj)])
face_cls = np.array([np.bincount(cls[t], minlength=3).argmax() for t in m.faces])
lum = col.mean(axis=1)
scene = trimesh.Scene()
names = {0: ("petal", "glaze"), 1: ("stem", "leaf"), 2: ("stamen", "gold")}
base = {0: None, 1: (0.62, 0.70, 0.60), 2: (0.80, 0.63, 0.30)}
for k, (mesh_name, mat_name) in names.items():
    sel = np.where(face_cls == k)[0]
    if not len(sel): continue
    sub = m.submesh([sel], append=True)
    sv = sub.vertices
    # recover per-vertex lum via nearest original vertex
    from scipy.spatial import cKDTree
    _, nn = cKDTree(V).query(sv)
    l = lum[nn]
    if k == 0:
        lo, hi = np.percentile(l, 5), np.percentile(l, 98)
        rel = np.clip(0.72 + 0.3 * (l - lo) / max(1e-3, hi - lo), 0.72, 1.0)
        vc = np.stack([rel, rel, rel], 1)
        color = [217, 140, 148, 255]
        pbr = trimesh.visual.material.PBRMaterial(name=mat_name, baseColorFactor=color, roughnessFactor=0.4, metallicFactor=0.001, doubleSided=True)
    else:
        vc = (np.clip(col[nn], 0, 1) ** 2.2) if k == 1 else np.tile(base[k], (len(sv), 1)) ** 2.2
        pbr = trimesh.visual.material.PBRMaterial(name=mat_name, baseColorFactor=[255, 255, 255, 255], roughnessFactor=0.45 if k == 1 else 0.25, metallicFactor=0.001 if k == 1 else 0.8, doubleSided=True)
    sub.visual = trimesh.visual.ColorVisuals(sub, vertex_colors=(np.c_[vc, np.ones(len(vc))] * 255).astype(np.uint8))
    tm = trimesh.Trimesh(sub.vertices, sub.faces, vertex_colors=sub.visual.vertex_colors, process=False)
    tm.visual.material = pbr  # trimesh keeps vertex colors + material in glTF export
    scene.add_geometry(tm, node_name=mesh_name, geom_name=mesh_name)
    print(mesh_name, len(sub.faces))
scene.export(out, include_normals=True)
