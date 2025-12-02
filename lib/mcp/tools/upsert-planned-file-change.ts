import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, plannedFileChanges } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const upsertPlannedFileChangeSchema = z.object({
  id: z.string().uuid().optional().describe("Planned file change ID for update, omit for insert"),
  storyId: z.string().uuid().optional().describe("Story ID this planned file change belongs to (mutually exclusive with quickTaskId)"),
  quickTaskId: z.string().uuid().optional().describe("Quick task ID this planned file change belongs to (mutually exclusive with storyId)"),
  filePath: z.string().min(1).describe("Relative path from repo root to the file"),
  changeType: z.enum(['create', 'modify', 'delete']).describe("Type of change being made"),
  description: z.string().optional().describe("What changes are being made and why"),
  expectedChanges: z.string().optional().describe("Code snippets, detailed changes expected"),
  status: z.enum(['planned', 'in_progress', 'completed', 'failed']).optional().describe("Status of the file change"),
  beforeSnapshot: z.string().optional().describe("File content before change"),
  afterSnapshot: z.string().optional().describe("Expected/actual content after change"),
  orderIndex: z.number().int().optional().describe("Order within story or quick task"),
  completedAt: z.string().datetime().optional().describe("Completion timestamp (ISO 8601)"),
}).refine(
  (data) => {
    // For new inserts (no id), require either storyId or quickTaskId but not both
    if (!data.id) {
      return (data.storyId && !data.quickTaskId) || (!data.storyId && data.quickTaskId);
    }
    // For updates, allow either or neither (can update other fields)
    return true;
  },
  {
    message: "Must provide either storyId or quickTaskId (but not both) when creating a new planned file change",
  }
);

export const upsertPlannedFileChangeTool: ToolDefinition = {
  name: "upsert_planned_file_change",
  description: "Create a new planned file change or update an existing one. Provide an ID to update, omit ID to create new. Must specify either storyId or quickTaskId (but not both) for new changes.",
  schema: upsertPlannedFileChangeSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Update existing planned file change
        const updateData: Partial<typeof plannedFileChanges.$inferInsert> = {
          updatedAt: new Date(),
        };

        if (params.storyId !== undefined) updateData.storyId = params.storyId;
        if (params.quickTaskId !== undefined) updateData.quickTaskId = params.quickTaskId;
        if (params.filePath !== undefined) updateData.filePath = params.filePath;
        if (params.changeType !== undefined) updateData.changeType = params.changeType;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.expectedChanges !== undefined) updateData.expectedChanges = params.expectedChanges;
        if (params.status !== undefined) updateData.status = params.status;
        if (params.beforeSnapshot !== undefined) updateData.beforeSnapshot = params.beforeSnapshot;
        if (params.afterSnapshot !== undefined) updateData.afterSnapshot = params.afterSnapshot;
        if (params.orderIndex !== undefined) updateData.orderIndex = params.orderIndex;
        if (params.completedAt !== undefined) updateData.completedAt = new Date(params.completedAt);

        const result = await db
          .update(plannedFileChanges)
          .set(updateData)
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
            text: `Planned file change updated successfully:\n${JSON.stringify(result[0], null, 2)}`,
          }],
        };
      } else {
        // Insert new planned file change
        const insertData: typeof plannedFileChanges.$inferInsert = {
          filePath: params.filePath,
          changeType: params.changeType,
        };

        // Set either storyId or quickTaskId (validation ensures one is provided)
        if (params.storyId !== undefined) insertData.storyId = params.storyId;
        if (params.quickTaskId !== undefined) insertData.quickTaskId = params.quickTaskId;

        if (params.description !== undefined) insertData.description = params.description;
        if (params.expectedChanges !== undefined) insertData.expectedChanges = params.expectedChanges;
        if (params.status !== undefined) insertData.status = params.status;
        if (params.beforeSnapshot !== undefined) insertData.beforeSnapshot = params.beforeSnapshot;
        if (params.afterSnapshot !== undefined) insertData.afterSnapshot = params.afterSnapshot;
        if (params.orderIndex !== undefined) insertData.orderIndex = params.orderIndex;
        if (params.completedAt !== undefined) insertData.completedAt = new Date(params.completedAt);

        const result = await db.insert(plannedFileChanges).values(insertData).returning();

        return {
          content: [{
            type: "text",
            text: `Planned file change created successfully:\n${JSON.stringify(result[0], null, 2)}`,
          }],
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error upserting planned file change: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
