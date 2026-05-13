import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  try {
    const [program] = await db<any[]>`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS actual_beneficiaries,
        (SELECT COUNT(DISTINCT org_id) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS orgs_served,
        CASE
          WHEN p.end_date < NOW()::date THEN 'completed'
          WHEN p.start_date <= NOW()::date AND p.end_date >= NOW()::date THEN 'ongoing'
          WHEN p.start_date > NOW()::date THEN 'upcoming'
          ELSE 'unknown'
        END AS status_timeline,
        CASE
          WHEN p.end_date IS NOT NULL AND p.start_date IS NOT NULL
          THEN (p.end_date - p.start_date + 1)
          ELSE NULL
        END AS duration_days
      FROM qtech_programs p WHERE p.id = ${id}
    `;
    if (!program) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const orgs = await db<any[]>`
      SELECT 
        o.id, o.name_ar, o.sector, o.classification,
        COUNT(b.id)::int AS beneficiaries_count
      FROM qtech_beneficiaries b
      INNER JOIN qtech_orgs o ON o.id = b.org_id
      WHERE b.program_id = ${id}
      GROUP BY o.id, o.name_ar, o.sector, o.classification
      ORDER BY beneficiaries_count DESC
    `;

    const beneficiaries = await db<any[]>`
      SELECT 
        b.id, b.name, b.job_title, b.email, b.phone, b.gender,
        b.target_level, b.year,
        o.name_ar AS org_name, o.sector AS org_sector
      FROM qtech_beneficiaries b
      LEFT JOIN qtech_orgs o ON o.id = b.org_id
      WHERE b.program_id = ${id}
      ORDER BY o.name_ar, b.name
    `;

    const targetLevels = await db<any[]>`
      SELECT target_level, COUNT(*)::int AS count
      FROM qtech_beneficiaries
      WHERE program_id = ${id} AND target_level IS NOT NULL
      GROUP BY target_level ORDER BY count DESC
    `;

    const sectorBreakdown = await db<any[]>`
      SELECT o.sector, COUNT(b.id)::int AS count
      FROM qtech_beneficiaries b
      LEFT JOIN qtech_orgs o ON o.id = b.org_id
      WHERE b.program_id = ${id} AND o.sector IS NOT NULL
      GROUP BY o.sector ORDER BY count DESC LIMIT 8
    `;

    return NextResponse.json({
      program,
      orgs,
      beneficiaries,
      targetLevels,
      sectorBreakdown,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
