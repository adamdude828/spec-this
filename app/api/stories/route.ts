import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const epicId = searchParams.get('epicId');
    const status = searchParams.get('status');

    let result;
    if (epicId && status) {
      result = await db
        .select()
        .from(stories)
        .where(eq(stories.epicId, epicId))
        .where(eq(stories.status, status));
    } else if (epicId) {
      result = await db.select().from(stories).where(eq(stories.epicId, epicId));
    } else if (status) {
      result = await db.select().from(stories).where(eq(stories.status, status));
    } else {
      result = await db.select().from(stories);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    const result = await db
      .update(stories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stories.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { error: 'Failed to update story' },
      { status: 500 }
    );
  }
}
