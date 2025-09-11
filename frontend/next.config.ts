import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:6060";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `${apiBase}/auth/:path*`,
      },
      {
        source: "/user/:path*",
        destination: `${apiBase}/user/:path*`,
      },
      {
        source: "/note/:path*",
        destination: `${apiBase}/note/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
  reactStrictMode: false,
};

export default nextConfig;
