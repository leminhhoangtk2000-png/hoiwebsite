/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'abcdefgh.supabase.co', // Thay bằng ID thật của bạn
      },
    ],
  },
};

export default nextConfig;