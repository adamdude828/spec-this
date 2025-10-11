import { NextRequest, NextResponse } from "next/server";
import { buildSourceUrl } from "@/lib/services/url-builder";
import { db } from "@/lib/db";
import { repositories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper to get file extension
function getFileExtension(filePath: string): string {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: repoId } = await params;

    if (!repoId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Fetch repository with provider information
    const repo = await db.query.repositories.findFirst({
      where: eq(repositories.id, repoId),
      with: {
        provider: true,
      },
    });

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Dynamically import to avoid build issues
    const { neo4j, runReadTransaction } = await import("@/lib/db/neo4j");

    // Ensure Neo4j is connected
    if (!neo4j.isConnected()) {
      await neo4j.connect();
    }

    // Query all files and dependencies for the repository
    const filesResult = await runReadTransaction<{
      filePath: string;
      relativePath: string;
      language: string;
      extension: string;
    }>(
      `MATCH (f:File {repoId: $repoId})
       RETURN f.filePath as filePath,
              f.relativePath as relativePath,
              f.language as language,
              f.extension as extension
       LIMIT 500`,
      { repoId }
    );

    const dependenciesResult = await runReadTransaction<{
      from: string;
      to: string;
      importType: string;
    }>(
      `MATCH (from:File {repoId: $repoId})-[r:DEPENDS_ON]->(to:File {repoId: $repoId})
       RETURN from.filePath as from,
              to.filePath as to,
              r.importType as importType
       LIMIT 1000`,
      { repoId }
    );

    // Transform to React Flow format
    const nodes = filesResult.map((file) => {
      const extension = file.extension || getFileExtension(file.filePath);

      // Build source URL if provider is available
      let sourceUrl: string | null = null;
      if (repo.repoUrl && repo.provider) {
        sourceUrl = buildSourceUrl({
          repository: {
            repoUrl: repo.repoUrl,
            provider: repo.provider,
          },
          filePath: file.relativePath,
        });
      }

      return {
        id: file.filePath,
        type: 'fileNode',
        position: { x: 0, y: 0 }, // Will be laid out by algorithm
        data: {
          label: file.relativePath,
          language: file.language,
          extension: extension,
          filePath: file.filePath,
          sourceUrl: sourceUrl,
        },
      };
    });

    const edges = dependenciesResult.map((dep) => ({
      id: `${dep.from}-${dep.to}`,
      source: dep.from,
      target: dep.to,
      type: 'smoothstep',
      animated: false,
      data: {
        importType: dep.importType,
      },
    }));

    return NextResponse.json({
      nodes,
      edges,
    });
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch graph data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
