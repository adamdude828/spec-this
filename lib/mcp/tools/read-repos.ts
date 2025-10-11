import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, repositories, providers } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

const readReposSchema = z.object({
  id: z.string().uuid().optional().describe("Optional repository ID to fetch a specific repository"),
});

export const readReposTool: ToolDefinition = {
  name: "read_repos",
  description: "Read repositories from the database. Can fetch all repos or get a specific repo by ID.",
  schema: readReposSchema,
  handler: async (params) => {
    try {
      if (params.id) {
        // Fetch specific repository by ID with provider details
        const results = await db
          .select({
            id: repositories.id,
            name: repositories.name,
            localPath: repositories.localPath,
            repoUrl: repositories.repoUrl,
            providerId: repositories.providerId,
            createdAt: repositories.createdAt,
            updatedAt: repositories.updatedAt,
            provider: {
              id: providers.id,
              name: providers.name,
              code: providers.code,
              baseUrlPattern: providers.baseUrlPattern,
              fileUrlPattern: providers.fileUrlPattern,
              lineUrlPattern: providers.lineUrlPattern,
            },
          })
          .from(repositories)
          .leftJoin(providers, eq(repositories.providerId, providers.id))
          .where(eq(repositories.id, params.id));

        if (results.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No repository found with ID: ${params.id}`,
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

      // Fetch all repositories with provider details
      const results = await db
        .select({
          id: repositories.id,
          name: repositories.name,
          localPath: repositories.localPath,
          repoUrl: repositories.repoUrl,
          providerId: repositories.providerId,
          createdAt: repositories.createdAt,
          updatedAt: repositories.updatedAt,
          provider: {
            id: providers.id,
            name: providers.name,
            code: providers.code,
            baseUrlPattern: providers.baseUrlPattern,
            fileUrlPattern: providers.fileUrlPattern,
            lineUrlPattern: providers.lineUrlPattern,
          },
        })
        .from(repositories)
        .leftJoin(providers, eq(repositories.providerId, providers.id));

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
          text: `Error reading repositories: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
