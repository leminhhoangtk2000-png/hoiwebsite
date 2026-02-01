/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cf.shopee.vn',
      },
      {
        protocol: 'https',
        hostname: 'down-vn.img.susercontent.com',
      },
    ],
  },
};

export default nextConfig;