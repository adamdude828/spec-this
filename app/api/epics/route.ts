import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let result;
    if (status) {
      result = await db.select().from(epics).where(eq(epics.status, status));
    } else {
      result = await db.select().from(epics);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching epics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch epics' },
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
        { error: 'Epic ID is required' },
        { status: 400 }
      );
    }

    const result = await db
      .update(epics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(epics.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error updating epic:', error);
    return NextResponse.json(
      { error: 'Failed to update epic' },
      { status: 500 }
    );
  }
}
