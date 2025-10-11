import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering - don't prerender during build/start
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Type for Neo4j integer objects
interface Neo4jInteger {
  low: number;
  high: number;
}

// Helper to convert Neo4j integers to JavaScript numbers
function toNumber(value: number | Neo4jInteger | unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "low" in value) {
    return (value as Neo4jInteger).low;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId");

    if (!repoId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Dynamically import to avoid Turbopack build issues
    const { neo4jGraphStore } = await import("@/lib/parser/neo4j-graph-store");
    const { neo4j } = await import("@/lib/db/neo4j");

    // Ensure Neo4j is connected
    if (!neo4j.isConnected()) {
      await neo4j.connect();
    }

    // Fetch all statistics in parallel
    const [
      basicStats,
      mostImported,
      mostDependencies,
      circularDeps,
      orphanedFiles,
    ] = await Promise.all([
      neo4jGraphStore.getRepositoryStats(repoId),
      neo4jGraphStore.getMostImportedFiles(repoId, 10),
      neo4jGraphStore.getMostDependentFiles(repoId, 10),
      neo4jGraphStore.findCircularDependencies(repoId),
      neo4jGraphStore.findOrphanedFiles(repoId),
    ]);

    // Convert Neo4j integers to regular numbers
    const normalizedStats = {
      basicStats: {
        fileCount: toNumber(basicStats.fileCount),
        dependencyCount: toNumber(basicStats.dependencyCount),
        languageBreakdown: Object.fromEntries(
          Object.entries(basicStats.languageBreakdown).map(([key, value]) => [
            key,
            toNumber(value),
          ])
        ),
      },
      mostImported: mostImported.map((item) => ({
        relativePath: item.relativePath,
        count: toNumber(item.count),
      })),
      mostDependencies: mostDependencies.map((item) => ({
        relativePath: item.relativePath,
        count: toNumber(item.count),
      })),
      circularDeps: circularDeps,
      orphanedFiles: orphanedFiles,
    };

    return NextResponse.json(normalizedStats);
  } catch (error) {
    console.error("Error fetching graph statistics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch graph statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
