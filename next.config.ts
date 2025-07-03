import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "polkachu.test.com",
      },
      {
        protocol: "https",
        hostname: "polkachu",
      },
      {
        protocol: "https",
        hostname: "polkachu.com",
      },
    ],
  },
};

export default nextConfig;
