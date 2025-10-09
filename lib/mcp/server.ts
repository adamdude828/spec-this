import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { allTools } from "./tools/index";

/**
 * Creates and configures an MCP server instance with all registered tools.
 * This server can be connected to different transports (stdio, HTTP, etc.)
 *
 * @returns Configured McpServer instance ready to connect to a transport
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "spec-this-mcp-server",
    description: "MCP server for spec-driven development tool",
    version: "1.0.0",
    capabilities: {
      tools: {},
    },
  });

  // Register all tools from the registry
  for (const tool of allTools) {
    server.tool(
      tool.name,
      tool.description,
      tool.schema.shape,
      async (args) => tool.handler(args as never)
    );
  }

  return server;
}
