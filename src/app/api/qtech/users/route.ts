import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const users = await db<{ id: string; name: string; title: string | null }[]>`
      SELECT 
        id::text,
        COALESCE(name_ar, name_en, email::text, id::text) AS name,
        title_ar AS title
      FROM users
      WHERE is_active = true
      ORDER BY COALESCE(name_ar, name_en, email::text)
      LIMIT 100
    `;

    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message, users: [] }, { status: 500 });
  }
}
