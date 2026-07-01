import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 固定项目根目录，避免 Next 误用主目录里的其它 lockfile
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
