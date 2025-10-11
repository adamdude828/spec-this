/* eslint-disable no-console */
import { runWriteTransaction, runReadTransaction } from "../db/neo4j.ts";
import type { FileNode, DependencyEdge } from "./types.ts";
import type { IndexResult } from "./file-indexer.ts";

/**
 * Store and manage file dependency graphs in Neo4j
 */
export class Neo4jGraphStore {
  /**
   * Initialize Neo4j schema - create constraints and indexes
   */
  async initializeSchema(): Promise<void> {
    console.log("🔧 Initializing Neo4j schema...");

    // Create unique constraint on File.filePath
    await runWriteTransaction(
      `CREATE CONSTRAINT file_path_unique IF NOT EXISTS
       FOR (f:File) REQUIRE f.filePath IS UNIQUE`
    );

    // Create index on File.repoId for faster queries
    await runWriteTransaction(
      `CREATE INDEX file_repo_id IF NOT EXISTS
       FOR (f:File) ON (f.repoId)`
    );

    // Create index on File.language
    await runWriteTransaction(
      `CREATE INDEX file_language IF NOT EXISTS
       FOR (f:File) ON (f.language)`
    );

    console.log("✅ Neo4j schema initialized");
  }

  /**
   * Clear all files and dependencies for a specific repository
   */
  async clearRepositoryGraph(repoId: string): Promise<void> {
    console.log(`🗑️  Clearing existing graph for repository ${repoId}...`);

    await runWriteTransaction(
      `MATCH (f:File {repoId: $repoId})
       DETACH DELETE f`,
      { repoId }
    );

    console.log("✅ Repository graph cleared");
  }

  /**
   * Store an entire index result (files + dependencies) in Neo4j
   */
  async storeIndexResult(result: IndexResult): Promise<void> {
    console.log(
      `💾 Storing ${result.files.length} files and ${result.dependencies.length} dependencies...`
    );

    // Store files in batches
    await this.storeFiles(result.files);

    // Store dependencies in batches
    await this.storeDependencies(result.dependencies);

    console.log("✅ Graph data stored successfully");
  }

  /**
   * Store file nodes in Neo4j (batch operation)
   */
  private async storeFiles(files: FileNode[]): Promise<void> {
    const batchSize = 100;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      await runWriteTransaction(
        `UNWIND $files AS file
         MERGE (f:File {filePath: file.filePath})
         SET f.repoId = file.repoId,
             f.language = file.language,
             f.extension = file.extension,
             f.relativePath = file.relativePath,
             f.updatedAt = datetime()`,
        { files: batch }
      );

      console.log(`  Stored ${Math.min(i + batchSize, files.length)}/${files.length} files`);
    }
  }

  /**
   * Store dependency edges in Neo4j (batch operation)
   */
  private async storeDependencies(dependencies: DependencyEdge[]): Promise<void> {
    const batchSize = 100;

    for (let i = 0; i < dependencies.length; i += batchSize) {
      const batch = dependencies.slice(i, i + batchSize);

      await runWriteTransaction(
        `UNWIND $deps AS dep
         MATCH (from:File {filePath: dep.from})
         MATCH (to:File {filePath: dep.to})
         MERGE (from)-[r:DEPENDS_ON]->(to)
         SET r.importType = dep.importType,
             r.lineNumber = dep.lineNumber`,
        { deps: batch }
      );

      console.log(
        `  Stored ${Math.min(i + batchSize, dependencies.length)}/${dependencies.length} dependencies`
      );
    }
  }

  /**
   * Get graph statistics for a repository
   */
  async getRepositoryStats(repoId: string): Promise<{
    fileCount: number;
    dependencyCount: number;
    languageBreakdown: Record<string, number>;
  }> {
    const [fileCountResult] = await runReadTransaction<{ count: number }>(
      `MATCH (f:File {repoId: $repoId})
       RETURN count(f) as count`,
      { repoId }
    );

    const [depCountResult] = await runReadTransaction<{ count: number }>(
      `MATCH (from:File {repoId: $repoId})-[r:DEPENDS_ON]->(to:File)
       RETURN count(r) as count`,
      { repoId }
    );

    const languageResults = await runReadTransaction<{
      language: string;
      count: number;
    }>(
      `MATCH (f:File {repoId: $repoId})
       RETURN f.language as language, count(f) as count
       ORDER BY count DESC`,
      { repoId }
    );

    const languageBreakdown: Record<string, number> = {};
    for (const result of languageResults) {
      languageBreakdown[result.language] = result.count;
    }

    return {
      fileCount: fileCountResult?.count || 0,
      dependencyCount: depCountResult?.count || 0,
      languageBreakdown,
    };
  }

  /**
   * Find files with most dependencies (highest out-degree)
   */
  async getMostDependentFiles(
    repoId: string,
    limit: number = 10
  ): Promise<Array<{ filePath: string; relativePath: string; count: number }>> {
    return runReadTransaction<{
      filePath: string;
      relativePath: string;
      count: number;
    }>(
      `MATCH (f:File {repoId: $repoId})-[r:DEPENDS_ON]->()
       RETURN f.filePath as filePath,
              f.relativePath as relativePath,
              count(r) as count
       ORDER BY count DESC
       LIMIT toInteger($limit)`,
      { repoId, limit }
    );
  }

  /**
   * Find most imported files (highest in-degree)
   */
  async getMostImportedFiles(
    repoId: string,
    limit: number = 10
  ): Promise<Array<{ filePath: string; relativePath: string; count: number }>> {
    return runReadTransaction<{
      filePath: string;
      relativePath: string;
      count: number;
    }>(
      `MATCH (f:File {repoId: $repoId})<-[r:DEPENDS_ON]-()
       RETURN f.filePath as filePath,
              f.relativePath as relativePath,
              count(r) as count
       ORDER BY count DESC
       LIMIT toInteger($limit)`,
      { repoId, limit }
    );
  }

  /**
   * Find circular dependencies
   */
  async findCircularDependencies(
    repoId: string
  ): Promise<Array<{ cycle: string[] }>> {
    // Find cycles of length 2-5
    return runReadTransaction<{ cycle: string[] }>(
      `MATCH path = (f1:File {repoId: $repoId})-[:DEPENDS_ON*2..5]->(f1)
       WHERE ALL(f IN nodes(path) WHERE f.repoId = $repoId)
       RETURN [f IN nodes(path) | f.relativePath] as cycle
       LIMIT 20`,
      { repoId }
    );
  }

  /**
   * Find orphaned files (no dependencies in or out)
   */
  async findOrphanedFiles(
    repoId: string
  ): Promise<Array<{ filePath: string; relativePath: string }>> {
    return runReadTransaction<{ filePath: string; relativePath: string }>(
      `MATCH (f:File {repoId: $repoId})
       WHERE NOT (f)-[:DEPENDS_ON]-() AND NOT ()-[:DEPENDS_ON]->(f)
       RETURN f.filePath as filePath, f.relativePath as relativePath`,
      { repoId }
    );
  }

  /**
   * Get all dependencies for a specific file
   */
  async getFileDependencies(
    filePath: string
  ): Promise<Array<{ to: string; importType: string; lineNumber?: number }>> {
    return runReadTransaction<{
      to: string;
      importType: string;
      lineNumber?: number;
    }>(
      `MATCH (f:File {filePath: $filePath})-[r:DEPENDS_ON]->(to:File)
       RETURN to.relativePath as to, r.importType as importType, r.lineNumber as lineNumber`,
      { filePath }
    );
  }

  /**
   * Get all dependents of a specific file (who imports this file)
   */
  async getFileDependents(
    filePath: string
  ): Promise<Array<{ from: string; importType: string; lineNumber?: number }>> {
    return runReadTransaction<{
      from: string;
      importType: string;
      lineNumber?: number;
    }>(
      `MATCH (from:File)-[r:DEPENDS_ON]->(f:File {filePath: $filePath})
       RETURN from.relativePath as from, r.importType as importType, r.lineNumber as lineNumber`,
      { filePath }
    );
  }

  /**
   * Find transitive dependencies (all files that depend on this file, directly or indirectly)
   */
  async getTransitiveDependencies(
    filePath: string,
    maxDepth: number = 5
  ): Promise<Array<{ path: string[]; depth: number }>> {
    return runReadTransaction<{ path: string[]; depth: number }>(
      `MATCH path = (f:File {filePath: $filePath})-[:DEPENDS_ON*1..$maxDepth]->(dep:File)
       RETURN [node IN nodes(path) | node.relativePath] as path,
              length(path) as depth
       ORDER BY depth`,
      { filePath, maxDepth }
    );
  }
}

// Export singleton instance
export const neo4jGraphStore = new Neo4jGraphStore();
