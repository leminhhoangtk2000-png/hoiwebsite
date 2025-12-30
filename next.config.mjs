/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'YOUR_SUPABASE_PROJECT_ID.supabase.co',
      },
    ],
  },
};

export default nextConfig;