/**
 * Framework-free three.js scene for the EVERIE product configurator.
 * Imported only on the client (via next/dynamic) so three.js never ships in SSR.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import {
  ENGRAVE_CANVAS_H,
  ENGRAVE_CANVAS_W,
  engravingCssFont,
  engravingFontPx,
  engravingLetterSpacing,
  ENGRAVE_FONT_PX,
  ENGRAVE_MIN_SCALE,
  normalizeEngraving,
  type EngravingFontId,
} from "@/lib/engraving";

export type FlowerPreset = "rose" | "tulip";

/** Per-product seating of an uploaded GLB on the plinth (admin-tunable). */
export interface ModelFit {
  scale?: number; // 0.5–1.5
  rotY?: number; // degrees
  offsetY?: number; // scene units, + = up
}

export type { EngraveSpot } from "@/lib/engraving";
import type { EngraveSpot } from "@/lib/engraving";

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  preset?: FlowerPreset;
  glbUrl?: string;
  glazeHex: string;
  fit?: ModelFit;
  reducedMotion: boolean;
  onReady: () => void;
  onError: (err: unknown) => void;
}

export interface FlowerSceneApi {
  setGlaze: (hex: string) => void;
  setFit: (fit?: ModelFit) => void;
  setEngraving: (text: string, fontFamily: string, fontId: EngravingFontId) => void;
  setExplore: (on: boolean) => void;
  showFront: (ms?: number) => void;
  /** Rotate the engraving around the plinth band; "both" adds the opposite side. */
  setPlacement: (degrees: number, both: boolean) => void;
  /** Free placement anywhere on the model (null = back to the base band). */
  setSpot: (spot: EngraveSpot | null, focus?: boolean) => void;
  /** Raycast at normalized device coords; returns a spot on the hit surface. */
  pick: (ndcX: number, ndcY: number) => EngraveSpot | null;
  /** Glide the camera to face a given angle (deg, 0 = front). */
  focusAngle: (degrees: number, ms?: number) => void;
  /** Camera presets: from above, eye level, from below. */
  setViewPreset: (v: "top" | "side" | "bottom") => void;
  setAutoRotate: (on: boolean) => void;
  resetView: () => void;
  snapshot: (size?: number) => string | null;
  dispose: () => void;
}

const DRACO_DECODER = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";
const STEM_HEX = "#9fb29a";
const GOLD_HEX = "#c9a25a";
const BASE_HEX = "#efe8dc";

/* ------------------------------------------------------------------ */
/* Procedural geometry                                                 */
/* ------------------------------------------------------------------ */

interface PetalSpec {
  phi: number; // centre angle around the flower axis
  span: number; // angular width of the petal (radians)
  r0: number; // radius at the petal base
  len: number;
  open: number; // outward lean at the base (radians)
  curl: number; // extra outward lean toward the tip (rim rolls back)
  flare: number; // petal edges roll outward
  lift: number;
  pointed?: boolean; // tulip-style tip
}

/**
 * Petals are built in cylindrical coordinates so they wrap around the
 * flower axis like real rose petals (instead of flat cards).
 */
function petalGeometry(p: PetalSpec) {
  const geo = new THREE.PlaneGeometry(1, 1, 20, 20);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors: number[] = [];
  for (let i = 0; i < pos.count; i += 1) {
    const u = pos.getX(i) * 2; // -1..1 across
    const v = pos.getY(i) + 0.5; // 0..1 base→tip
    const widen = p.pointed
      ? Math.pow(Math.sin(Math.PI * (0.1 + 0.82 * v)), 0.6)
      : 0.3 + 0.7 * Math.sin((Math.PI / 2) * Math.min(1, v * 1.35));
    const phi = p.phi + u * (p.span / 2) * widen;
    const top = p.pointed ? 1 - 0.3 * Math.pow(Math.abs(u), 1.6) : 1 - 0.2 * u * u;
    const t = v * top;
    const lean = p.open + p.curl * t * t;
    // integrate a simple bend: radius grows with sin(lean), height with cos(lean)
    const along = t * p.len;
    const rho = p.r0 + along * Math.sin(lean) + p.flare * u * u * t * t;
    const y = p.lift + along * Math.cos(lean) - p.flare * 0.35 * u * u * t * t;
    pos.setXYZ(i, Math.sin(phi) * rho, y, Math.cos(phi) * rho);
    // Glaze pools darker at the base, lighter toward the rim — like real ceramic.
    const shade = 0.7 + 0.3 * Math.pow(t, 0.7);
    colors.push(shade, shade * 0.98, shade * 0.98);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function leafGeometry(len: number, wid: number, fold: number, droop: number) {
  const geo = new THREE.PlaneGeometry(1, 1, 10, 16);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 1) {
    const u = pos.getX(i) * 2;
    const v = pos.getY(i) + 0.5;
    const shape = Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.02)), 0.85);
    const serr = 1 + 0.035 * Math.sin(v * 60) * Math.abs(u); // subtle serration
    const halfW = wid * 0.5 * shape * serr;
    const x = u * halfW;
    const y = v * len;
    const z = fold * Math.abs(u) * halfW - droop * v * v * len;
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Swap a GLB petal material for our ceramic glaze, keeping its maps and vertex shading. */
function toGlaze(src: THREE.MeshStandardMaterial, hasVertexColors = true) {
  const m = makeGlaze("#ffffff");
  m.vertexColors = hasVertexColors || Boolean(src.vertexColors);
  m.map = src.map ?? null;
  m.normalMap = src.normalMap ?? null;
  m.roughnessMap = src.roughnessMap ?? null;
  m.name = src.name;
  return m;
}

function makeGlaze(hex: string) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    // Fine ceramic porcelain fired glaze:
    // Low roughness, high clearcoat with minimal roughness, glass-like IOR.
    roughness: 0.18,
    metalness: 0.02,
    ior: 1.52,
    reflectivity: 0.5,
    specularIntensity: 0.95,
    specularColor: new THREE.Color("#ffffff"),
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    sheen: 0.35,
    sheenRoughness: 0.25,
    sheenColor: new THREE.Color("#fff8f0"),
    vertexColors: true,
    side: THREE.DoubleSide,
  });
}

function buildHead(preset: FlowerPreset, glaze: THREE.Material) {
  const head = new THREE.Group();
  const add = (spec: PetalSpec) => {
    const mesh = new THREE.Mesh(petalGeometry(spec), glaze);
    mesh.name = "glaze_petal";
    head.add(mesh);
  };

  if (preset === "tulip") {
    for (let i = 0; i < 6; i += 1) {
      const outer = i % 2 === 1;
      add({
        phi: (i / 6) * Math.PI * 2,
        span: outer ? 2.1 : 1.9,
        r0: outer ? 0.14 : 0.1,
        len: outer ? 1.3 : 1.24,
        open: outer ? 0.34 : 0.28,
        curl: -0.42,
        flare: 0.04,
        lift: 0,
        pointed: true,
      });
    }
    // Gold stamens peeking out of the cup
    const gold = new THREE.MeshStandardMaterial({ color: GOLD_HEX, metalness: 1, roughness: 0.28 });
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), gold);
      fil.position.set(Math.cos(a) * 0.06, 0.3, Math.sin(a) * 0.06);
      const anther = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 8), gold);
      anther.position.set(Math.cos(a) * 0.08, 0.64, Math.sin(a) * 0.08);
      head.add(fil, anther);
    }
    return head;
  }

  // Rose: tight spiral bud → cupped middle → open petals with rolled rims.
  const golden = 2.39996;
  const rings = [
    { n: 3, span: 3.4, r0: 0.02, len: 0.6, open: 0.0, curl: 0.04, flare: 0.0, lift: 0.34 },
    { n: 4, span: 2.7, r0: 0.07, len: 0.72, open: 0.05, curl: 0.16, flare: 0.04, lift: 0.22 },
    { n: 5, span: 2.3, r0: 0.13, len: 0.84, open: 0.12, curl: 0.32, flare: 0.1, lift: 0.1 },
    { n: 5, span: 2.15, r0: 0.19, len: 0.92, open: 0.24, curl: 0.42, flare: 0.1, lift: 0.0 },
    { n: 6, span: 1.95, r0: 0.25, len: 0.96, open: 0.38, curl: 0.6, flare: 0.12, lift: -0.08 },
  ];

  let k = 0;
  rings.forEach((r) => {
    for (let i = 0; i < r.n; i += 1) {
      // Deterministic per-petal variation so rims don't line up like a hat brim.
      const j = Math.sin(k * 12.9898) * 0.5;
      add({
        phi: k * golden,
        span: r.span * (1 + j * 0.12),
        r0: r.r0,
        len: r.len * (1 + j * 0.14),
        open: r.open * (1 + j * 0.25),
        curl: r.curl * (1 - j * 0.35),
        flare: r.flare,
        lift: r.lift + j * 0.04,
      });
      k += 1;
    }
  });
  return head;
}

/** Engraving plaque on the plinth: curved bands on the rim, front and back. */
function addPlaque(root: THREE.Object3D, R: number, H: number) {
  const band = new THREE.CylinderGeometry(R + 0.004, R + 0.004, 0.26, 64, 1, true, -0.55, 1.1);
  const plaque = new THREE.Mesh(
    band,
    new THREE.MeshStandardMaterial({ transparent: true, opacity: 0, metalness: 1, roughness: 0.22, color: "#ffffff" }),
  );
  plaque.name = "engrave_zone";
  plaque.position.y = H / 2 - 0.01;
  const back = plaque.clone();
  back.name = "engrave_zone_back";
  back.rotation.y = Math.PI;
  root.add(plaque, back);
}

export const PLINTH_TOP = 0.32;

function buildPlaceholder(preset: FlowerPreset, glaze: THREE.Material, plinthOnly = false) {
  const root = new THREE.Group();
  const sage = new THREE.MeshPhysicalMaterial({
    color: STEM_HEX,
    roughness: 0.38,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
    side: THREE.DoubleSide,
  });
  const base = new THREE.MeshPhysicalMaterial({
    color: BASE_HEX,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
  });

  // Plinth: soft-edged ceramic disc (lathe profile gives a rounded rim).
  const prof: THREE.Vector2[] = [];
  const R = 0.95;
  const H = 0.32;
  prof.push(new THREE.Vector2(0, 0));
  for (let i = 0; i <= 8; i += 1) {
    const a = (i / 8) * (Math.PI / 2);
    prof.push(new THREE.Vector2(R - 0.06 + Math.sin(a) * 0.06, 0.06 - Math.cos(a) * 0.06));
  }
  for (let i = 0; i <= 8; i += 1) {
    const a = (i / 8) * (Math.PI / 2);
    prof.push(new THREE.Vector2(R - 0.08 + Math.cos(a) * 0.08, H - 0.08 + Math.sin(a) * 0.08));
  }
  prof.push(new THREE.Vector2(0, H));
  const plinth = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), base);
  plinth.name = "base";
  root.add(plinth);

  // Gold rim line
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(R - 0.02, 0.012, 8, 96),
    new THREE.MeshStandardMaterial({ color: GOLD_HEX, metalness: 1, roughness: 0.25 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = H - 0.02;
  root.add(rim);
  if (plinthOnly) {
    addPlaque(root, R, H);
    return root;
  }

  // Stem with a gentle S-curve
  const headY = preset === "tulip" ? 3.15 : 3.0;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, H - 0.02, 0),
    new THREE.Vector3(0.07, 1.0, 0.02),
    new THREE.Vector3(-0.06, 2.0, -0.02),
    new THREE.Vector3(0.0, headY, 0),
  ]);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.05, 12, false), sage);
  stem.name = "stem";
  root.add(stem);

  const addLeaf = (t: number, yaw: number, len: number, wid: number, tilt: number) => {
    const p = curve.getPointAt(t);
    const leaf = new THREE.Mesh(leafGeometry(len, wid, 0.35, 0.22), sage);
    const pivot = new THREE.Group();
    pivot.position.copy(p);
    leaf.rotation.x = -tilt;
    pivot.add(leaf);
    pivot.rotation.y = yaw;
    root.add(pivot);
  };
  if (preset === "tulip") {
    addLeaf(0.18, 0.3, 1.6, 0.42, 0.22);
    addLeaf(0.3, Math.PI + 0.5, 1.4, 0.36, 0.3);
  } else {
    addLeaf(0.38, 0.6, 1.05, 0.56, 0.85);
    addLeaf(0.55, Math.PI + 0.2, 0.95, 0.5, 0.95);
  }

  // Sepals under the head
  if (preset === "rose") {
    for (let i = 0; i < 5; i += 1) {
      const s = new THREE.Mesh(leafGeometry(0.42, 0.14, 0.2, 0.25), sage);
      const pv = new THREE.Group();
      pv.position.set(0, headY - 0.05, 0);
      s.rotation.x = -1.9;
      pv.add(s);
      pv.rotation.y = (i / 5) * Math.PI * 2 + 0.3;
      root.add(pv);
    }
  }

  const head = buildHead(preset, glaze);
  head.position.y = headY - (preset === "tulip" ? 0.05 : 0.18);
  head.scale.setScalar(preset === "tulip" ? 0.9 : 1.05);
  head.rotation.z = 0.08;
  head.rotation.x = preset === "rose" ? 0.22 : 0.06; // face the bloom slightly toward the viewer
  root.add(head);

  addPlaque(root, R, H);

  return root;
}

/* ------------------------------------------------------------------ */
/* Engraving texture                                                   */
/* ------------------------------------------------------------------ */

function drawEngraving(
  canvas: HTMLCanvasElement,
  text: string,
  fontFamily: string,
  id: EngravingFontId,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const value = normalizeEngraving(text).trim();
  if (!value) return;
  const px = engravingFontPx(value, fontFamily, id, ctx) ?? ENGRAVE_FONT_PX[id] * ENGRAVE_MIN_SCALE;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${engravingLetterSpacing(id, px)}px`;
  }
  ctx.font = engravingCssFont(fontFamily, id, px);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + (id === "script" ? 8 : 4);
  // Recess shadow (looks carved), then gold leaf infill.
  ctx.fillStyle = "rgba(60,40,20,0.55)";
  ctx.fillText(value, cx + 2, cy + 3);
  const g = ctx.createLinearGradient(0, cy - 60, 0, cy + 60);
  g.addColorStop(0, "#f6e3b0");
  g.addColorStop(0.45, "#c9a25a");
  g.addColorStop(1, "#8a6a32");
  ctx.fillStyle = g;
  ctx.fillText(value, cx, cy);
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export function createFlowerScene(opts: SceneOptions): FlowerSceneApi {
  const { canvas } = opts;
  const isCoarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Tone mapping and bright, soft studio lighting matching luxury product photography
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.95;

  // 3-point studio lighting: Main Key Light, Soft Fill, and Crisp Rim Light
  const key = new THREE.DirectionalLight("#fffcf7", 2.0);
  key.position.set(3.5, 7, 4.5);
  const fill = new THREE.DirectionalLight("#f0f5ff", 0.9);
  fill.position.set(-3.5, 4, 3);
  const rimLight = new THREE.DirectionalLight("#ffe8c4", 1.25);
  rimLight.position.set(-4, 5, -4);
  scene.add(key, fill, rimLight, new THREE.HemisphereLight("#fffaf2", "#e8dfd5", 0.55));

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 1.95, 0);
  const homePos = new THREE.Vector3(0, 4.0, 9.0);
  camera.position.copy(homePos);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 5.5;
  controls.maxDistance = 13;
  // Full vertical orbit (top-down to bottom-up), stopping just short of the
  // poles so OrbitControls never flips.
  controls.minPolarAngle = 0.04;
  controls.maxPolarAngle = Math.PI - 0.04;
  controls.autoRotateSpeed = 1.4;
  controls.autoRotate = !opts.reducedMotion;
  controls.update();

  // Soft contact shadow: a radial-gradient blob (cheap, looks good on mobile).
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext("2d");
  if (sctx) {
    const grd = sctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,0.55)");
    grd.addColorStop(0.55, "rgba(0,0,0,0.22)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    sctx.fillStyle = grd;
    sctx.fillRect(0, 0, 128, 128);
  }
  const shadowMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(shadowCanvas),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  scene.add(shadow);

  const glaze = makeGlaze(opts.glazeHex);
  const engraveCanvas = document.createElement("canvas");
  engraveCanvas.width = ENGRAVE_CANVAS_W;
  engraveCanvas.height = ENGRAVE_CANVAS_H;
  const engraveTex = new THREE.CanvasTexture(engraveCanvas);
  engraveTex.colorSpace = THREE.SRGBColorSpace;
  engraveTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  let engraveMeshes: THREE.Mesh[] = [];
  // Our own plinth bands (rotatable); artisan GLB zones stay where modelled.
  let plaqueFront: THREE.Mesh | null = null;
  let plaqueBack: THREE.Mesh | null = null;
  let placeDeg = 0;
  let placeBoth = false;
  let hasText = false;
  let spot: EngraveSpot | null = null;
  const applyPlacement = () => {
    const rad = THREE.MathUtils.degToRad(placeDeg);
    if (plaqueFront) plaqueFront.rotation.y = rad;
    if (plaqueBack) plaqueBack.rotation.y = rad + Math.PI;
    engraveMeshes.forEach((m) => {
      m.visible = hasText && !spot && (m !== plaqueBack || placeBoth);
    });
  };
  let customGlazeMaterials: THREE.MeshStandardMaterial[] = [];
  let disposed = false;
  let visible = true;
  let frame = 0;

  const engraveMat = () =>
    new THREE.MeshStandardMaterial({
      map: engraveTex,
      transparent: true,
      metalness: 0.85,
      roughness: 0.25,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
  const attachEngraving = (zone: THREE.Mesh) => {
    zone.material = engraveMat();
    engraveMeshes.push(zone);
    if (zone.name === "engrave_zone") plaqueFront = zone;
    else if (zone.name === "engrave_zone_back") plaqueBack = zone;
    applyPlacement();
  };

  const ready = () => {
    if (disposed) return;
    rebuildDecal();
    opts.onReady();
  };

  const fitGroup = new THREE.Group();
  let fitBaseY = 0;
  const applyFit = (fit?: ModelFit) => {
    const sc = Math.min(1.6, Math.max(0.4, fit?.scale ?? 1));
    fitGroup.scale.setScalar(sc);
    fitGroup.rotation.y = THREE.MathUtils.degToRad(fit?.rotY ?? 0);
    fitGroup.position.y = fitBaseY + Math.min(1.5, Math.max(-1.5, fit?.offsetY ?? 0));
  };

  if (opts.glbUrl) {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER);
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      opts.glbUrl,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        let hasZone = false;
        model.traverse((o) => {
          if (/engrave/i.test(o.name)) hasZone = true;
        });
        // A flower-only GLB (e.g. image-to-3D output) gets our ceramic plinth with
        // the engraving band; a full artisan model with its own base is used as-is.
        const floor = hasZone ? 0 : PLINTH_TOP - 0.02;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = (4 - floor) / Math.max(size.y, 0.0001);
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);
        box.setFromObject(model);
        // Centre on the stem foot (lowest 4% of the model) so it plants into the plinth.
        const foot = new THREE.Vector3();
        let n = 0;
        const v = new THREE.Vector3();
        const cut = box.min.y + (box.max.y - box.min.y) * 0.04;
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          const pos = mesh.isMesh ? mesh.geometry.getAttribute("position") : null;
          if (!pos) return;
          for (let i = 0; i < pos.count; i += 7) {
            v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
            if (v.y <= cut) {
              foot.add(v);
              n += 1;
            }
          }
        });
        const c = n ? foot.divideScalar(n) : box.getCenter(new THREE.Vector3());
        model.position.x -= c.x;
        model.position.z -= c.z;
        model.position.y += floor - box.min.y;
        if (!hasZone) {
          const plinth = buildPlaceholder(opts.preset ?? "rose", glaze, true);
          ["engrave_zone", "engrave_zone_back"].forEach((zn) => {
            const zone = plinth.getObjectByName(zn) as THREE.Mesh | undefined;
            if (zone) attachEngraving(zone);
          });
          scene.add(plinth);
        }
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          if (!mesh.geometry.getAttribute("normal")) mesh.geometry.computeVertexNormals();
          mesh.castShadow = false;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          const n = `${mesh.name} ${mat?.name ?? ""}`.toLowerCase();
          const hasColor = Boolean(mesh.geometry.getAttribute("color"));
          if (/engrave/.test(n)) {
            attachEngraving(mesh);
          } else if (/glaze|petal/.test(n) || (!/stem|leaf|stamen|gold|plinth|base/.test(n) && mat && "color" in mat)) {
            const m = toGlaze(mat, hasColor);
            m.color.set(opts.glazeHex);
            mesh.material = m;
            customGlazeMaterials.push(m);
          } else if (/stem|leaf/.test(n)) {
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: STEM_HEX,
              roughness: 0.28,
              clearcoat: 0.8,
              clearcoatRoughness: 0.08,
              vertexColors: hasColor,
              side: THREE.DoubleSide,
            });
          } else if (/stamen|gold/.test(n)) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: GOLD_HEX,
              metalness: 0.95,
              roughness: 0.22,
              side: THREE.DoubleSide,
            });
          }
        });
        // Wrap in a pivot at the plinth top so admin scale/rotation keep the foot planted.
        model.position.y -= floor;
        fitGroup.position.set(0, floor, 0);
        fitBaseY = floor;
        fitGroup.add(model);
        scene.add(fitGroup);
        applyFit(opts.fit);
        draco.dispose();
        ready();
      },
      undefined,
      (err) => {
        draco.dispose();
        if (!disposed) opts.onError(err);
      },
    );
  } else {
    const model = buildPlaceholder(opts.preset ?? "rose", glaze);
    ["engrave_zone", "engrave_zone_back"].forEach((n) => {
      const zone = model.getObjectByName(n) as THREE.Mesh | undefined;
      if (zone) attachEngraving(zone);
    });
    scene.add(model);
    // Defer one frame so the poster can cross-fade smoothly.
    requestAnimationFrame(ready);
  }

  /* ---------------- Free placement: decal anywhere on the model ---------------- */
  let decal: THREE.Mesh | null = null;
  const decalMat = new THREE.MeshStandardMaterial({
    map: engraveTex,
    transparent: true,
    metalness: 0.85,
    roughness: 0.25,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  const raycaster = new THREE.Raycaster();
  const pickables = () => {
    const out: THREE.Mesh[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m !== decal && m !== shadow && !engraveMeshes.includes(m)) out.push(m);
    });
    return out;
  };
  const isInFit = (o: THREE.Object3D) => {
    for (let c: THREE.Object3D | null = o; c; c = c.parent) if (c === fitGroup) return true;
    return false;
  };
  /** Spot in world space (fitGroup-local spots follow the admin fit). */
  const spotWorld = (sp: EngraveSpot) => {
    const p = new THREE.Vector3(...sp.p);
    const n = new THREE.Vector3(...sp.n).normalize();
    if (sp.frame === "model") {
      fitGroup.updateMatrixWorld(true);
      p.applyMatrix4(fitGroup.matrixWorld);
      n.transformDirection(fitGroup.matrixWorld);
    }
    return { p, n };
  };
  const rebuildDecal = () => {
    if (decal) {
      scene.remove(decal);
      decal.geometry.dispose();
      decal = null;
    }
    if (!spot || !hasText) return;
    scene.updateMatrixWorld(true);
    const { p, n } = spotWorld(spot);
    // Re-find the surface under the stored point (robust to reloads).
    raycaster.set(p.clone().addScaledVector(n, 0.4), n.clone().negate());
    raycaster.far = 0.8;
    const hit = raycaster.intersectObjects(pickables(), false)[0];
    raycaster.far = Infinity;
    if (!hit) return;
    const helper = new THREE.Object3D();
    helper.position.copy(hit.point);
    helper.lookAt(hit.point.clone().add(n));
    helper.rotateZ(THREE.MathUtils.degToRad(spot.rot));
    const k = spot.scale;
    const geo = new DecalGeometry(hit.object as THREE.Mesh, hit.point, helper.rotation, new THREE.Vector3(0.72 * k, 0.18 * k, 0.35 * k));
    decal = new THREE.Mesh(geo, decalMat);
    decal.name = "engrave_decal";
    scene.add(decal);
  };
  const spotAz = () => {
    if (!spot) return 0;
    const { p, n } = spotWorld(spot);
    const v = Math.hypot(n.x, n.z) > 0.2 ? n : p;
    return Math.atan2(v.x, v.z);
  };
  const spotPhi = () => {
    if (!spot) return Math.PI * 0.43;
    const { n } = spotWorld(spot);
    return THREE.MathUtils.clamp(Math.acos(THREE.MathUtils.clamp(n.y, -1, 1)), 0.15, Math.PI - 0.15);
  };

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow portrait screens: pull back so the whole flower stays in frame.
    camera.fov = w / h < 0.8 ? 36 : 30;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  });
  io.observe(canvas);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    opts.onError(new Error("webglcontextlost"));
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  // "Show me the engraving": glide to the front, pause the turntable briefly.
  let focusUntil = 0;
  let lastFrame = 0;
  let focusTheta: number | null = 0;
  let focusPhi = Math.PI * 0.43;
  let wantAutoRotate = !opts.reducedMotion;
  const spherical = new THREE.Spherical();
  const offset = new THREE.Vector3();
  const loop = () => {
    frame = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const now = performance.now();
    const prevFrame = lastFrame;
    lastFrame = now;
    if (now < focusUntil) {
      controls.autoRotate = false;
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      // Frame-rate independent glide (slow GPUs still arrive in time).
      const dt = Math.min(0.25, (now - (prevFrame || now)) / 1000);
      const k = opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 5);
      if (focusTheta !== null) {
        let dTheta = focusTheta - spherical.theta;
        dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
        spherical.theta += dTheta * k;
      }
      spherical.phi += (focusPhi - spherical.phi) * k;
      spherical.makeSafe();
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
    } else if (focusUntil && controls.autoRotate !== wantAutoRotate) {
      controls.autoRotate = wantAutoRotate;
    }
    controls.update();
    // Contact shadow only reads as a shadow from above; fade it out as the
    // camera dips to (and below) the floor so the underside view stays clean.
    const elev = camera.position.y - shadow.position.y;
    shadowMat.opacity = THREE.MathUtils.clamp(elev / 1.2, 0, 1);
    shadow.visible = shadowMat.opacity > 0.01;
    renderer.render(scene, camera);
  };
  loop();

  const setExplore = (on: boolean) => {
    controls.enableRotate = on || !isCoarse;
    controls.enableZoom = on;
    // When not exploring on touch devices let the page scroll through the canvas.
    canvas.style.touchAction = on ? "none" : "pan-y";
  };
  setExplore(false);

  return {
    setGlaze(hex) {
      glaze.color.set(hex);
      customGlazeMaterials.forEach((m) => m.color.set(hex));
    },
    setEngraving(text, fontFamily, fontId) {
      drawEngraving(engraveCanvas, text, fontFamily, fontId);
      engraveTex.needsUpdate = true;
      hasText = Boolean(text.trim());
      applyPlacement();
      if (Boolean(decal) !== (hasText && Boolean(spot))) rebuildDecal();
    },
    setFit(fit) {
      applyFit(fit);
      rebuildDecal();
    },
    setSpot(sp, focus = false) {
      spot = sp;
      applyPlacement();
      rebuildDecal();
      if (sp && focus) {
        focusTheta = spotAz();
        focusPhi = spotPhi();
        focusUntil = performance.now() + 3000;
      }
    },
    pick(x, y) {
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const hit = raycaster.intersectObjects(pickables(), false)[0];
      if (!hit || !hit.face) return null;
      const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (n.dot(raycaster.ray.direction) > 0) n.negate();
      const p = hit.point.clone();
      const frame = isInFit(hit.object) ? "model" : "world";
      if (frame === "model") {
        const inv = fitGroup.matrixWorld.clone().invert();
        p.applyMatrix4(inv);
        n.transformDirection(inv);
      }
      const r3 = (v: number) => Math.round(v * 1000) / 1000;
      return {
        frame,
        p: [r3(p.x), r3(p.y), r3(p.z)],
        n: [r3(n.x), r3(n.y), r3(n.z)],
        rot: spot?.rot ?? 0,
        scale: spot?.scale ?? 1,
      };
    },
    showFront(ms = 4500) {
      focusTheta = spot ? spotAz() : THREE.MathUtils.degToRad(placeDeg);
      focusPhi = spot ? spotPhi() : Math.PI * 0.43;
      focusUntil = performance.now() + ms;
    },
    setPlacement(degrees, both) {
      placeDeg = ((degrees % 360) + 360) % 360;
      placeBoth = both;
      applyPlacement();
    },
    focusAngle(degrees, ms = 4500) {
      focusTheta = THREE.MathUtils.degToRad(degrees);
      focusPhi = Math.PI * 0.43;
      focusUntil = performance.now() + ms;
    },
    setViewPreset(v) {
      focusTheta = null;
      focusPhi = v === "top" ? 0.12 : v === "bottom" ? Math.PI * 0.8 : Math.PI * 0.43;
      focusUntil = performance.now() + (opts.reducedMotion ? 50 : 2000);
    },
    setExplore,
    setAutoRotate(on) {
      wantAutoRotate = on && !opts.reducedMotion;
      controls.autoRotate = wantAutoRotate;
    },
    resetView() {
      focusUntil = 0;
      camera.position.copy(homePos);
      controls.target.copy(target);
      controls.update();
    },
    snapshot(size = 560) {
      try {
        // Frame the engraving so the artisan sees exactly where it goes.
        const saved = camera.position.clone();
        if (hasText) {
          offset.copy(camera.position).sub(controls.target);
          spherical.setFromVector3(offset);
          spherical.theta = spot ? spotAz() : THREE.MathUtils.degToRad(placeDeg);
          spherical.phi = spot ? spotPhi() : Math.PI * 0.43;
          spherical.makeSafe();
          camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
          camera.lookAt(controls.target);
        }
        renderer.render(scene, camera);
        camera.position.copy(saved);
        camera.lookAt(controls.target);
        const out = document.createElement("canvas");
        out.width = out.height = size;
        const ctx = out.getContext("2d");
        if (!ctx) return null;
        const bg = ctx.createRadialGradient(size / 2, size * 0.45, size * 0.05, size / 2, size / 2, size * 0.75);
        bg.addColorStop(0, "#5a4231");
        bg.addColorStop(1, "#1a120d");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);
        const sw = canvas.width;
        const sh = canvas.height;
        const side = Math.min(sw, sh);
        ctx.drawImage(canvas, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, size, size);
        return out.toDataURL("image/jpeg", 0.82);
      } catch {
        return null;
      }
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => m.dispose());
      });
      engraveTex.dispose();
      decalMat.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      customGlazeMaterials = [];
      engraveMeshes = [];
    },
  };
}
