/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sigef/types', '@sigef/validators', '@sigef/db'],
  experimental: { typedRoutes: true },
};

export default nextConfig;
