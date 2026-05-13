import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 });

  const rows = await db`
    SELECT 
      p.id, p.title_ar, p.code, p.program_type, p.category, p.provider,
      p.start_date, p.end_date, p.capacity, p.enrolled_count, p.rating,
      p.status, p.delivery_mode, p.kind,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id) AS attendees
    FROM ecosystem_programs p
    WHERE p.id = ${id}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  // Get owners
  const owners = await db`
    SELECT pa.user_id, pa.role, u.name_ar
    FROM program_assignments pa
    JOIN users u ON u.id = pa.user_id
    WHERE pa.program_id = ${id}
    ORDER BY pa.role
  `;

  return NextResponse.json({
    ok: true,
    program: { ...rows[0], owners },
  });
}
