import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },
  /** Browser → same-origin `/api/admin-backend/*` → Express admin API (avoids CORS / wrong-host issues). */
  async rewrites() {
    const target = (process.env.ADMIN_API_PROXY_TARGET ?? "http://127.0.0.1:5001").replace(/\/$/, "");
    return [{ source: "/api/admin-backend/:path*", destination: `${target}/api/admin/:path*` }];
  },
};

export default nextConfig;
