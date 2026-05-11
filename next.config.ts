import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: isProduction ? '/shailu' : '',
  assetPrefix: isProduction ? '/shailu/' : undefined,
  reactStrictMode: true,
  poweredByHeader: false
};

export default nextConfig;
