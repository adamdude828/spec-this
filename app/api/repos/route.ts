import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { repositories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    const { name, localPath, repoUrl } = body;

    if (!name || !localPath) {
      return NextResponse.json({ error: 'Name and localPath are required' }, { status: 400 });
    }

    const [newRepo] = await db.insert(repositories).values({
      name,
      localPath,
      repoUrl: repoUrl || null,
    }).returning();

    return NextResponse.json(newRepo, { status: 201 });
  } catch (error) {
    console.error('Error creating repository:', error);
    return NextResponse.json({ error: 'Failed to create repository' }, { status: 500 });
  }
}
