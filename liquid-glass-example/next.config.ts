import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    externalDir: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
