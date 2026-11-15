import * as THREE from "three";

import type {
  ArLayerAnimation,
  ArLayerBlendMode,
  ArLayerTransform,
  ArOverlay,
  ArSceneLayer,
} from "@/features/ar-experience/domain/ar-experience";

type AnimatedLayer = {
  object: THREE.Object3D;
  animation: ArLayerAnimation;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  baseScale: THREE.Vector3;
  phase: number;
};

function blendingFor(mode: ArLayerBlendMode | undefined) {
  return mode === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;
}

function safeColor(value: string | undefined, fallback: number) {
  if (!value) return new THREE.Color(fallback);
  try {
    return new THREE.Color(value);
  } catch {
    return new THREE.Color(fallback);
  }
}

/**
 * Builds and owns the renderable AR content independently from MindAR tracking.
 * MindAR supplies an anchor; this class owns rendering strategy, playback,
 * animation and GPU resource disposal.
 */
export class ThreeArOverlayScene {
  private targetVisible = false;
  private videos = new Set<HTMLVideoElement>();
  private textures = new Set<THREE.Texture>();
  private materials = new Set<THREE.Material>();
  private geometries = new Set<THREE.BufferGeometry>();
  private animatedLayers: AnimatedLayer[] = [];

  async create(overlay: ArOverlay): Promise<THREE.Object3D> {
    if (overlay.kind === "motion-extract") {
      return this.createDifferenceVideoPlane({
        videoUrl: overlay.videoUrl,
        targetImageUrl: overlay.targetImageUrl,
        targetAspectRatio: overlay.targetAspectRatio,
        thresholdLow: overlay.thresholdLow,
        thresholdHigh: overlay.thresholdHigh,
        preferNativeAlpha: false,
      });
    }

    if (overlay.kind === "transparent-video") {
      return this.createDifferenceVideoPlane({
        videoUrl: overlay.videoUrl,
        targetImageUrl: overlay.targetImageUrl,
        targetAspectRatio: overlay.targetAspectRatio,
        thresholdLow: overlay.fallbackThresholdLow,
        thresholdHigh: overlay.fallbackThresholdHigh,
        preferNativeAlpha: true,
      });
    }

    if (overlay.kind === "spatial-scene") {
      const group = new THREE.Group();
      const layers = overlay.layers.slice(0, 12);
      for (let index = 0; index < layers.length; index += 1) {
        const layer = layers[index];
        if (!layer) continue;
        group.add(await this.createSpatialLayer(layer, index * 0.73));
      }
      return group;
    }

    return this.createProceduralOverlay();
  }

  setTargetVisible(visible: boolean) {
    this.targetVisible = visible;
    for (const video of this.videos) {
      if (visible) void video.play().catch(() => undefined);
      else video.pause();
    }
  }

  update(elapsed: number) {
    for (const layer of this.animatedLayers) {
      const speed = layer.animation.speed ?? 1;
      const amplitude = layer.animation.amplitude ?? 0.06;
      const time = elapsed * speed + layer.phase;

      layer.object.position.copy(layer.basePosition);
      layer.object.rotation.copy(layer.baseRotation);
      layer.object.scale.copy(layer.baseScale);

      if (layer.animation.type === "float") {
        layer.object.position.y += Math.sin(time) * amplitude;
      } else if (layer.animation.type === "pulse") {
        const pulse = 1 + Math.sin(time * 2) * amplitude;
        layer.object.scale.set(
          layer.baseScale.x * pulse,
          layer.baseScale.y * pulse,
          layer.baseScale.z * pulse,
        );
      } else if (layer.animation.type === "rotate") {
        layer.object.rotation.z = layer.baseRotation.z + elapsed * speed;
        layer.object.rotation.y = layer.baseRotation.y + elapsed * speed * 0.45;
      } else if (layer.animation.type === "orbit") {
        layer.object.position.x += Math.cos(time) * amplitude;
        layer.object.position.y += Math.sin(time) * amplitude;
      }
    }
  }

  dispose() {
    this.targetVisible = false;
    for (const video of this.videos) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    this.videos.clear();

    for (const texture of this.textures) texture.dispose();
    this.textures.clear();
    for (const material of this.materials) material.dispose();
    this.materials.clear();
    for (const geometry of this.geometries) geometry.dispose();
    this.geometries.clear();
    this.animatedLayers = [];
  }

  private createVideo(url: string) {
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";
    this.videos.add(video);
    if (this.targetVisible) void video.play().catch(() => undefined);
    return video;
  }

  private registerTexture<T extends THREE.Texture>(texture: T) {
    this.textures.add(texture);
    return texture;
  }

  private registerMaterial<T extends THREE.Material>(material: T) {
    this.materials.add(material);
    return material;
  }

  private registerGeometry<T extends THREE.BufferGeometry>(geometry: T) {
    this.geometries.add(geometry);
    return geometry;
  }

  private async loadTexture(url: string) {
    const texture = await new THREE.TextureLoader().loadAsync(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    return this.registerTexture(texture);
  }

  private createVideoTexture(video: HTMLVideoElement) {
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return this.registerTexture(texture);
  }

  private async createDifferenceVideoPlane(options: {
    videoUrl: string;
    targetImageUrl: string;
    targetAspectRatio: number;
    thresholdLow: number;
    thresholdHigh: number;
    preferNativeAlpha: boolean;
  }) {
    const video = this.createVideo(options.videoUrl);
    const videoTexture = this.createVideoTexture(video);
    const targetTexture = await this.loadTexture(options.targetImageUrl);

    const material = this.registerMaterial(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uVideo: { value: videoTexture },
          uTarget: { value: targetTexture },
          uThresholdLow: { value: options.thresholdLow },
          uThresholdHigh: { value: options.thresholdHigh },
          uPreferNativeAlpha: { value: options.preferNativeAlpha ? 1 : 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uVideo;
          uniform sampler2D uTarget;
          uniform float uThresholdLow;
          uniform float uThresholdHigh;
          uniform float uPreferNativeAlpha;
          varying vec2 vUv;

          void main() {
            vec4 videoColor = texture2D(uVideo, vUv);
            vec3 targetColor = texture2D(uTarget, vUv).rgb;
            float difference = distance(videoColor.rgb, targetColor);
            float extractedAlpha = smoothstep(uThresholdLow, uThresholdHigh, difference);
            float nativeOrExtracted = mix(
              videoColor.a,
              extractedAlpha,
              step(0.999, videoColor.a)
            );
            float alpha = mix(extractedAlpha, nativeOrExtracted, uPreferNativeAlpha);
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(videoColor.rgb, alpha);
          }
        `,
      }),
    );

    const aspectRatio = Math.max(options.targetAspectRatio, 0.1);
    const geometry = this.registerGeometry(new THREE.PlaneGeometry(1, 1 / aspectRatio));
    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = 0.02;
    return plane;
  }

  private applyTransform(object: THREE.Object3D, transform: ArLayerTransform) {
    object.position.set(
      transform.position.x,
      transform.position.y,
      transform.position.z,
    );
    object.rotation.set(
      transform.rotation.x,
      transform.rotation.y,
      transform.rotation.z,
    );
    object.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
  }

  private addAnimation(
    object: THREE.Object3D,
    animation: ArLayerAnimation | undefined,
    phase: number,
  ) {
    if (!animation || animation.type === "none") return;
    this.animatedLayers.push({
      object,
      animation,
      basePosition: object.position.clone(),
      baseRotation: object.rotation.clone(),
      baseScale: object.scale.clone(),
      phase,
    });
  }

  private async createSpatialLayer(layer: ArSceneLayer, phase: number) {
    let object: THREE.Object3D;

    if (layer.type === "image") {
      const texture = await this.loadTexture(layer.url);
      const material = this.registerMaterial(
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          blending: blendingFor(layer.blendMode),
          side: THREE.DoubleSide,
        }),
      );
      const geometry = this.registerGeometry(
        new THREE.PlaneGeometry(1, 1 / Math.max(layer.aspectRatio, 0.05)),
      );
      object = new THREE.Mesh(geometry, material);
    } else if (layer.type === "video") {
      const video = this.createVideo(layer.url);
      const texture = this.createVideoTexture(video);
      const material = layer.alphaPacking === "side-by-side"
        ? this.registerMaterial(new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            side: THREE.DoubleSide,
            uniforms: { uPackedVideo: { value: texture } },
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D uPackedVideo;
              varying vec2 vUv;
              void main() {
                vec3 color = texture2D(uPackedVideo, vec2(vUv.x * 0.5, vUv.y)).rgb;
                vec3 matte = texture2D(uPackedVideo, vec2(0.5 + vUv.x * 0.5, vUv.y)).rgb;
                float alpha = clamp((dot(matte, vec3(0.299, 0.587, 0.114)) - 0.02) / 0.96, 0.0, 1.0);
                if (alpha < 0.01) discard;
                gl_FragColor = vec4(color, alpha);
              }
            `,
          }))
        : this.registerMaterial(new THREE.MeshBasicMaterial({
            map: texture,
            transparent: layer.transparent ?? true,
            depthWrite: false,
            blending: blendingFor(layer.blendMode),
            side: THREE.DoubleSide,
          }));
      const geometry = this.registerGeometry(
        new THREE.PlaneGeometry(1, 1 / Math.max(layer.aspectRatio, 0.05)),
      );
      object = new THREE.Mesh(geometry, material);
    } else if (layer.type === "model") {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const gltf = await new GLTFLoader().loadAsync(layer.url);
      object = gltf.scene;
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        this.geometries.add(child.geometry);
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) this.materials.add(material);
      });
    } else if (layer.type === "particles") {
      const count = Math.min(Math.max(layer.count ?? 28, 4), 120);
      const positions = new Float32Array(count * 3);
      for (let index = 0; index < count; index += 1) {
        const offset = index * 3;
        const angle = (index / count) * Math.PI * 2;
        const radius = 0.12 + ((index * 17) % 11) * 0.018;
        positions[offset] = Math.cos(angle) * radius;
        positions[offset + 1] = Math.sin(angle) * radius;
        positions[offset + 2] = ((index % 7) - 3) * 0.008;
      }
      const geometry = this.registerGeometry(new THREE.BufferGeometry());
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = this.registerMaterial(
        new THREE.PointsMaterial({
          color: safeColor(layer.color, 0x9defff),
          size: 0.018,
          transparent: true,
          opacity: 0.88,
          depthWrite: false,
          blending: blendingFor(layer.blendMode ?? "additive"),
        }),
      );
      object = new THREE.Points(geometry, material);
    } else {
      const material = this.registerMaterial(
        new THREE.MeshBasicMaterial({
          color: safeColor(layer.color, 0x9defff),
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: blendingFor(layer.blendMode),
          side: THREE.DoubleSide,
        }),
      );
      const geometry =
        layer.shape === "box"
          ? this.registerGeometry(new THREE.BoxGeometry(0.5, 0.5, 0.08))
          : layer.shape === "torus"
            ? this.registerGeometry(new THREE.TorusGeometry(0.28, 0.018, 16, 80))
            : this.registerGeometry(new THREE.RingGeometry(0.22, 0.24, 80));
      object = new THREE.Mesh(geometry, material);
    }

    this.applyTransform(object, layer.transform);
    this.addAnimation(object, layer.animation, phase);
    return object;
  }

  private createProceduralOverlay() {
    const group = new THREE.Group();
    const artworkPlane = new THREE.Mesh(
      this.registerGeometry(new THREE.PlaneGeometry(1, 0.552)),
      this.registerMaterial(
        new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
        }),
      ),
    );
    artworkPlane.position.z = 0.01;
    group.add(artworkPlane);

    const halo = new THREE.Mesh(
      this.registerGeometry(new THREE.TorusKnotGeometry(0.14, 0.035, 96, 14)),
      this.registerMaterial(
        new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.95 }),
      ),
    );
    halo.position.set(0, 0, 0.12);
    group.add(halo);
    this.addAnimation(halo, { type: "rotate", speed: 0.9, amplitude: 0.08 }, 0);

    const ring = new THREE.Mesh(
      this.registerGeometry(new THREE.TorusGeometry(0.3, 0.008, 16, 96)),
      this.registerMaterial(
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
        }),
      ),
    );
    ring.position.z = 0.06;
    group.add(ring);
    return group;
  }
}