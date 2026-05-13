import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year') || new Date().getFullYear());
  const month = Number(searchParams.get('month') || new Date().getMonth());

  const startMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const nextMonth = month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`;

  const programs = await db`
    SELECT id, code, title_ar, provider, start_date, end_date, program_type, status, capacity, enrolled_count
    FROM ecosystem_programs
    WHERE start_date IS NOT NULL
      AND start_date < ${nextMonth}::date
      AND COALESCE(end_date, start_date) >= ${startMonth}::date
    ORDER BY start_date ASC LIMIT 200
  `;

  return NextResponse.json({ ok: true, year, month, programs });
}
