import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, stories } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const deleteStorySchema = z.object({
  id: z.string().uuid().describe("Story ID to delete"),
});

export const deleteStoryTool: ToolDefinition = {
  name: "delete_story",
  description: "Delete a story by ID. This will cascade delete all associated planned file changes.",
  schema: deleteStorySchema,
  handler: async (params) => {
    try {
      const result = await db
        .delete(stories)
        .where(eq(stories.id, params.id))
        .returning();

      if (result.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No story found with ID: ${params.id}`,
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `Story deleted successfully:\n${JSON.stringify(result[0], null, 2)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error deleting story: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
