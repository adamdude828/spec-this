#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./lib/mcp/server.js";
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
  // Create the MCP server with all tools
  const server = createMcpServer();

  // Use stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`spec-this MCP Server running on stdio with ${allTools.length} tools`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
