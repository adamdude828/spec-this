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
