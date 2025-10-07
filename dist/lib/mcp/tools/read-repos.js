import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, repositories } from "../../db/index.js";
const readReposSchema = z.object({
    id: z.string().uuid().optional().describe("Optional repository ID to fetch a specific repository"),
});
export const readReposTool = {
    name: "read_repos",
    description: "Read repositories from the database. Can fetch all repos or get a specific repo by ID.",
    schema: readReposSchema,
    handler: async (params) => {
        try {
            if (params.id) {
                // Fetch specific repository by ID
                const results = await db.select().from(repositories).where(eq(repositories.id, params.id));
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
            // Fetch all repositories
            const results = await db.select().from(repositories);
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
                        text: `Error reading repositories: ${error instanceof Error ? error.message : String(error)}`,
                    }],
            };
        }
    },
};
