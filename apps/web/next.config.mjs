/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sigef/types', '@sigef/validators'],
  experimental: { typedRoutes: true },
};

export default nextConfig;
