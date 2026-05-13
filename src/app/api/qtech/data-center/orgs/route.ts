import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.trim() || '';
  const sector = searchParams.get('sector') || '';
  const classification = searchParams.get('classification') || '';
  const sortBy = searchParams.get('sort') || 'beneficiaries';
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

  try {
    let rows;
    
    if (search) {
      const pat = `%${search}%`;
      rows = await db<any[]>`
        SELECT 
          o.id, o.name_ar, o.sector, o.classification,
          o.total_quota_seats AS quota,
          o.total_beneficiaries_count AS beneficiaries,
          o.total_programs_count AS programs,
          ROUND(o.total_beneficiaries_count::numeric * 100 / NULLIF(o.total_quota_seats, 0), 1) AS utilization_pct,
          (SELECT COUNT(*) FROM qtech_liaisons WHERE org_id = o.id)::int AS liaisons_count
        FROM qtech_orgs o
        WHERE o.name_ar ILIKE ${pat}
        ORDER BY o.total_beneficiaries_count DESC NULLS LAST
        LIMIT ${limit}
      `;
    } else if (sector && classification) {
      rows = await db<any[]>`
        SELECT 
          o.id, o.name_ar, o.sector, o.classification,
          o.total_quota_seats AS quota,
          o.total_beneficiaries_count AS beneficiaries,
          o.total_programs_count AS programs,
          ROUND(o.total_beneficiaries_count::numeric * 100 / NULLIF(o.total_quota_seats, 0), 1) AS utilization_pct,
          (SELECT COUNT(*) FROM qtech_liaisons WHERE org_id = o.id)::int AS liaisons_count
        FROM qtech_orgs o
        WHERE o.sector = ${sector} AND o.classification = ${classification}
        ORDER BY o.total_beneficiaries_count DESC NULLS LAST
        LIMIT ${limit}
      `;
    } else if (sector) {
      rows = await db<any[]>`
        SELECT 
          o.id, o.name_ar, o.sector, o.classification,
          o.total_quota_seats AS quota,
          o.total_beneficiaries_count AS beneficiaries,
          o.total_programs_count AS programs,
          ROUND(o.total_beneficiaries_count::numeric * 100 / NULLIF(o.total_quota_seats, 0), 1) AS utilization_pct,
          (SELECT COUNT(*) FROM qtech_liaisons WHERE org_id = o.id)::int AS liaisons_count
        FROM qtech_orgs o WHERE o.sector = ${sector}
        ORDER BY o.total_beneficiaries_count DESC NULLS LAST
        LIMIT ${limit}
      `;
    } else if (classification) {
      rows = await db<any[]>`
        SELECT 
          o.id, o.name_ar, o.sector, o.classification,
          o.total_quota_seats AS quota,
          o.total_beneficiaries_count AS beneficiaries,
          o.total_programs_count AS programs,
          ROUND(o.total_beneficiaries_count::numeric * 100 / NULLIF(o.total_quota_seats, 0), 1) AS utilization_pct,
          (SELECT COUNT(*) FROM qtech_liaisons WHERE org_id = o.id)::int AS liaisons_count
        FROM qtech_orgs o WHERE o.classification = ${classification}
        ORDER BY o.total_beneficiaries_count DESC NULLS LAST
        LIMIT ${limit}
      `;
    } else {
      rows = await db<any[]>`
        SELECT 
          o.id, o.name_ar, o.sector, o.classification,
          o.total_quota_seats AS quota,
          o.total_beneficiaries_count AS beneficiaries,
          o.total_programs_count AS programs,
          ROUND(o.total_beneficiaries_count::numeric * 100 / NULLIF(o.total_quota_seats, 0), 1) AS utilization_pct,
          (SELECT COUNT(*) FROM qtech_liaisons WHERE org_id = o.id)::int AS liaisons_count
        FROM qtech_orgs o
        ORDER BY o.total_beneficiaries_count DESC NULLS LAST
        LIMIT ${limit}
      `;
    }

    const sectors = await db<any[]>`
      SELECT DISTINCT sector FROM qtech_orgs 
      WHERE sector IS NOT NULL ORDER BY sector
    `;
    const classifications = await db<any[]>`
      SELECT DISTINCT classification FROM qtech_orgs 
      WHERE classification IS NOT NULL ORDER BY classification
    `;

    return NextResponse.json({
      orgs: rows,
      filters: {
        sectors: sectors.map(s => s.sector),
        classifications: classifications.map(c => c.classification),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
