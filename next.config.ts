import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — public bucket
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // DiceBear — avatar fallback generator
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        // Google profile photos (via NextAuth Google provider)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // GitHub profile photos (jika ada OAuth GitHub)
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
