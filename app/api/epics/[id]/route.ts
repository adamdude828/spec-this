import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db.select().from(epics).where(eq(epics.id, id));

    if (result.length === 0) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching epic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch epic' },
      { status: 500 }
    );
  }
}
