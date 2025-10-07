import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';

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
        .where(and(
          eq(tasks.storyId, storyId),
          eq(tasks.status, status as TaskStatus)
        ));
    } else if (storyId) {
      result = await db.select().from(tasks).where(eq(tasks.storyId, storyId));
    } else if (status) {
      result = await db.select().from(tasks).where(eq(tasks.status, status as TaskStatus));
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // If status is being changed to 'completed', set completedAt
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const result = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
