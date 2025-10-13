import { NextRequest, NextResponse } from "next/server";
import { buildSourceUrl } from "@/lib/services/url-builder";
import { db } from "@/lib/db";
import { epics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { PlannedChangeInfo } from "@/lib/types/planned-change-node";

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
    const { id: epicId } = await params;

    if (!epicId) {
      return NextResponse.json(
        { error: "Epic ID is required" },
        { status: 400 }
      );
    }

    // Fetch epic with repository and provider information
    const epic = await db.query.epics.findFirst({
      where: eq(epics.id, epicId),
      with: {
        repository: {
          with: {
            provider: true,
          },
        },
        stories: true,
      },
    });

    if (!epic) {
      return NextResponse.json(
        { error: "Epic not found" },
        { status: 404 }
      );
    }

    const repo = epic.repository;
    const repoId = repo.id;

    // Fetch all planned file changes for all stories in this epic
    const storyIds = epic.stories.map((s) => s.id);

    let allPlannedChanges: Array<{
      id: string;
      storyId: string;
      filePath: string;
      changeType: 'create' | 'modify' | 'delete';
      description: string | null;
      expectedChanges: string | null;
      status: 'planned' | 'in_progress' | 'completed' | 'failed';
      beforeSnapshot: string | null;
      afterSnapshot: string | null;
      story?: { title: string };
    }> = [];

    if (storyIds.length > 0) {
      allPlannedChanges = await db.query.plannedFileChanges.findMany({
        where: (plannedFileChanges, { inArray }) => inArray(plannedFileChanges.storyId, storyIds),
        with: {
          story: true,
        },
      });
    }

    // Group planned changes by file path
    const plannedChangesByFile = new Map<string, PlannedChangeInfo[]>();
    for (const change of allPlannedChanges) {
      const changeInfo: PlannedChangeInfo = {
        id: change.id,
        storyId: change.storyId,
        storyTitle: change.story?.title,
        changeType: change.changeType,
        status: change.status,
        description: change.description,
        expectedChanges: change.expectedChanges,
        beforeSnapshot: change.beforeSnapshot,
        afterSnapshot: change.afterSnapshot,
      };

      if (!plannedChangesByFile.has(change.filePath)) {
        plannedChangesByFile.set(change.filePath, []);
      }
      plannedChangesByFile.get(change.filePath)!.push(changeInfo);
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

      // Get planned changes for this file
      const plannedChanges = plannedChangesByFile.get(file.relativePath) || [];

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
          plannedChanges: plannedChanges.length > 0 ? plannedChanges : undefined,
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
    console.error("Error fetching epic graph data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch epic graph data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
