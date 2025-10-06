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
