import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, quickTasks } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const upsertQuickTaskSchema = z.object({
  id: z.string().uuid().optional().describe("Quick task ID for update, omit for insert"),
  repoId: z.string().uuid().describe("Repository ID this quick task belongs to"),
  title: z.string().min(1).describe("Quick task title"),
  description: z.string().optional().describe("Quick task description"),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional().describe("Quick task status"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe("Quick task priority"),
  orderIndex: z.number().int().optional().describe("Order within repository"),
});

export const upsertQuickTaskTool: ToolDefinition = {
  name: "upsert_quick_task",
  description: "Create a new quick task or update an existing one. Provide an ID to update, omit ID to create new. Quick tasks are lightweight tasks that belong directly to a repository and are designed for AI agents to quickly plan and execute small changes.",
  schema: upsertQuickTaskSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Update existing quick task
        const updateData: Partial<typeof quickTasks.$inferInsert> = {
          updatedAt: new Date(),
        };

        if (params.repoId !== undefined) updateData.repoId = params.repoId;
        if (params.title !== undefined) updateData.title = params.title;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.status !== undefined) {
          updateData.status = params.status;
          // Set completedAt when status changes to completed
          if (params.status === 'completed') {
            updateData.completedAt = new Date();
          }
        }
        if (params.priority !== undefined) updateData.priority = params.priority;
        if (params.orderIndex !== undefined) updateData.orderIndex = params.orderIndex;

        const result = await db
          .update(quickTasks)
          .set(updateData)
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
            text: `Quick task updated successfully:\n${JSON.stringify(result[0], null, 2)}`,
          }],
        };
      } else {
        // Insert new quick task
        const insertData: typeof quickTasks.$inferInsert = {
          repoId: params.repoId,
          title: params.title,
        };

        if (params.description !== undefined) insertData.description = params.description;
        if (params.status !== undefined) insertData.status = params.status;
        if (params.priority !== undefined) insertData.priority = params.priority;
        if (params.orderIndex !== undefined) insertData.orderIndex = params.orderIndex;

        const result = await db.insert(quickTasks).values(insertData).returning();

        return {
          content: [{
            type: "text",
            text: `Quick task created successfully:\n${JSON.stringify(result[0], null, 2)}`,
          }],
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error upserting quick task: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
