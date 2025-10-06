import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tasks } from "../../db";
import type { ToolDefinition } from "../types/tool";

const upsertTaskSchema = z.object({
  id: z.string().uuid().optional().describe("Task ID for update, omit for insert"),
  storyId: z.string().uuid().describe("Story ID this task belongs to"),
  title: z.string().min(1).describe("Task title"),
  description: z.string().optional().describe("Task description"),
  status: z.enum(['todo', 'in_progress', 'blocked', 'completed']).optional().describe("Task status"),
  estimatedHours: z.number().optional().describe("Estimated hours to complete"),
  actualHours: z.number().optional().describe("Actual hours spent"),
  orderIndex: z.number().int().optional().describe("Order within story"),
  completedAt: z.string().datetime().optional().describe("Completion timestamp (ISO 8601)"),
});

export const upsertTaskTool: ToolDefinition = {
  name: "upsert_task",
  description: "Create a new task or update an existing one. Provide an ID to update, omit ID to create new.",
  schema: upsertTaskSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Update existing task
        const updateData: Partial<typeof tasks.$inferInsert> = {
          updatedAt: new Date(),
        };

        if (params.storyId !== undefined) updateData.storyId = params.storyId;
        if (params.title !== undefined) updateData.title = params.title;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.status !== undefined) updateData.status = params.status;
        if (params.estimatedHours !== undefined) updateData.estimatedHours = params.estimatedHours.toString();
        if (params.actualHours !== undefined) updateData.actualHours = params.actualHours.toString();
        if (params.orderIndex !== undefined) updateData.orderIndex = params.orderIndex;
        if (params.completedAt !== undefined) updateData.completedAt = new Date(params.completedAt);

        const result = await db
          .update(tasks)
          .set(updateData)
          .where(eq(tasks.id, params.id))
          .returning();

        if (result.length === 0) {
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
            text: `Task updated successfully:\n${JSON.stringify(result[0], null, 2)}`,
          }],
        };
      } else {
        // Insert new task
        const insertData: typeof tasks.$inferInsert = {
          storyId: params.storyId,
          title: params.title,
        };

        if (params.description !== undefined) insertData.description = params.description;
        if (params.status !== undefined) insertData.status = params.status;
        if (params.estimatedHours !== undefined) insertData.estimatedHours = params.estimatedHours.toString();
        if (params.actualHours !== undefined) insertData.actualHours = params.actualHours.toString();
        if (params.orderIndex !== undefined) insertData.orderIndex = params.orderIndex;
        if (params.completedAt !== undefined) insertData.completedAt = new Date(params.completedAt);

        const result = await db.insert(tasks).values(insertData).returning();

        return {
          content: [{
            type: "text",
            text: `Task created successfully:\n${JSON.stringify(result[0], null, 2)}`,
          }],
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error upserting task: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
