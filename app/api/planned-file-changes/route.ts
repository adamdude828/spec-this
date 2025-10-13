import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plannedFileChanges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
    }

    const changes = await db
      .select()
      .from(plannedFileChanges)
      .where(eq(plannedFileChanges.storyId, storyId))
      .orderBy(plannedFileChanges.orderIndex);

    return NextResponse.json(changes);
  } catch (error) {
    console.error('Error fetching planned file changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch planned file changes' },
      { status: 500 }
    );
  }
}
