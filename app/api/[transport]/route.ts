import { createMcpHandler } from 'mcp-handler';
import { allTools } from '@/lib/mcp/tools';

/**
 * MCP Server using Vercel's mcp-handler
 * Handles Streamable HTTP transport only
 * No separate server needed - everything runs through Next.js
 */

// Force dynamic rendering - don't prerender during build/start
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  undefined, // serverOptions - using defaults
  {
    basePath: '/api', // this needs to match where the [transport] is located
    redisUrl: process.env.REDIS_URL, // Optional: for SSE transport support
  }
);

export { handler as GET, handler as POST };
