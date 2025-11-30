/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // ضروري لـ StackBlitz
  images: {
    domains: [
      'cdn-icons-png.flaticon.com', 
      'tile.rainviewer.com', 
      'source.unsplash.com', 
      'images.unsplash.com'
    ],
  },
  // تجاهل أخطاء التدقيق أثناء النشر لضمان النجاح
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // إعدادات خاصة لمكتبات الذكاء الاصطناعي (TensorFlow)
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
