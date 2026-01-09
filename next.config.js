/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  basePath: '/app',
  assetPrefix: '/app',
};

module.exports = nextConfig;
