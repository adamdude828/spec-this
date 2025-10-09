import { createMcpHandler } from 'mcp-handler';
import { allTools } from '@/lib/mcp/tools';

/**
 * MCP Server using Vercel's mcp-handler
 * Handles both Streamable HTTP and SSE transports
 * SSE requires Redis for state management (configured on port 6380)
 * No separate server needed - everything runs through Next.js
 */

const handler = createMcpHandler(
  (server) => {
    // Register all tools from our registry
    for (const tool of allTools) {
      server.tool(
        tool.name,
        tool.description,
        tool.schema.shape, // Pass the Zod schema shape
        async (args) => {
          // Call the original handler
          return await tool.handler(args as never);
        }
      );
    }
  },
  {
    basePath: '/api',
    // Redis for SSE state management (using custom port 6380)
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6380',
    verboseLogs: process.env.NODE_ENV === 'development',
  }
);

export { handler as GET, handler as POST };
