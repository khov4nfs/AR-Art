const MINDAR_COMPILER_SOURCES = [
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js",
  "https://unpkg.com/mind-ar@1.2.5/dist/mindar-image.prod.js",
] as const;

const COMPILER_LOAD_TIMEOUT_MS = 20_000;

type CompilerBuffer = ArrayBuffer | Uint8Array;

type CompilerInstance = {
  compileImageTargets(
    images: HTMLImageElement[],
    onProgress?: (progress: number) => void,
  ): Promise<unknown[]>;
  exportData(): CompilerBuffer | Promise<CompilerBuffer>;
};

type CompilerConstructor = new () => CompilerInstance;

type MindArGlobal = {
  IMAGE?: {
    Compiler?: CompilerConstructor;
  };
  Compiler?: CompilerConstructor;
};

let compilerLoadPromise: Promise<CompilerConstructor> | null = null;

function getCompilerConstructor() {
  const mindAr = (
    window as typeof window & {
      MINDAR?: MindArGlobal;
    }
  ).MINDAR;

  return mindAr?.IMAGE?.Compiler ?? mindAr?.Compiler;
}

function supportsWebGl() {
  const canvas = document.createElement("canvas");

  try {
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

function removeStaleCompilerScripts() {
  document
    .querySelectorAll<HTMLScriptElement>("script[data-mindar-compiler]")
    .forEach((script) => script.remove());
}

function loadCompilerModule(source: string) {
  return new Promise<CompilerConstructor>((resolve, reject) => {
    removeStaleCompilerScripts();

    const script = document.createElement("script");
    script.type = "module";
    script.src = source;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.mindarCompiler = source;

    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error("MindAR compiler loading timed out."));
    }, COMPILER_LOAD_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
    };

    script.onload = () => {
      cleanup();

      const Compiler = getCompilerConstructor();
      if (!Compiler) {
        script.remove();
        reject(
          new Error(
            "MindAR compiler module loaded but did not expose the compiler API.",
          ),
        );
        return;
      }

      resolve(Compiler);
    };

    script.onerror = () => {
      cleanup();
      script.remove();
      reject(new Error(`Unable to load MindAR compiler from ${source}.`));
    };

    document.head.appendChild(script);
  });
}

async function initializeMindArCompiler() {
  const existing = getCompilerConstructor();
  if (existing) return existing;

  if (!supportsWebGl()) {
    throw new Error(
      "WebGL is unavailable in this browser. Enable hardware acceleration or try a current Chrome, Edge, or Safari browser.",
    );
  }

  let lastError: unknown = null;

  for (const source of MINDAR_COMPILER_SOURCES) {
    try {
      return await loadCompilerModule(source);
    } catch (cause) {
      lastError = cause;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : "Unable to initialize the MindAR image compiler.",
  );
}

async function loadMindArCompiler() {
  const existing = getCompilerConstructor();
  if (existing) return existing;

  if (!compilerLoadPromise) {
    compilerLoadPromise = initializeMindArCompiler().catch((cause) => {
      compilerLoadPromise = null;
      throw cause;
    });
  }

  return compilerLoadPromise;
}

export async function compileMindTarget(
  file: File,
  onProgress: (progress: number) => void,
) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error("Unable to read the target image."));
      element.src = imageUrl;
    });

    const Compiler = await loadMindArCompiler();
    const compiler = new Compiler();

    await compiler.compileImageTargets([image], (progress) => {
      onProgress(Math.max(0, Math.min(100, Math.round(progress))));
    });

    const buffer = await compiler.exportData();
    onProgress(100);

    const bytes =
      buffer instanceof Uint8Array
        ? buffer
        : new Uint8Array(buffer);
    const blobBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(blobBuffer).set(bytes);

    return new Blob([blobBuffer], { type: "application/octet-stream" });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);

    if (
      message.includes("WebGL") ||
      message.includes("compileAndRun") ||
      message.includes("fragment shader")
    ) {
      throw new Error(
        "MindAR could not compile this target with the current WebGL backend. Enable browser hardware acceleration and retry in Chrome or Edge.",
      );
    }

    throw cause;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Compile a bounded gallery target bundle in the exact order supplied.
 * Cross-origin artwork images must allow CORS; failures are reported rather
 * than silently changing targetIndex mappings.
 */
export async function compileMindTargetImages(
  urls: readonly string[],
  onProgress: (progress: number) => void,
): Promise<Blob> {
  if (urls.length === 0) throw new Error("No artwork targets are available to scan.");

  const images = await Promise.all(urls.map((url) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load an artwork target. Check the artwork image or storage CORS settings."));
    image.src = url;
  })));

  const Compiler = await loadMindArCompiler();
  const compiler = new Compiler();
  await compiler.compileImageTargets(images, (progress) => {
    onProgress(Math.max(0, Math.min(100, Math.round(progress))));
  });
  const output = await compiler.exportData();
  const bytes = output instanceof Uint8Array ? output : new Uint8Array(output);
  // Copy into a plain ArrayBuffer to avoid retaining compiler internals.
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  onProgress(100);
  return new Blob([buffer], { type: "application/octet-stream" });
}
