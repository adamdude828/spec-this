import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { repositories, providers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { detectProviderFromUrl } from '@/lib/services/url-builder';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const repo = await db.query.repositories.findFirst({
      where: eq(repositories.id, id),
      with: {
        provider: true,
      },
    });

    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    return NextResponse.json(repo);
  } catch (error) {
    console.error('Error fetching repository:', error);
    return NextResponse.json({ error: 'Failed to fetch repository' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, localPath, repoUrl, providerId } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (localPath !== undefined) updateData.localPath = localPath;
    if (repoUrl !== undefined) {
      updateData.repoUrl = repoUrl;

      // Auto-detect provider if repoUrl changed but providerId not explicitly set
      if (providerId === undefined && repoUrl) {
        const detectedProviderCode = detectProviderFromUrl(repoUrl);
        if (detectedProviderCode) {
          const detectedProvider = await db.query.providers.findFirst({
            where: eq(providers.code, detectedProviderCode),
          });
          if (detectedProvider) {
            updateData.providerId = detectedProvider.id;
          }
        }
      }
    }
    if (providerId !== undefined) updateData.providerId = providerId;

    const [updatedRepo] = await db
      .update(repositories)
      .set(updateData)
      .where(eq(repositories.id, id))
      .returning();

    if (!updatedRepo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Fetch with provider details
    const repoWithProvider = await db.query.repositories.findFirst({
      where: eq(repositories.id, id),
      with: {
        provider: true,
      },
    });

    return NextResponse.json(repoWithProvider);
  } catch (error) {
    console.error('Error updating repository:', error);
    return NextResponse.json({ error: 'Failed to update repository' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deletedRepo] = await db
      .delete(repositories)
      .where(eq(repositories.id, id))
      .returning();

    if (!deletedRepo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repository:', error);
    return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
  }
}
