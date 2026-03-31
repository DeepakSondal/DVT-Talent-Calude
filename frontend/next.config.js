/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: { serverComponentsExternalPackages: ["axios"] },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/ws",
  },
};

module.exports = nextConfig;
