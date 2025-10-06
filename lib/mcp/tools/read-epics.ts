import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, epics } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const readEpicsSchema = z.object({
  id: z.string().uuid().optional().describe("Optional epic ID to fetch a specific epic"),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional().describe("Optional status filter"),
});

export const readEpicsTool: ToolDefinition = {
  name: "read_epics",
  description: "Read epics from the database. Can fetch all epics, filter by status, or get a specific epic by ID.",
  schema: readEpicsSchema,
  handler: async (params) => {
    try {
      let query;

      if (params.id) {
        // Fetch specific epic by ID
        const results = await db.select().from(epics).where(eq(epics.id, params.id));

        if (results.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No epic found with ID: ${params.id}`,
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

      // Fetch all epics or filter by status
      if (params.status) {
        query = db.select().from(epics).where(eq(epics.status, params.status));
      } else {
        query = db.select().from(epics);
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
          text: `Error reading epics: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
