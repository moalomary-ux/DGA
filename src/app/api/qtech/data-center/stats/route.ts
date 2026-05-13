import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const [stats] = await db<any[]>`
      SELECT 
        (SELECT COUNT(*) FROM qtech_orgs WHERE is_active) AS orgs_total,
        (SELECT COUNT(*) FROM qtech_orgs WHERE total_beneficiaries_count > 0) AS orgs_active,
        (SELECT COUNT(*) FROM qtech_liaisons WHERE is_active) AS liaisons_total,
        (SELECT COUNT(*) FROM qtech_liaisons WHERE org_id IS NOT NULL) AS liaisons_linked,
        (SELECT COUNT(*) FROM qtech_programs) AS programs_total,
        (SELECT COUNT(*) FROM qtech_programs WHERE is_high_impact) AS programs_online,
        (SELECT COUNT(*) FROM qtech_programs WHERE year = 2026) AS programs_this_year,
        (SELECT COUNT(*) FROM qtech_beneficiaries) AS beneficiaries_total,
        (SELECT COUNT(DISTINCT email_lower) FROM qtech_beneficiaries WHERE email_lower IS NOT NULL) AS beneficiaries_unique_emails,
        (SELECT SUM(seats) FROM qtech_programs) AS total_seats,
        (SELECT SUM(total_quota_seats) FROM qtech_orgs) AS total_quota_seats,
        (SELECT SUM(total_cost) FROM qtech_programs WHERE total_cost IS NOT NULL) AS total_cost_sar
    `;

    const sectors = await db<any[]>`
      SELECT 
        o.sector,
        COUNT(DISTINCT o.id)::int AS orgs,
        COUNT(b.id)::int AS beneficiaries,
        COUNT(DISTINCT b.program_id)::int AS programs
      FROM qtech_orgs o
      LEFT JOIN qtech_beneficiaries b ON b.org_id = o.id
      WHERE o.sector IS NOT NULL
      GROUP BY o.sector
      ORDER BY beneficiaries DESC NULLS LAST
      LIMIT 10
    `;

    const yearTrend = await db<any[]>`
      SELECT 
        year::int AS year,
        COUNT(*)::int AS programs,
        SUM(seats)::int AS seats,
        COUNT(DISTINCT (SELECT b.id FROM qtech_beneficiaries b WHERE b.program_id = p.id LIMIT 1))::int AS hasBenef
      FROM qtech_programs p
      WHERE year IS NOT NULL
      GROUP BY year
      ORDER BY year ASC
    `;

    const beneficiariesByYear = await db<any[]>`
      SELECT 
        year::int AS year,
        COUNT(*)::int AS count
      FROM qtech_beneficiaries
      WHERE year IS NOT NULL
      GROUP BY year ORDER BY year ASC
    `;

    const topOrgs = await db<any[]>`
      SELECT 
        o.id, o.name_ar, o.sector, o.classification,
        o.total_quota_seats AS quota,
        o.total_beneficiaries_count AS beneficiaries,
        ROUND(o.total_beneficiaries_count::numeric * 100 / NULLIF(o.total_quota_seats, 0), 1) AS utilization_pct
      FROM qtech_orgs o
      WHERE o.total_beneficiaries_count > 0
      ORDER BY o.total_beneficiaries_count DESC
      LIMIT 10
    `;

    const classifications = await db<any[]>`
      SELECT classification, COUNT(*)::int AS count
      FROM qtech_orgs
      WHERE classification IS NOT NULL
      GROUP BY classification ORDER BY count DESC
    `;

    const targetLevels = await db<any[]>`
      SELECT target_level, COUNT(*)::int AS count
      FROM qtech_beneficiaries
      WHERE target_level IS NOT NULL
      GROUP BY target_level ORDER BY count DESC
    `;

    return NextResponse.json({
      stats,
      sectors,
      yearTrend,
      beneficiariesByYear,
      topOrgs,
      classifications,
      targetLevels,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
