import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ theme: 'dark' }, { status: 200 });

  const rows = await db<{ theme: string; locale: string; density: string }[]>`
    SELECT theme, locale, density FROM user_preferences WHERE user_id = ${session.userId}
  `;
  if (rows.length === 0) return NextResponse.json({ theme: 'dark', locale: 'ar', density: 'comfortable' });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { theme, locale, density } = body;

  // upsert
  await db`
    INSERT INTO user_preferences (user_id, theme, locale, density, updated_at)
    VALUES (${session.userId}, ${theme || 'dark'}, ${locale || 'ar'}, ${density || 'comfortable'}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      theme = COALESCE(${theme}, user_preferences.theme),
      locale = COALESCE(${locale}, user_preferences.locale),
      density = COALESCE(${density}, user_preferences.density),
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
