import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' as const } : {}),
  transpilePackages: ['@agencyos/shared'],
};

export default nextConfig;
