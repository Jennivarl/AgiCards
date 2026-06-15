import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  async redirects() {
    // The new AgiCards v2 app lives at /studio — make it the site root.
    return [{ source: "/", destination: "/studio", permanent: false }];
  }
};

export default nextConfig;
