import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, stories } from "../../db/index.js";
const upsertStorySchema = z.object({
    id: z.string().uuid().optional().describe("Story ID for update, omit for insert"),
    epicId: z.string().uuid().describe("Epic ID this story belongs to"),
    title: z.string().min(1).describe("Story title"),
    description: z.string().optional().describe("Story description"),
    acceptanceCriteria: z.string().optional().describe("Acceptance criteria"),
    status: z.enum(['draft', 'ready', 'in_progress', 'review', 'completed']).optional().describe("Story status"),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe("Story priority"),
    orderIndex: z.number().int().optional().describe("Order within epic"),
});
export const upsertStoryTool = {
    name: "upsert_story",
    description: "Create a new story or update an existing one. Provide an ID to update, omit ID to create new.",
    schema: upsertStorySchema,
    handler: async (params) => {
        try {
            if (params.id) {
                // Update existing story
                const updateData = {
                    updatedAt: new Date(),
                };
                if (params.epicId !== undefined)
                    updateData.epicId = params.epicId;
                if (params.title !== undefined)
                    updateData.title = params.title;
                if (params.description !== undefined)
                    updateData.description = params.description;
                if (params.acceptanceCriteria !== undefined)
                    updateData.acceptanceCriteria = params.acceptanceCriteria;
                if (params.status !== undefined)
                    updateData.status = params.status;
                if (params.priority !== undefined)
                    updateData.priority = params.priority;
                if (params.orderIndex !== undefined)
                    updateData.orderIndex = params.orderIndex;
                const result = await db
                    .update(stories)
                    .set(updateData)
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
                            text: `Story updated successfully:\n${JSON.stringify(result[0], null, 2)}`,
                        }],
                };
            }
            else {
                // Insert new story
                const insertData = {
                    epicId: params.epicId,
                    title: params.title,
                };
                if (params.description !== undefined)
                    insertData.description = params.description;
                if (params.acceptanceCriteria !== undefined)
                    insertData.acceptanceCriteria = params.acceptanceCriteria;
                if (params.status !== undefined)
                    insertData.status = params.status;
                if (params.priority !== undefined)
                    insertData.priority = params.priority;
                if (params.orderIndex !== undefined)
                    insertData.orderIndex = params.orderIndex;
                const result = await db.insert(stories).values(insertData).returning();
                return {
                    content: [{
                            type: "text",
                            text: `Story created successfully:\n${JSON.stringify(result[0], null, 2)}`,
                        }],
                };
            }
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error upserting story: ${error instanceof Error ? error.message : String(error)}`,
                    }],
            };
        }
    },
};
