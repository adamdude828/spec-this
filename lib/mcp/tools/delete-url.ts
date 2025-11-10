import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, urls } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const deleteUrlSchema = z.object({
  id: z.string().uuid().describe("URL ID to delete"),
});

export const deleteUrlTool: ToolDefinition = {
  name: "delete_url",
  description: "Delete a URL from the knowledge base by its ID.",
  schema: deleteUrlSchema,
  handler: async (params) => {
    try {
      const result = await db
        .delete(urls)
        .where(eq(urls.id, params.id))
        .returning();

      if (result.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No URL found with ID: ${params.id}`,
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `URL deleted successfully: ${result[0].url}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error deleting URL: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
