/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Enable image optimization and caching
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache images for 60 seconds minimum
  },
  // Skip these dynamic routes during static generation
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'net', 'tls', 'http2' on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        http2: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

