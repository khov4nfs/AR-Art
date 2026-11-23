"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LayoutDashboard, LogIn, Plus, ScanLine } from "lucide-react";
import * as THREE from "three";

import { getCurrentCollectionUser } from "@/features/collection/infrastructure/local/collection-repository";

type ArtworkPalette = {
  a: string;
  b: string;
  c: string;
  glow: string;
};

const PALETTES: ArtworkPalette[] = [
  { a: "#08070f", b: "#5b21b6", c: "#67e8f9", glow: "#c4b5fd" },
  { a: "#0a0708", b: "#be185d", c: "#fb923c", glow: "#f9a8d4" },
  { a: "#041015", b: "#0f766e", c: "#8b5cf6", glow: "#99f6e4" },
  { a: "#0b0812", b: "#312e81", c: "#ec4899", glow: "#a5b4fc" },
];

function makeArtworkTexture(palette: ArtworkPalette, variant: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1280;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  const background = context.createLinearGradient(0, 0, 1024, 1280);
  background.addColorStop(0, palette.a);
  background.addColorStop(0.5, palette.b);
  background.addColorStop(1, palette.a);
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 1280);

  const radial = context.createRadialGradient(
    480 + variant * 22,
    520 - variant * 36,
    60,
    520,
    620,
    520,
  );
  radial.addColorStop(0, palette.glow);
  radial.addColorStop(0.28, palette.c);
  radial.addColorStop(0.68, palette.b);
  radial.addColorStop(1, "rgba(0,0,0,0)");
  context.globalAlpha = 0.78;
  context.fillStyle = radial;
  context.fillRect(0, 0, 1024, 1280);

  context.globalAlpha = 0.88;
  context.lineWidth = 7;
  context.strokeStyle = "rgba(255,255,255,0.48)";
  for (let index = 0; index < 5; index += 1) {
    context.beginPath();
    const radius = 150 + index * 66;
    context.ellipse(
      512 + Math.sin(index + variant) * 70,
      590 + Math.cos(index * 1.2 + variant) * 90,
      radius,
      radius * (0.58 + index * 0.035),
      (variant * 0.24 + index * 0.34) % Math.PI,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }

  context.globalAlpha = 0.72;
  for (let index = 0; index < 18; index += 1) {
    const x = 120 + ((index * 147 + variant * 79) % 780);
    const y = 110 + ((index * 223 + variant * 121) % 1020);
    const radius = 8 + ((index * 19) % 38);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle =
      index % 3 === 0 ? palette.glow : index % 2 === 0 ? palette.c : "#ffffff";
    context.fill();
  }

  context.globalAlpha = 1;
  context.fillStyle = "rgba(255,255,255,0.64)";
  context.fillRect(82, 1168, 860, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addArtworkFrame(
  scene: THREE.Scene,
  palette: ArtworkPalette,
  index: number,
  position: THREE.Vector3,
  rotationY: number,
) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(4.45, 5.55, 0.28),
    new THREE.MeshStandardMaterial({
      color: 0x17171c,
      metalness: 0.72,
      roughness: 0.2,
    }),
  );
  group.add(frame);

  const texture = makeArtworkTexture(palette, index);
  const artwork = new THREE.Mesh(
    new THREE.PlaneGeometry(3.92, 5.02),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  artwork.position.z = 0.151;
  group.add(artwork);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.25, 5.35),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette.glow),
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.position.z = 0.13;
  group.add(glow);

  scene.add(group);
  return { group, texture };
}

export function ImmersiveArtExperience() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [canManageAr, setCanManageAr] = useState(false);
  const [authState, setAuthState] = useState<
    "checking" | "authenticated" | "anonymous"
  >("checking");
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLElement>(null);
  const endCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    router.prefetch("/create");
    router.prefetch("/login?next=%2Fcreate");
  }, [router]);

  useEffect(() => {
    let active = true;

    void getCurrentCollectionUser()
      .then((user) => {
        if (!active) return;
        setAuthState(user ? "authenticated" : "anonymous");
        setCanManageAr(user?.role === "SUPER_ADMIN" || user?.role === "CONTENT_EDITOR");
      })
      .catch(() => {
        if (active) setAuthState("anonymous");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const host = canvasHostRef.current;
    const scrollRoot = scrollRootRef.current;
    if (!host || !scrollRoot) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030305);
    scene.fog = new THREE.FogExp2(0x030305, 0.034);

    const camera = new THREE.PerspectiveCamera(
      46,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.34));

    const keyLight = new THREE.PointLight(0xa78bfa, 52, 24, 2);
    keyLight.position.set(-3.8, 4.2, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x67e8f9, 46, 24, 2);
    fillLight.position.set(4.2, -2.2, 2);
    scene.add(fillLight);

    const warmLight = new THREE.PointLight(0xfb7185, 30, 18, 2);
    warmLight.position.set(0, 3, -13);
    scene.add(warmLight);

    const portalLight = new THREE.PointLight(0x8b5cf6, 0, 18, 2);
    portalLight.position.set(0, 0, -31.2);
    scene.add(portalLight);

    const artworkFrames = [
      addArtworkFrame(
        scene,
        PALETTES[0],
        0,
        new THREE.Vector3(-2.7, 0.55, -1.5),
        0.36,
      ),
      addArtworkFrame(
        scene,
        PALETTES[1],
        1,
        new THREE.Vector3(2.8, -0.7, -9.8),
        -0.34,
      ),
      addArtworkFrame(
        scene,
        PALETTES[2],
        2,
        new THREE.Vector3(-2.1, -0.3, -18),
        0.28,
      ),
      addArtworkFrame(
        scene,
        PALETTES[3],
        3,
        new THREE.Vector3(2.3, 0.55, -26.2),
        -0.3,
      ),
    ];
    const artworkBaseY = artworkFrames.map(({ group }) => group.position.y);

    const sculptureMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd8b4fe,
      emissive: 0x4c1d95,
      emissiveIntensity: 1.4,
      metalness: 0.45,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    });

    const sculptures: THREE.Mesh[] = [];

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.92, 0.24, 160, 24, 2, 5),
      sculptureMaterial,
    );
    knot.position.set(2.1, 1.15, -4.7);
    scene.add(knot);
    sculptures.push(knot);

    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 2),
      new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        emissive: 0x0f766e,
        emissiveIntensity: 1.2,
        metalness: 0.7,
        roughness: 0.15,
      }),
    );
    ico.position.set(-2.5, 1.1, -13.8);
    scene.add(ico);
    sculptures.push(ico);

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.18, 32, 140),
      new THREE.MeshPhysicalMaterial({
        color: 0xfb7185,
        emissive: 0x831843,
        emissiveIntensity: 1.35,
        metalness: 0.5,
        roughness: 0.18,
      }),
    );
    torus.position.set(2.2, -0.6, -22.2);
    torus.rotation.x = Math.PI * 0.42;
    scene.add(torus);
    sculptures.push(torus);
    const sculptureBaseY = sculptures.map((mesh) => mesh.position.y);

    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, -33.8);
    portalGroup.visible = false;
    scene.add(portalGroup);

    const portalMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        varying vec2 vUv;

        void main() {
          vec2 p = vUv - 0.5;
          float radius = length(p);
          float angle = atan(p.y, p.x);
          float wave = sin(angle * 7.0 - uTime * 1.8 + radius * 18.0) * 0.5 + 0.5;
          float core = smoothstep(0.52, 0.02, radius);
          float rim = smoothstep(0.5, 0.26, radius) - smoothstep(0.29, 0.12, radius);

          vec3 violet = vec3(0.48, 0.24, 1.0);
          vec3 cyan = vec3(0.18, 0.86, 1.0);
          vec3 color = mix(violet, cyan, wave + radius * 0.45);

          float alpha = (core * 0.22 + rim * 0.62 + wave * core * 0.1) * uProgress;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    const portalCore = new THREE.Mesh(
      new THREE.CircleGeometry(1.72, 128),
      portalMaterial,
    );
    portalGroup.add(portalCore);

    const portalRingMaterials = [
      new THREE.MeshBasicMaterial({
        color: 0xc4b5fd,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      new THREE.MeshBasicMaterial({
        color: 0xf0abfc,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ];

    const portalRings = [
      new THREE.Mesh(
        new THREE.TorusGeometry(2.28, 0.045, 16, 192),
        portalRingMaterials[0],
      ),
      new THREE.Mesh(
        new THREE.TorusGeometry(1.98, 0.025, 16, 192),
        portalRingMaterials[1],
      ),
      new THREE.Mesh(
        new THREE.TorusGeometry(2.56, 0.018, 12, 192),
        portalRingMaterials[2],
      ),
    ];
    portalRings.forEach((ring) => portalGroup.add(ring));

    const shardGeometry = new THREE.BoxGeometry(0.055, 0.42, 0.07);
    const shardMaterial = new THREE.MeshBasicMaterial({
      color: 0xe0e7ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const portalShards: THREE.Mesh[] = [];
    for (let index = 0; index < 18; index += 1) {
      const angle = (index / 18) * Math.PI * 2;
      const shard = new THREE.Mesh(shardGeometry, shardMaterial);
      shard.position.set(Math.cos(angle) * 2.82, Math.sin(angle) * 2.82, 0);
      shard.rotation.z = angle + Math.PI / 2;
      portalGroup.add(shard);
      portalShards.push(shard);
    }

    const particleCount = window.innerWidth < 768 ? 450 : 900;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      particlePositions[index * 3] = (Math.random() - 0.5) * 18;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[index * 3 + 2] = 4 - Math.random() * 46;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xd8d9ff,
        size: 0.028,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    const pointer = new THREE.Vector2();
    const targetPointer = new THREE.Vector2();
    let scrollProgress = 0;
    let frameId = 0;
    const clock = new THREE.Clock();
    const lookAt = new THREE.Vector3();

    const updateScroll = () => {
      const rect = scrollRoot.getBoundingClientRect();
      const scrollable = Math.max(scrollRoot.offsetHeight - window.innerHeight, 1);
      scrollProgress = THREE.MathUtils.clamp(-rect.top / scrollable, 0, 1);
      const endProgress = THREE.MathUtils.smootherstep(scrollProgress, 0.78, 0.98);
      scrollRoot.style.setProperty("--scroll-progress", String(scrollProgress));
      scrollRoot.style.setProperty("--end-progress", String(endProgress));

      const endCta = endCtaRef.current;
      if (endCta) {
        endCta.style.opacity = String(endProgress);
        endCta.style.transform = `scale(${0.88 + endProgress * 0.12})`;
        endCta.style.pointerEvents = endProgress > 0.72 ? "auto" : "none";
        endCta.setAttribute("aria-hidden", endProgress > 0.72 ? "false" : "true");
      }
    };

    const updatePointer = (event: PointerEvent) => {
      targetPointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      targetPointer.y = (event.clientY / window.innerHeight - 0.5) * -2;
    };

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    };

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      pointer.lerp(targetPointer, 0.035);

      const travel = THREE.MathUtils.smootherstep(scrollProgress, 0, 1);
      const endFocus = THREE.MathUtils.smootherstep(scrollProgress, 0.8, 1);
      const endReveal = THREE.MathUtils.smootherstep(scrollProgress, 0.74, 0.98);
      const targetZ = 8.2 - travel * 35.6;
      const pathX =
        Math.sin(travel * Math.PI * 3.4) * 0.82 + pointer.x * 0.34;
      const pathY =
        Math.cos(travel * Math.PI * 2.7) * 0.42 + pointer.y * 0.24;
      const targetX = THREE.MathUtils.lerp(pathX, pointer.x * 0.11, endFocus);
      const targetY = THREE.MathUtils.lerp(pathY, pointer.y * 0.08, endFocus);

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.055);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.055);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06);

      lookAt.set(
        camera.position.x * 0.18,
        camera.position.y * 0.12,
        camera.position.z - 5.8,
      );
      camera.lookAt(lookAt);

      artworkFrames.forEach(({ group }, index) => {
        group.rotation.z = Math.sin(time * 0.18 + index) * 0.018;
        group.position.y =
          artworkBaseY[index] + Math.sin(time * 0.65 + index * 1.7) * 0.055;
      });

      sculptures.forEach((mesh, index) => {
        mesh.rotation.x = time * (0.12 + index * 0.035);
        mesh.rotation.y = time * (0.18 + index * 0.04);
        mesh.position.y =
          sculptureBaseY[index] + Math.sin(time * 0.8 + index) * 0.09;
      });

      portalGroup.visible = endReveal > 0.001;
      portalGroup.scale.setScalar(0.72 + endReveal * 0.28);
      portalGroup.rotation.z = time * 0.025;
      portalMaterial.uniforms.uTime.value = time;
      portalMaterial.uniforms.uProgress.value = endReveal;
      portalRingMaterials[0].opacity = endReveal * 0.9;
      portalRingMaterials[1].opacity = endReveal * 0.58;
      portalRingMaterials[2].opacity = endReveal * 0.32;
      portalRings[0].rotation.z = time * 0.12;
      portalRings[1].rotation.z = -time * 0.17;
      portalRings[2].rotation.z = time * 0.07;
      portalLight.intensity = endReveal * 42;

      portalShards.forEach((shard, index) => {
        const phase = time * 0.45 + index * 0.7;
        const baseAngle = (index / portalShards.length) * Math.PI * 2;
        const radius = 2.82 + Math.sin(phase) * 0.16;
        shard.position.x = Math.cos(baseAngle + time * 0.035) * radius;
        shard.position.y = Math.sin(baseAngle + time * 0.035) * radius;
        shard.rotation.z = baseAngle + time * 0.035 + Math.PI / 2;
        shard.scale.y = 0.72 + Math.sin(phase * 1.7) * 0.22;
      });
      shardMaterial.opacity = endReveal * 0.58;

      particles.rotation.y = time * 0.008;
      particles.rotation.x = Math.sin(time * 0.09) * 0.035;

      keyLight.position.x = -3.8 + Math.sin(time * 0.34) * 1.6;
      fillLight.position.y = -2.2 + Math.cos(time * 0.29) * 1.3;

      renderer.render(scene, camera);
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("resize", resize);
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("resize", resize);

      artworkFrames.forEach(({ group, texture }) => {
        texture.dispose();
        group.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material.dispose();
          }
        });
      });

      sculptures.forEach((mesh) => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material.dispose();
        }
      });

      particleGeometry.dispose();
      particles.material.dispose();
      portalCore.geometry.dispose();
      portalMaterial.dispose();
      portalRings.forEach((ring) => ring.geometry.dispose());
      portalRingMaterials.forEach((material) => material.dispose());
      shardGeometry.dispose();
      shardMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const navigateToCreate = async (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    if (isNavigating) return;

    setIsNavigating(true);

    const user =
      authState === "authenticated" ? true : Boolean(await getCurrentCollectionUser());
    setAuthState(user ? "authenticated" : "anonymous");

    const destination = user ? "/create" : "/login?next=%2Fcreate";
    window.setTimeout(() => {
      router.push(destination);
    }, 680);
  };

  return (
    <main
      ref={scrollRootRef}
      className="immersive-home relative h-[520svh] bg-black text-white"
    >
      <h1 className="sr-only">AR Art immersive digital gallery</h1>

      <div className="sticky top-0 h-svh overflow-hidden">
        <div ref={canvasHostRef} className="absolute inset-0" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_18%,rgba(0,0,0,0.18)_58%,rgba(0,0,0,0.8)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute right-5 top-5 z-20 flex items-center gap-2 sm:right-7 sm:top-7">
          <Link
            href="/ar"
            aria-label="Open AR scanner"
            className="group flex size-11 items-center justify-center rounded-full border border-white/12 bg-black/25 text-white/70 backdrop-blur-xl transition duration-300 hover:scale-105 hover:border-white/28 hover:bg-white/[0.08] hover:text-white"
          >
            <ScanLine className="size-4 transition group-hover:scale-110" />
          </Link>

          {authState === "anonymous" && (
            <Link
              href="/login?next=%2Fcreate"
              className="group flex h-11 items-center gap-2 rounded-full border border-white/12 bg-black/35 px-4 text-xs font-medium tracking-[0.12em] text-white/80 backdrop-blur-xl transition duration-300 hover:border-white/28 hover:bg-white/[0.08] hover:text-white"
            >
              <LogIn className="size-4" aria-hidden="true" />
              LOGIN
            </Link>
          )}

          {authState === "authenticated" && canManageAr && (
            <Link
              href="/admin/ar"
              className="group flex h-11 items-center gap-2 rounded-full border border-white/12 bg-black/35 px-4 text-xs font-medium tracking-[0.12em] text-white/80 backdrop-blur-xl transition duration-300 hover:border-white/28 hover:bg-white/[0.08] hover:text-white"
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              STUDIO
            </Link>
          )}

          <Link
            href={
              authState === "authenticated"
                ? "/create"
                : "/login?next=%2Fcreate"
            }
            onClick={navigateToCreate}
            aria-label="Create AR artwork"
            className="group flex size-11 items-center justify-center rounded-full border border-white/12 bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.14)] transition duration-300 hover:scale-105 hover:bg-white/90"
          >
            <Plus className="size-4 transition group-hover:rotate-90" />
          </Link>
        </div>

        <div className="pointer-events-none absolute left-5 top-1/2 z-20 h-32 w-px -translate-y-1/2 overflow-hidden bg-white/10 sm:left-7">
          <div className="immersive-progress h-full w-full origin-top bg-white/65" />
        </div>

        <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 -translate-x-1/2">
          <div className="immersive-scroll-cue flex h-12 w-7 items-start justify-center rounded-full border border-white/16 bg-black/10 p-1.5 backdrop-blur">
            <span className="block size-1.5 rounded-full bg-white/70" />
          </div>
        </div>

        <div
          ref={endCtaRef}
          aria-hidden="true"
          className="immersive-end-cta absolute inset-0 z-30 flex items-center justify-center opacity-0"
        >
          <Link
            href={
              authState === "authenticated"
                ? "/create"
                : "/login?next=%2Fcreate"
            }
            onClick={navigateToCreate}
            aria-label="Create an AR artwork"
            className="immersive-create-button group relative flex h-16 min-w-48 items-center justify-center gap-4 overflow-hidden rounded-full border border-white/18 bg-white px-7 text-black shadow-[0_0_80px_rgba(196,181,253,0.28)] transition duration-500 hover:scale-[1.04] hover:shadow-[0_0_110px_rgba(103,232,249,0.34)] sm:h-20 sm:min-w-56"
          >
            <span className="relative z-10 text-[0.7rem] font-semibold tracking-[0.34em] sm:text-xs">
              CREATE
            </span>
            <ArrowUpRight className="relative z-10 size-4 transition duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>

        <div
          aria-hidden="true"
          className={`immersive-route-transition ${isNavigating ? "is-active" : ""}`}
        />
      </div>
    </main>
  );
}
