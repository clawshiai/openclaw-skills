import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'clawshi.app',
      },
      {
        protocol: 'https',
        hostname: 'www.moltbook.com',
      },
    ],
  },
};

export default nextConfig;
