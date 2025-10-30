import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, plannedFileChanges } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const deletePlannedFileChangeSchema = z.object({
  id: z.string().uuid().describe("Planned file change ID to delete"),
});

export const deletePlannedFileChangeTool: ToolDefinition = {
  name: "delete_planned_file_change",
  description: "Delete a planned file change by ID.",
  schema: deletePlannedFileChangeSchema,
  handler: async (params) => {
    try {
      const result = await db
        .delete(plannedFileChanges)
        .where(eq(plannedFileChanges.id, params.id))
        .returning();

      if (result.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No planned file change found with ID: ${params.id}`,
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `Planned file change deleted successfully:\n${JSON.stringify(result[0], null, 2)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error deleting planned file change: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
