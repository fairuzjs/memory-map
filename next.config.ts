import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase storage
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // DiceBear avatars
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        // Any other https host (fallback)
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
