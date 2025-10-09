import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["tree-sitter", "tree-sitter-typescript"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark tree-sitter as external for server builds
      config.externals = config.externals || [];
      config.externals.push("tree-sitter", "tree-sitter-typescript");
    }
    return config;
  },
};

export default nextConfig;
