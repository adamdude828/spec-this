import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["tree-sitter", "tree-sitter-typescript"],
  eslint: {
    // Don't fail build on ESLint warnings (only on errors)
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't fail build on TypeScript errors during production builds
    ignoreBuildErrors: false,
  },
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
