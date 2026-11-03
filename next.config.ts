import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (copies only traced deps). Vercel packages the app itself, and its
  // build adapter fails with standalone output ("next-server.js.nft.json" missing), so it is skipped there; Docker, CI
  // and local production runs (where VERCEL is unset) keep it.
  output: process.env.VERCEL ? undefined : "standalone",
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
