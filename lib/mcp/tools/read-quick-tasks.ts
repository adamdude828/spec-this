import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, quickTasks } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const readQuickTasksSchema = z.object({
  id: z.string().uuid().optional().describe("Optional quick task ID to fetch a specific quick task"),
  repoId: z.string().uuid().optional().describe("Optional repository ID to filter quick tasks by repository"),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional().describe("Optional status filter"),
});

export const readQuickTasksTool: ToolDefinition = {
  name: "read_quick_tasks",
  description: "Read quick tasks from the database. Can fetch all quick tasks, filter by repository ID, status, or get a specific quick task by ID. Quick tasks are lightweight tasks that belong directly to a repository and are designed for AI agents to quickly plan and execute small changes.",
  schema: readQuickTasksSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Fetch specific quick task by ID
        const results = await db.select().from(quickTasks).where(eq(quickTasks.id, params.id));

        if (results.length === 0) {
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
            text: JSON.stringify(results[0], null, 2),
          }],
        };
      }

      // Build conditions
      const conditions = [];
      if (params.repoId) conditions.push(eq(quickTasks.repoId, params.repoId));
      if (params.status) conditions.push(eq(quickTasks.status, params.status));

      let query;
      if (conditions.length > 0) {
        query = db.select().from(quickTasks).where(and(...conditions));
      } else {
        query = db.select().from(quickTasks);
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
          text: `Error reading quick tasks: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
