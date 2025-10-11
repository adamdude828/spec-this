import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';

export async function GET() {
  try {
    const allProviders = await db.select().from(providers).orderBy(providers.name);
    return NextResponse.json(allProviders);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
