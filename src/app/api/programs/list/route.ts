import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const rows = await db`
    SELECT 
      p.id, p.title_ar, p.code, p.provider,
      p.start_date, p.end_date, p.capacity, p.enrolled_count,
      p.status, p.kind,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id) AS attendees
    FROM ecosystem_programs p
    ORDER BY 
      CASE p.status 
        WHEN 'execution' THEN 1
        WHEN 'registration' THEN 2
        WHEN 'development' THEN 3
        WHEN 'review' THEN 4
        WHEN 'ideation' THEN 5
        WHEN 'closed' THEN 6
        ELSE 7
      END,
      p.start_date DESC NULLS LAST,
      p.id DESC
    LIMIT 300
  `;

  return NextResponse.json({ ok: true, programs: rows });
}
