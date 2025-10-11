import { z } from "zod";
import type { ToolDefinition } from "../types/tool.ts";

const echoSchema = z.object({
  message: z.string().describe("The message to echo back"),
});

export const echoTool: ToolDefinition = {
  name: "echo",
  description: "Echoes back the provided message. Useful for testing MCP connectivity.",
  schema: echoSchema,
  handler: async (params) => {
    try {
      return {
        content: [{
          type: "text",
          text: `Echo: ${params.message}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error in echo tool: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
