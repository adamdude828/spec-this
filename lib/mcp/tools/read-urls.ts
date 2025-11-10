import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, urls } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const readUrlsSchema = z.object({
  id: z.string().uuid().optional().describe("Optional URL ID to fetch a specific URL"),
  includeContent: z.boolean().optional().default(false).describe("Whether to include full content in response (default: false)"),
});

export const readUrlsTool: ToolDefinition = {
  name: "read_urls",
  description: "Read URLs from the knowledge base. Can fetch all URLs or get a specific URL by ID. Use search_urls for filtered/similarity searches.",
  schema: readUrlsSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Fetch specific URL by ID
        const results = await db.select().from(urls).where(eq(urls.id, params.id));

        if (results.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No URL found with ID: ${params.id}`,
            }],
          };
        }

        // Remove embedding from response (too large) and optionally remove content
        const { embedding: _, content, ...urlData } = results[0];

        const result = {
          ...urlData,
          ...(params.includeContent ? { content } : { contentPreview: content ? content.substring(0, 200) + '...' : null }),
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      // Fetch all URLs
      const results = await db.select().from(urls);

      if (results.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No URLs found in the knowledge base.",
          }],
        };
      }

      // Remove embedding and optionally content from response
      const formattedResults = results.map(({ embedding: _, content, ...urlData }) => ({
        ...urlData,
        ...(params.includeContent ? { content } : { contentPreview: content ? content.substring(0, 200) + '...' : null }),
      }));

      return {
        content: [{
          type: "text",
          text: `Found ${results.length} URLs:\n\n${JSON.stringify(formattedResults, null, 2)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error reading URLs: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
