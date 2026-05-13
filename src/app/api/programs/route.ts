import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || 'all';
  const kind   = searchParams.get('kind')   || 'all';
  const year   = searchParams.get('year')   || 'all';
  const month  = searchParams.get('month')  || 'all';
  const limit  = Math.min(200, Number(searchParams.get('limit') || 60));
  const pat    = '%' + search + '%';

  // Counts per status & per kind & per year (for chips)
  const statusCounts = await db<{ status: string; cnt: number }[]>`
    SELECT COALESCE(status, 'execution') AS status, COUNT(*)::int AS cnt
    FROM ecosystem_programs GROUP BY status
  `;
  const kindCounts = await db<{ program_type: string; cnt: number }[]>`
    SELECT COALESCE(program_type, 'local') AS program_type, COUNT(*)::int AS cnt
    FROM ecosystem_programs GROUP BY program_type
  `;
  const yearCounts = await db<{ yr: number; cnt: number }[]>`
    SELECT EXTRACT(YEAR FROM start_date)::int AS yr, COUNT(*)::int AS cnt
    FROM ecosystem_programs WHERE start_date IS NOT NULL
    GROUP BY yr ORDER BY yr DESC
  `;
  const totalCount = (await db<{ cnt: number }[]>`SELECT COUNT(*)::int AS cnt FROM ecosystem_programs`)[0]?.cnt || 0;

  // Filtered list with year/month support
  const programs = await db`
    SELECT 
      p.id, p.code, p.title_ar, p.title_en, p.provider, p.status, p.program_type, p.category,
      p.start_date, p.end_date, p.capacity, p.enrolled_count, p.rating, p.delivery_mode,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id) AS attendees
    FROM ecosystem_programs p
    WHERE 
      (${search} = '' OR p.title_ar ILIKE ${pat} OR COALESCE(p.title_en,'') ILIKE ${pat} OR COALESCE(p.code,'') ILIKE ${pat} OR COALESCE(p.provider,'') ILIKE ${pat})
      AND (${status} = 'all' OR COALESCE(p.status, 'execution') = ${status})
      AND (${kind} = 'all' OR COALESCE(p.program_type, 'local') = ${kind})
      AND (${year} = 'all' OR EXTRACT(YEAR FROM p.start_date)::text = ${year})
      AND (${month} = 'all' OR EXTRACT(MONTH FROM p.start_date)::text = ${month})
    ORDER BY 
      CASE WHEN p.start_date >= CURRENT_DATE THEN 0 ELSE 1 END,
      p.start_date DESC NULLS LAST,
      attendees DESC
    LIMIT ${limit}
  `;

  return NextResponse.json({
    ok: true,
    total: totalCount,
    counts: {
      status: Object.fromEntries(statusCounts.map(r => [r.status, r.cnt])),
      kind: Object.fromEntries(kindCounts.map(r => [r.program_type, r.cnt])),
      years: yearCounts,
    },
    programs,
  });
}
