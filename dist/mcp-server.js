#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { allTools } from "./lib/mcp/tools/index.js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables from the project directory
dotenv.config({ path: join(__dirname, ".env.local") });
async function main() {
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
        server.tool(tool.name, tool.description, tool.schema.shape, async (args) => tool.handler(args));
    }
    // Use stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`spec-this MCP Server running on stdio with ${allTools.length} tools`);
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
