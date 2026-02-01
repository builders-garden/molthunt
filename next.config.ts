import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/@:username',
        destination: '/agents/:username',
      },
    ];
  },
};

export default nextConfig;
