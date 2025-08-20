import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "statics.aave.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "token-logos.family.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
