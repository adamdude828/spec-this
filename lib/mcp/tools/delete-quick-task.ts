import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, quickTasks } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const deleteQuickTaskSchema = z.object({
  id: z.string().uuid().describe("Quick task ID to delete"),
});

export const deleteQuickTaskTool: ToolDefinition = {
  name: "delete_quick_task",
  description: "Delete a quick task by ID. This will cascade delete all associated planned file changes.",
  schema: deleteQuickTaskSchema,
  handler: async (params) => {
    try {
      const result = await db
        .delete(quickTasks)
        .where(eq(quickTasks.id, params.id))
        .returning();

      if (result.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No quick task found with ID: ${params.id}`,
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `Quick task deleted successfully:\n${JSON.stringify(result[0], null, 2)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error deleting quick task: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
