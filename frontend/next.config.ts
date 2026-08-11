import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a minimal server.js and only the node_modules
  // actually reached at runtime. Without this the Docker image has to carry the
  // full ~500 MB node_modules tree.
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
