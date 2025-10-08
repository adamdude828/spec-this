/**
 * File parser and dependency analyzer
 *
 * This module provides functionality to:
 * - Parse TypeScript/JavaScript files using tree-sitter
 * - Extract import/export statements
 * - Resolve dependencies between files
 * - Build and store file dependency graphs in Neo4j
 */

export * from "./types";
export * from "./typescript-parser";
export * from "./dependency-resolver";
export * from "./file-indexer";
export * from "./neo4j-graph-store";

import { FileIndexer } from "./file-indexer";
import { neo4jGraphStore } from "./neo4j-graph-store";
import { neo4j } from "../db/neo4j";

/**
 * Index a repository and store its dependency graph in Neo4j
 *
 * @param repoId - Repository ID
 * @param repoRoot - Absolute path to repository root
 * @returns Index result with files, dependencies, and stats
 *
 * @example
 * ```typescript
 * const result = await indexRepository('repo-123', '/path/to/repo');
 * console.log(`Indexed ${result.stats.filesProcessed} files`);
 * console.log(`Found ${result.stats.dependenciesFound} dependencies`);
 * ```
 */
export async function indexRepository(
  repoId: string,
  repoRoot: string
): Promise<{
  filesProcessed: number;
  dependenciesFound: number;
  errors: string[];
}> {
  console.log(`🚀 Starting repository indexing for ${repoRoot}`);

  // Ensure Neo4j is connected
  if (!neo4j.isConnected()) {
    await neo4j.connect();
  }

  // Initialize Neo4j schema if needed
  await neo4jGraphStore.initializeSchema();

  // Clear existing graph data for this repository
  await neo4jGraphStore.clearRepositoryGraph(repoId);

  // Create file indexer with auto-loaded tsconfig
  const indexer = await FileIndexer.create({ repoId, repoRoot });

  // Index the repository
  const result = await indexer.indexRepository();

  // Store in Neo4j
  await neo4jGraphStore.storeIndexResult(result);

  console.log("✅ Repository indexing complete!");
  return result.stats;
}
