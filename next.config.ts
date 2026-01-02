import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
		{
			protocol: 'https',
			hostname: 'buycoffee.to',
			pathname: '/_ipx/_/static/**',
		},
    ],
  },
};

export default nextConfig;
