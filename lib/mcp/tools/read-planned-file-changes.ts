import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, plannedFileChanges } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const readPlannedFileChangesSchema = z.object({
  id: z.string().uuid().optional().describe("Optional planned file change ID to fetch a specific change"),
  storyId: z.string().uuid().optional().describe("Optional story ID to filter planned file changes by story"),
  status: z.enum(['planned', 'in_progress', 'completed', 'failed']).optional().describe("Optional status filter"),
});

export const readPlannedFileChangesTool: ToolDefinition = {
  name: "read_planned_file_changes",
  description: "Read planned file changes from the database. Can fetch all planned file changes, filter by story ID, status, or get a specific change by ID.",
  schema: readPlannedFileChangesSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Fetch specific planned file change by ID
        const results = await db.select().from(plannedFileChanges).where(eq(plannedFileChanges.id, params.id));

        if (results.length === 0) {
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
            text: JSON.stringify(results[0], null, 2),
          }],
        };
      }

      // Build conditions
      const conditions = [];
      if (params.storyId) conditions.push(eq(plannedFileChanges.storyId, params.storyId));
      if (params.status) conditions.push(eq(plannedFileChanges.status, params.status));

      let query;
      if (conditions.length > 0) {
        query = db.select().from(plannedFileChanges).where(and(...conditions));
      } else {
        query = db.select().from(plannedFileChanges);
      }

      const results = await query;

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error reading planned file changes: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
