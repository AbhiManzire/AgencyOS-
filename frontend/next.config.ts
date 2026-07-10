import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' as const } : {}),
  transpilePackages: ['@agencyos/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

if (process.env.DOCKER_BUILD === 'true') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (!apiUrl.trim() || /localhost|127\.0\.0\.1/i.test(apiUrl)) {
    throw new Error(
      'DOCKER_BUILD requires NEXT_PUBLIC_API_URL set to a non-localhost production API URL.',
    );
  }
}

export default nextConfig;
