import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, tasks } from "../../db/index.js";
const readTasksSchema = z.object({
    id: z.string().uuid().optional().describe("Optional task ID to fetch a specific task"),
    storyId: z.string().uuid().optional().describe("Optional story ID to filter tasks by story"),
    status: z.enum(['todo', 'in_progress', 'blocked', 'completed']).optional().describe("Optional status filter"),
});
export const readTasksTool = {
    name: "read_tasks",
    description: "Read tasks from the database. Can fetch all tasks, filter by story ID, status, or get a specific task by ID.",
    schema: readTasksSchema,
    handler: async (params) => {
        try {
            if (params.id) {
                // Fetch specific task by ID
                const results = await db.select().from(tasks).where(eq(tasks.id, params.id));
                if (results.length === 0) {
                    return {
                        content: [{
                                type: "text",
                                text: `No task found with ID: ${params.id}`,
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
            if (params.storyId)
                conditions.push(eq(tasks.storyId, params.storyId));
            if (params.status)
                conditions.push(eq(tasks.status, params.status));
            let query;
            if (conditions.length > 0) {
                query = db.select().from(tasks).where(and(...conditions));
            }
            else {
                query = db.select().from(tasks);
            }
            const results = await query;
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(results, null, 2),
                    }],
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error reading tasks: ${error instanceof Error ? error.message : String(error)}`,
                    }],
            };
        }
    },
};
