import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quickTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type QuickTaskStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const repoId = searchParams.get('repoId');

    let result;
    if (status && repoId) {
      result = await db.select().from(quickTasks)
        .where(eq(quickTasks.status, status as QuickTaskStatus))
        .where(eq(quickTasks.repoId, repoId));
    } else if (status) {
      result = await db.select().from(quickTasks)
        .where(eq(quickTasks.status, status as QuickTaskStatus));
    } else if (repoId) {
      result = await db.select().from(quickTasks)
        .where(eq(quickTasks.repoId, repoId));
    } else {
      result = await db.select().from(quickTasks);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching quick tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoId, title, description, status, priority } = body;

    if (!repoId || !title) {
      return NextResponse.json(
        { error: 'Repository ID and title are required' },
        { status: 400 }
      );
    }

    const result = await db.insert(quickTasks).values({
      repoId,
      title,
      description,
      status: status || 'planned',
      priority: priority || 'medium',
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating quick task:', error);
    return NextResponse.json(
      { error: 'Failed to create quick task' },
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
        { error: 'Quick task ID is required' },
        { status: 400 }
      );
    }

    // Set completedAt if status is being changed to completed
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const result = await db
      .update(quickTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quickTasks.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Quick task not found' }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error updating quick task:', error);
    return NextResponse.json(
      { error: 'Failed to update quick task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Quick task ID is required' },
        { status: 400 }
      );
    }

    const result = await db
      .delete(quickTasks)
      .where(eq(quickTasks.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Quick task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting quick task:', error);
    return NextResponse.json(
      { error: 'Failed to delete quick task' },
      { status: 500 }
    );
  }
}
