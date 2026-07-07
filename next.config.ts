import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Diperbesar menjadi 50MB untuk upload video MP4/WebM
    },
  },
  output: "standalone",
};

export default nextConfig;
