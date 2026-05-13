import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Allow any authenticated user with any tenant access
  const session = await import('@/lib/auth').then(m => m.getSession());
  if (!session.isLoggedIn) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get('q') || '').trim();
  const relationship = (searchParams.get('relationship') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = ['is_active = true'];
  const params: unknown[] = [];
  let pi = 1;

  if (q) {
    conditions.push(`(
      full_name_ar ILIKE $${pi} OR full_name_en ILIKE $${pi}
      OR primary_email ILIKE $${pi} OR organization_ar ILIKE $${pi}
      OR job_title_ar ILIKE $${pi} OR department_ar ILIKE $${pi}
    )`);
    params.push(`%${q}%`); pi++;
  }
  if (relationship) {
    conditions.push(`relationship_to_mohammed = $${pi}`);
    params.push(relationship); pi++;
  }

  const whereSql = `WHERE ${conditions.join(' AND ')}`;

  const totalRow = await db.unsafe<{ cnt: number }[]>(
    `SELECT COUNT(*)::int cnt FROM ecosystem_contacts ${whereSql}`,
    params as never[]
  );
  const total = totalRow[0]?.cnt || 0;

  const rows = await db.unsafe<Record<string, unknown>[]>(
    `SELECT mac_kg_id, full_name_ar, full_name_en, primary_email,
            organization_ar, organization_short, department_ar,
            job_title_ar, sector_label, relationship_to_mohammed,
            seniority_level, importance, last_synced_at
     FROM ecosystem_contacts ${whereSql}
     ORDER BY importance DESC NULLS LAST, seniority_level ASC NULLS LAST, full_name_ar
     LIMIT ${limit} OFFSET ${offset}`,
    params as never[]
  );

  // Facets for filters
  const facets = await db<{ relationship: string; cnt: number }[]>`
    SELECT relationship_to_mohammed AS relationship, COUNT(*)::int cnt
    FROM ecosystem_contacts WHERE is_active = true AND relationship_to_mohammed IS NOT NULL
    GROUP BY relationship_to_mohammed ORDER BY cnt DESC
  `;

  return NextResponse.json({
    ok: true, total, page, pages: Math.ceil(total / limit),
    rows, facets,
  });
}
