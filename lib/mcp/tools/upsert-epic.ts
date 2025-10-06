import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, epics } from "../../db";
import type { ToolDefinition } from "../types/tool";

const upsertEpicSchema = z.object({
  id: z.string().uuid().optional().describe("Epic ID for update, omit for insert"),
  title: z.string().min(1).describe("Epic title"),
  description: z.string().optional().describe("Epic description"),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional().describe("Epic status"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe("Epic priority"),
  createdBy: z.string().optional().describe("Creator identifier"),
});

export const upsertEpicTool: ToolDefinition = {
  name: "upsert_epic",
  description: "Create a new epic or update an existing one. Provide an ID to update, omit ID to create new.",
  schema: upsertEpicSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Update existing epic
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (params.title !== undefined) updateData.title = params.title;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.status !== undefined) updateData.status = params.status;
        if (params.priority !== undefined) updateData.priority = params.priority;
        if (params.createdBy !== undefined) updateData.createdBy = params.createdBy;

        const result = await db
          .update(epics)
          .set(updateData)
          .where(eq(epics.id, params.id))
          .returning();

        if (result.length === 0) {
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
            text: `Epic updated successfully:\n${JSON.stringify(result[0], null, 2)}`,
          }],
        };
      } else {
        // Insert new epic
        const insertData: any = {
          title: params.title,
        };

        if (params.description !== undefined) insertData.description = params.description;
        if (params.status !== undefined) insertData.status = params.status;
        if (params.priority !== undefined) insertData.priority = params.priority;
        if (params.createdBy !== undefined) insertData.createdBy = params.createdBy;

        const result = await db.insert(epics).values(insertData).returning();

        return {
          content: [{
            type: "text",
            text: `Epic created successfully:\n${JSON.stringify(result[0], null, 2)}`,
          }],
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error upserting epic: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
