import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ════════════════════════════════════════════════════════════════
// Probe schema once
// ════════════════════════════════════════════════════════════════
let _benefCols: Set<string> | null = null;

async function getBenefColumns(): Promise<Set<string>> {
  if (_benefCols) return _benefCols;
  const cols = await db<any[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'qtech_beneficiaries' AND table_schema = 'public'
  `;
  _benefCols = new Set(cols.map((c) => c.column_name));
  return _benefCols;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  try {
    const [org] = await db<any[]>`
      SELECT 
        o.*,
        ROUND(o.total_beneficiaries_count::numeric * 100 / NULLIF(o.total_quota_seats, 0), 1) AS utilization_pct,
        CASE
          WHEN o.last_email_date > NOW() - INTERVAL '30 days' THEN 'active'
          WHEN o.last_email_date > NOW() - INTERVAL '90 days' THEN 'moderate'
          WHEN o.last_email_date IS NOT NULL THEN 'inactive'
          ELSE 'unknown'
        END AS engagement_status
      FROM qtech_orgs o WHERE o.id = ${id}
    `;
    if (!org) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const liaisons = await db<any[]>`
      SELECT id, name, title, email, phone, liaison_group, inbox_count, last_email_at
      FROM qtech_liaisons WHERE org_id = ${id} AND is_active
      ORDER BY inbox_count DESC NULLS LAST, name
    `;

    const programs = await db<any[]>`
      SELECT 
        p.id, p.title, p.type, p.year, p.country, p.start_date, p.end_date,
        p.seats, p.duration_hours,
        COUNT(b.id)::int AS attended_count,
        CASE
          WHEN p.end_date < NOW()::date THEN 'completed'
          WHEN p.start_date <= NOW()::date AND p.end_date >= NOW()::date THEN 'ongoing'
          WHEN p.start_date > NOW()::date THEN 'upcoming'
          ELSE 'unknown'
        END AS status_timeline
      FROM qtech_programs p
      INNER JOIN qtech_beneficiaries b ON b.program_id = p.id AND b.org_id = ${id}
      GROUP BY p.id
      ORDER BY p.year DESC NULLS LAST, p.start_date DESC NULLS LAST
    `;

    const lastProgramResults = await db<any[]>`
      SELECT 
        p.id, p.title, p.type, p.year, p.start_date, p.end_date, p.country,
        COUNT(b.id)::int AS attended_count
      FROM qtech_programs p
      INNER JOIN qtech_beneficiaries b ON b.program_id = p.id AND b.org_id = ${id}
      GROUP BY p.id
      ORDER BY p.end_date DESC NULLS LAST, p.start_date DESC NULLS LAST
      LIMIT 1
    `;
    const lastProgram = lastProgramResults[0] || null;

    const beneficiariesByYear = await db<any[]>`
      SELECT year::int AS year, COUNT(*)::int AS count
      FROM qtech_beneficiaries
      WHERE org_id = ${id} AND year IS NOT NULL
      GROUP BY year ORDER BY year ASC
    `;

    const beneficiaries = await db<any[]>`
      SELECT 
        b.id, b.name, b.job_title, b.email, b.phone, b.gender,
        b.target_level, b.year, b.country,
        p.title AS program_title, p.type AS program_type, p.id AS program_id
      FROM qtech_beneficiaries b
      LEFT JOIN qtech_programs p ON p.id = b.program_id
      WHERE b.org_id = ${id}
      ORDER BY b.year DESC NULLS LAST
      LIMIT 200
    `;

    // ── Top Performers — defensive (يعمل بدون email_lower) ──
    const cols = await getBenefColumns();
    const emailField = cols.has('email_lower') ? 'b.email_lower' : 'LOWER(b.email)';
    
    let topPerformers: any[] = [];
    try {
      const sql = `
        SELECT 
          ${emailField} AS email,
          MAX(b.name) AS name,
          MAX(b.job_title) AS job_title,
          COUNT(*)::int AS programs_count,
          STRING_AGG(DISTINCT b.target_level, ', ') AS levels
        FROM qtech_beneficiaries b
        WHERE b.org_id = $1 AND b.email IS NOT NULL AND b.email <> ''
        GROUP BY ${emailField}
        HAVING COUNT(*) >= 2
        ORDER BY programs_count DESC
        LIMIT 10
      `;
      topPerformers = await db.unsafe(sql, [id]);
    } catch (e: any) {
      console.error('[top_performers]', e.message);
      topPerformers = [];
    }

    const targetLevelBreakdown = await db<any[]>`
      SELECT target_level, COUNT(*)::int AS count
      FROM qtech_beneficiaries WHERE org_id = ${id} AND target_level IS NOT NULL
      GROUP BY target_level ORDER BY count DESC
    `;

    const recentEmails = await db<any[]>`
      SELECT 
        qi.id, qi.subject, qi.received_at, qi.status,
        l.name AS liaison_name
      FROM qtech_inbound qi
      INNER JOIN qtech_liaisons l ON l.id = qi.liaison_id
      WHERE l.org_id = ${id}
      ORDER BY qi.received_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      org,
      liaisons,
      programs,
      lastProgram,
      beneficiaries,
      beneficiariesByYear,
      targetLevelBreakdown,
      topPerformers,
      recentEmails,
    });
  } catch (e: any) {
    console.error('[org-detail]', e.message, e.stack);
    return NextResponse.json({
      error: 'db_error',
      detail: e.message?.substring(0, 400),
    }, { status: 500 });
  }
}
