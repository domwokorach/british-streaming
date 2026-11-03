import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (copies only traced deps). Vercel packages the app itself, and its
  // build adapter fails with standalone output ("ENOENT .next/next-server.js.nft.json"; reproducible with any adapter), so it
  // is skipped whenever Vercel or an adapter is in play; Docker, CI and local production runs keep it.
  output: process.env.VERCEL || process.env.NEXT_ADAPTER_PATH ? undefined : "standalone",
  poweredByHeader: false,
  // Native Argon2 binding must be loaded by Node, not bundled.
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
};

export default nextConfig;
