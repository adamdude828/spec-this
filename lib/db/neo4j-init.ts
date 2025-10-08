import { neo4j as neo4jConnection, runWriteTransaction } from "./neo4j.js";

/**
 * Initialize Neo4j database with constraints and indexes
 * Run this once after setting up Neo4j for the first time
 */
export async function initializeNeo4jSchema(): Promise<void> {
  console.log("🔧 Initializing Neo4j schema...");

  try {
    await neo4jConnection.connect();

    // Create uniqueness constraint on File.filePath
    // This ensures each file path is unique per repository
    await runWriteTransaction(`
      CREATE CONSTRAINT file_path_unique IF NOT EXISTS
      FOR (f:File)
      REQUIRE (f.repoId, f.filePath) IS UNIQUE
    `);
    console.log("✅ Created uniqueness constraint on File.filePath");

    // Create index on repoId for faster repository-specific queries
    await runWriteTransaction(`
      CREATE INDEX file_repo_id IF NOT EXISTS
      FOR (f:File)
      ON (f.repoId)
    `);
    console.log("✅ Created index on File.repoId");

    // Create index on language for filtering by language type
    await runWriteTransaction(`
      CREATE INDEX file_language IF NOT EXISTS
      FOR (f:File)
      ON (f.language)
    `);
    console.log("✅ Created index on File.language");

    // Create index on DEPENDS_ON relationship for faster traversal
    await runWriteTransaction(`
      CREATE INDEX depends_on_type IF NOT EXISTS
      FOR ()-[r:DEPENDS_ON]-()
      ON (r.importType)
    `);
    console.log("✅ Created index on DEPENDS_ON.importType");

    console.log("🎉 Neo4j schema initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Neo4j schema:", error);
    throw error;
  }
}

/**
 * Clear all File nodes and DEPENDS_ON relationships for a specific repository
 * Useful for re-indexing a repository
 */
export async function clearRepositoryGraph(repoId: string): Promise<void> {
  console.log(`🗑️  Clearing graph data for repository ${repoId}...`);

  try {
    const result = await runWriteTransaction(
      `
      MATCH (f:File {repoId: $repoId})
      DETACH DELETE f
      RETURN count(f) as deletedCount
    `,
      { repoId }
    );

    const deletedCount = result[0]?.deletedCount || 0;
    console.log(`✅ Deleted ${deletedCount} file nodes for repository ${repoId}`);
  } catch (error) {
    console.error("❌ Failed to clear repository graph:", error);
    throw error;
  }
}

/**
 * Get statistics about the Neo4j graph
 */
export async function getGraphStats(): Promise<{
  totalFiles: number;
  totalDependencies: number;
  filesByLanguage: Record<string, number>;
}> {
  const session = neo4jConnection.getSession();

  try {
    // Count total files
    const fileCountResult = await session.run(`
      MATCH (f:File)
      RETURN count(f) as total
    `);
    const totalFiles = fileCountResult.records[0]?.get("total").toNumber() || 0;

    // Count total dependencies
    const depCountResult = await session.run(`
      MATCH ()-[r:DEPENDS_ON]->()
      RETURN count(r) as total
    `);
    const totalDependencies =
      depCountResult.records[0]?.get("total").toNumber() || 0;

    // Count files by language
    const langResult = await session.run(`
      MATCH (f:File)
      WHERE f.language IS NOT NULL
      RETURN f.language as language, count(f) as count
      ORDER BY count DESC
    `);

    const filesByLanguage: Record<string, number> = {};
    langResult.records.forEach((record: any) => {
      const language = record.get("language");
      const count = record.get("count").toNumber();
      filesByLanguage[language] = count;
    });

    return {
      totalFiles,
      totalDependencies,
      filesByLanguage,
    };
  } finally {
    await session.close();
  }
}

// CLI execution support
if (require.main === module) {
  initializeNeo4jSchema()
    .then(() => {
      console.log("✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}
