import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old URLs keep working after the v2 route cleanup.
  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: true },
      { source: '/auth/signup', destination: '/signup', permanent: true },
      { source: '/p/:slug/bugs/:code', destination: '/p/:slug/b/:code', permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
