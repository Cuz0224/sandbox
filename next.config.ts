import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 启用 standalone 输出以便在 Docker 中运行
  output: 'standalone',
  
  // 服务器外部包配置
  serverExternalPackages: ['@prisma/client'],
  
  // 图片配置
  images: {
    domains: ['localhost'],
    unoptimized: true, // 在容器中禁用图片优化以减少内存使用
  },
  
  // 压缩配置
  compress: true,
  
  // 构建配置
  poweredByHeader: false,
  
  // 环境变量
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // webpack 配置
  webpack: (config, { isServer }) => {
    // 优化打包
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // 确保路径别名在Docker环境中正确工作
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    return config;
  },
};

export default nextConfig;
