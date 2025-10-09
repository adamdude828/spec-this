import { createMcpHandler } from 'mcp-handler';
import { allTools } from '@/lib/mcp/tools';
import type { NextRequest } from 'next/server';

/**
 * MCP Server using Vercel's mcp-handler
 * Handles Streamable HTTP transport only
 * No separate server needed - everything runs through Next.js
 */

// Force dynamic rendering - don't prerender during build/start
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialization to avoid connections during build
let handler: ReturnType<typeof createMcpHandler> | null = null;

function getHandler() {
  if (!handler) {
    handler = createMcpHandler(
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
      // No Redis config - HTTP transport only
    );
  }
  return handler;
}

export async function GET(request: NextRequest) {
  return getHandler()(request);
}

export async function POST(request: NextRequest) {
  return getHandler()(request);
}
