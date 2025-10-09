import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { repositories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Force dynamic rendering - don't prerender during build/start
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoId } = body;

    if (!repoId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Fetch repository from database
    const [repo] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, repoId))
      .limit(1);

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Dynamically import to avoid Turbopack build issues
    const { indexRepository } = await import("@/lib/parser");

    // Start indexing the repository
    const result = await indexRepository(repo.id, repo.localPath);

    return NextResponse.json({
      success: true,
      stats: result,
      message: `Indexed ${result.filesProcessed} files with ${result.dependenciesFound} dependencies`,
    });
  } catch (error) {
    console.error("Error indexing repository:", error);
    return NextResponse.json(
      {
        error: "Failed to index repository",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
