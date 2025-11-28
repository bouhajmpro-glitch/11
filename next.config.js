/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['cdn-icons-png.flaticon.com', 'tile.rainviewer.com'],
  },
  // إصلاح مشكلة مكتبة الذكاء الاصطناعي فقط (هذا ضروري تقنياً وليس خطأ)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "encoding": false,
      "fs": false,
      "path": false,
      "os": false,
    };
    return config;
  },
}

module.exports = nextConfig
