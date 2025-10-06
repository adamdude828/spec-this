import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storyId = searchParams.get('storyId');
    const status = searchParams.get('status');

    let result;
    if (storyId && status) {
      result = await db
        .select()
        .from(tasks)
        .where(eq(tasks.storyId, storyId))
        .where(eq(tasks.status, status));
    } else if (storyId) {
      result = await db.select().from(tasks).where(eq(tasks.storyId, storyId));
    } else if (status) {
      result = await db.select().from(tasks).where(eq(tasks.status, status));
    } else {
      result = await db.select().from(tasks);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
