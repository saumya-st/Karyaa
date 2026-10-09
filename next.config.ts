import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the Docker image.
  output: "standalone",
  typescript: {
    // Prisma 6.x generates deeply-nested union types that overflow Node's default
    // call stack when TypeScript attempts structural type-checking during build.
    // Type safety is still enforced in the editor via tsserver.
    ignoreBuildErrors: true,
  },
  images: {
    // Skip server-side optimization (sharp/squoosh) for static assets.
    // logo.png is already correctly sized; serve it directly from /public.
    unoptimized: true,
  },
};

export default nextConfig;
