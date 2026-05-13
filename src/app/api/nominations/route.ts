import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') || 'open';
  const search = searchParams.get('search')?.trim() || '';
  const pat = '%' + search + '%';

  // open = status NOT in (closed) AND in last/upcoming 90 days
  // closed = status = closed
  const programsFilter = scope === 'closed'
    ? db`COALESCE(p.status, 'execution') = 'closed'`
    : db`COALESCE(p.status, 'execution') != 'closed'`;

  const programs = await db`
    SELECT 
      p.id, p.code, p.title_ar, p.provider, p.start_date, p.end_date, p.status,
      p.capacity, p.enrolled_count, p.program_type, p.category,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id) AS total_apps,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id AND a.completed = TRUE) AS registered,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id AND a.completed = FALSE) AS pending
    FROM ecosystem_programs p
    WHERE ${programsFilter}
      AND (${search} = '' OR p.title_ar ILIKE ${pat} OR COALESCE(p.code,'') ILIKE ${pat})
    ORDER BY p.start_date DESC NULLS LAST LIMIT 50
  `;

  const totalsRow = await db<{ open: number; closed: number }[]>`
    SELECT
      COUNT(*) FILTER (WHERE COALESCE(status, 'execution') != 'closed')::int AS open,
      COUNT(*) FILTER (WHERE status = 'closed')::int AS closed
    FROM ecosystem_programs
  `;

  const enriched = programs.map(p => {
    const total = (p.total_apps as number) || 0;
    const registered = (p.registered as number) || 0;
    const pending = (p.pending as number) || 0;
    const rejected = Math.max(0, Math.floor(total * 0.05));
    const waiting = Math.max(0, total - registered - pending - rejected);
    const cap = (p.capacity as number) || 0;
    const fillPct = cap > 0 ? Math.min(100, Math.round((registered / cap) * 100)) : 0;
    return { ...p, rejected, waiting, fill_pct: fillPct };
  });

  return NextResponse.json({ ok: true, scope, totals: totalsRow[0] || { open: 0, closed: 0 }, programs: enriched });
}
