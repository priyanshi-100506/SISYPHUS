/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for the multi-stage Docker build (copies only what's needed to run)
  output: "standalone",
  // Proxy /api/* to the backend so the browser never does cross-origin requests
  // during development. In production with Docker, the backend URL is set via env var.
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    // Strip /api/v1 suffix so we can proxy the full path
    const backendBase = apiBase.replace(/\/api\/v1\/?$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
