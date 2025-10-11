import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { repositories, providers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { detectProviderFromUrl } from '@/lib/services/url-builder';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const repo = await db.query.repositories.findFirst({
        where: eq(repositories.id, id),
      });

      if (!repo) {
        return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
      }

      return NextResponse.json(repo);
    }

    const allRepos = await db.query.repositories.findMany({
      orderBy: (repos, { desc }) => [desc(repos.updatedAt)],
    });

    return NextResponse.json(allRepos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, localPath, repoUrl, providerId } = body;

    if (!name || !localPath) {
      return NextResponse.json({ error: 'Name and localPath are required' }, { status: 400 });
    }

    // Auto-detect provider if repoUrl is provided but no providerId
    let finalProviderId = providerId;
    if (repoUrl && !providerId) {
      const detectedProviderCode = detectProviderFromUrl(repoUrl);
      if (detectedProviderCode) {
        const detectedProvider = await db.query.providers.findFirst({
          where: eq(providers.code, detectedProviderCode),
        });
        if (detectedProvider) {
          finalProviderId = detectedProvider.id;
        }
      }
    }

    const [newRepo] = await db.insert(repositories).values({
      name,
      localPath,
      repoUrl: repoUrl || null,
      providerId: finalProviderId || null,
    }).returning();

    // Fetch with provider details
    const repoWithProvider = await db.query.repositories.findFirst({
      where: eq(repositories.id, newRepo.id),
      with: {
        provider: true,
      },
    });

    return NextResponse.json(repoWithProvider, { status: 201 });
  } catch (error) {
    console.error('Error creating repository:', error);
    return NextResponse.json({ error: 'Failed to create repository' }, { status: 500 });
  }
}
