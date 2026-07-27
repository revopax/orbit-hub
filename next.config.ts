import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/brujula/:path*',
        destination: 'https://brujula-comercial-upax.vercel.app/:path*',
      },
      {
        source: '/redes/:path*',
        destination: 'https://redes-sociales-upax.vercel.app/:path*',
      },
      {
        source: '/hubspot/:path*',
        destination: 'https://hubspot-analytics-upax-zeta.vercel.app/:path*',
      },
    ];
  },
};

export default nextConfig;
