import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, urls } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";
import { fetchUrlContent, truncateContent } from "../../utils/url-fetcher.ts";
import { generateEmbedding } from "../../utils/embeddings.ts";

const upsertUrlSchema = z.object({
  id: z.string().uuid().optional().describe("URL ID for update, omit for insert"),
  url: z.string().url().describe("The URL to add to the knowledge base"),
  tags: z.array(z.string()).optional().describe("Optional tags for categorizing the URL"),
  summary: z.string().optional().describe("Optional summary of the content (if not provided, will be auto-generated from content)"),
  fetchContent: z.boolean().optional().default(true).describe("Whether to fetch and process content from the URL (default: true)"),
});

export const upsertUrlTool: ToolDefinition = {
  name: "upsert_url",
  description: "Add a new URL to the knowledge base or update an existing one. Automatically fetches content, generates embeddings using OpenAI, and stores with tags for search. Requires OPENAI_API_KEY environment variable.",
  schema: upsertUrlSchema,
  handler: async (params) => {
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return {
          content: [{
            type: "text",
            text: "Error: OPENAI_API_KEY environment variable is not set. Please set it to use this feature.",
          }],
        };
      }

      let title: string | undefined;
      let content: string | undefined;
      let embedding: number[] | undefined;

      // Fetch content if requested
      if (params.fetchContent) {
        const fetchResult = await fetchUrlContent(params.url);

        if (!fetchResult.success) {
          return {
            content: [{
              type: "text",
              text: `Error fetching URL content: ${fetchResult.error}`,
            }],
          };
        }

        title = fetchResult.title;
        content = truncateContent(fetchResult.content, 8000);

        // Generate embedding from the content
        try {
          const embeddingResult = await generateEmbedding(content);
          embedding = embeddingResult.embedding;
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error generating embedding: ${error instanceof Error ? error.message : String(error)}`,
            }],
          };
        }
      }

      if (params.id) {
        // Update existing URL
        const updateData: Partial<typeof urls.$inferInsert> = {
          updatedAt: new Date(),
        };

        if (params.url !== undefined) updateData.url = params.url;
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (params.summary !== undefined) updateData.summary = params.summary;
        if (embedding !== undefined) updateData.embedding = embedding;
        if (params.tags !== undefined) updateData.tags = params.tags;

        const result = await db
          .update(urls)
          .set(updateData)
          .where(eq(urls.id, params.id))
          .returning();

        if (result.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No URL found with ID: ${params.id}`,
            }],
          };
        }

        // Return without embedding vector (too large)
        const { embedding: _, ...resultWithoutEmbedding } = result[0];

        return {
          content: [{
            type: "text",
            text: `URL updated successfully:\n${JSON.stringify(resultWithoutEmbedding, null, 2)}`,
          }],
        };
      } else {
        // Insert new URL
        const insertData: typeof urls.$inferInsert = {
          url: params.url,
          title,
          content,
          summary: params.summary,
          embedding,
          tags: params.tags || [],
        };

        const result = await db.insert(urls).values(insertData).returning();

        // Return without embedding vector (too large)
        const { embedding: _, ...resultWithoutEmbedding } = result[0];

        return {
          content: [{
            type: "text",
            text: `URL created successfully:\n${JSON.stringify(resultWithoutEmbedding, null, 2)}`,
          }],
        };
      }
    } catch (error) {
      // Check for unique constraint violation
      if (error instanceof Error && error.message.includes('unique constraint')) {
        return {
          content: [{
            type: "text",
            text: `Error: URL already exists in the knowledge base. Use the ID parameter to update it instead.`,
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `Error upserting URL: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
