import { z } from "zod";
import { sql, and, arrayContains } from "drizzle-orm";
import { db, urls } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";
import { generateEmbedding } from "../../utils/embeddings.ts";

const searchUrlsSchema = z.object({
  query: z.string().optional().describe("Search query to find similar content using vector similarity"),
  tags: z.array(z.string()).optional().describe("Filter by tags (returns URLs that contain all specified tags)"),
  limit: z.number().min(1).max(100).optional().default(10).describe("Maximum number of results to return (default: 10, max: 100)"),
  similarityThreshold: z.number().min(0).max(1).optional().default(0.5).describe("Minimum cosine similarity score (0-1, default: 0.5)"),
});

export const searchUrlsTool: ToolDefinition = {
  name: "search_urls",
  description: "Search URLs in the knowledge base using vector similarity search and/or tag filtering. Requires OPENAI_API_KEY for similarity search. Returns URLs ranked by relevance.",
  schema: searchUrlsSchema,
  handler: async (params) => {
    try {
      let queryEmbedding: number[] | null = null;

      // Generate embedding for search query if provided
      if (params.query) {
        if (!process.env.OPENAI_API_KEY) {
          return {
            content: [{
              type: "text",
              text: "Error: OPENAI_API_KEY environment variable is not set. Please set it to use similarity search.",
            }],
          };
        }

        try {
          const embeddingResult = await generateEmbedding(params.query);
          queryEmbedding = embeddingResult.embedding;
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error generating query embedding: ${error instanceof Error ? error.message : String(error)}`,
            }],
          };
        }
      }

      // Build the query
      let whereConditions: any[] = [];

      // Add tag filtering if specified
      if (params.tags && params.tags.length > 0) {
        whereConditions.push(arrayContains(urls.tags, params.tags));
      }

      let results;

      if (queryEmbedding) {
        // Vector similarity search with optional tag filtering
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Use pgvector's <=> operator for cosine distance
        // Lower distance = higher similarity
        // We use 1 - cosine_distance to get cosine similarity
        results = await db
          .select({
            id: urls.id,
            url: urls.url,
            title: urls.title,
            content: urls.content,
            summary: urls.summary,
            tags: urls.tags,
            createdAt: urls.createdAt,
            updatedAt: urls.updatedAt,
            similarity: sql<number>`1 - (${urls.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
          })
          .from(urls)
          .where(whereClause)
          .orderBy(sql`${urls.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
          .limit(params.limit);

        // Filter by similarity threshold
        results = results.filter(r => r.similarity >= params.similarityThreshold);
      } else {
        // Tag-only filtering (no similarity search)
        if (whereConditions.length === 0) {
          return {
            content: [{
              type: "text",
              text: "Error: Please provide either a query for similarity search or tags for filtering.",
            }],
          };
        }

        results = await db
          .select({
            id: urls.id,
            url: urls.url,
            title: urls.title,
            content: urls.content,
            summary: urls.summary,
            tags: urls.tags,
            createdAt: urls.createdAt,
            updatedAt: urls.updatedAt,
            similarity: sql<number>`0`,
          })
          .from(urls)
          .where(and(...whereConditions))
          .limit(params.limit);
      }

      if (results.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No URLs found matching the search criteria.",
          }],
        };
      }

      // Format results (truncate content for readability)
      const formattedResults = results.map(result => ({
        id: result.id,
        url: result.url,
        title: result.title,
        summary: result.summary,
        tags: result.tags,
        similarity: queryEmbedding ? result.similarity.toFixed(3) : 'N/A',
        contentPreview: result.content ? result.content.substring(0, 200) + '...' : null,
        createdAt: result.createdAt,
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
          text: `Error searching URLs: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
