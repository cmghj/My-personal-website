import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本地开发时隐藏左下角的 Next.js 工具浮标，保持预览接近正式网站。
  devIndicators: false,
  // 不自动向项目根目录写入框架的 AI 说明文件。
  agentRules: false,
  // 固定项目根目录，避免 Next 误用主目录里的其它 lockfile
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
