import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, stories } from "../../db/index.js";
import type { ToolDefinition } from "../types/tool.js";

const readStoriesSchema = z.object({
  id: z.string().uuid().optional().describe("Optional story ID to fetch a specific story"),
  epicId: z.string().uuid().optional().describe("Optional epic ID to filter stories by epic"),
  status: z.enum(['draft', 'ready', 'in_progress', 'review', 'completed']).optional().describe("Optional status filter"),
});

export const readStoriesTool: ToolDefinition = {
  name: "read_stories",
  description: "Read stories from the database. Can fetch all stories, filter by epic ID, status, or get a specific story by ID.",
  schema: readStoriesSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Fetch specific story by ID
        const results = await db.select().from(stories).where(eq(stories.id, params.id));

        if (results.length === 0) {
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
            text: JSON.stringify(results[0], null, 2),
          }],
        };
      }

      // Build conditions
      const conditions = [];
      if (params.epicId) conditions.push(eq(stories.epicId, params.epicId));
      if (params.status) conditions.push(eq(stories.status, params.status));

      let query;
      if (conditions.length > 0) {
        query = db.select().from(stories).where(and(...conditions));
      } else {
        query = db.select().from(stories);
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
          text: `Error reading stories: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
