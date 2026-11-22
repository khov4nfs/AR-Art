import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep MindAR worker and browser-side tracking compatible with Turbopack.
  transpilePackages: ["mind-ar"],
  turbopack: {
    resolveAlias: {
      fs: { browser: "./src/shims/empty.ts" },
      "node-fetch": { browser: "./src/shims/browser-node-fetch.ts" },
    },
  },
  output: "standalone",
  // Files uploaded after the build are not served by `next start`; fall back
  // to a route that reads them from public/uploads.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }],
    };
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
