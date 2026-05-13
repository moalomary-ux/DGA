import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const sector = searchParams.get('sector')?.trim() || '';
  const orgType = searchParams.get('type')?.trim() || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');
  const searchPattern = '%' + search + '%';

  // postgres.js: نستخدم شروط conditional داخل SQL مباشرة (لا composition)
  const rows = await db`
    SELECT 
      o.id, o.name_ar, o.name_en, o.short_name, o.org_type, o.sector,
      o.classification, o.is_internal,
      (SELECT COUNT(*)::int FROM ecosystem_contacts c WHERE c.organization_id = o.id) AS people_count,
      (SELECT COUNT(*)::int FROM ecosystem_contacts c WHERE c.organization_id = o.id AND c.role_category = 'liaison_officer') AS liaison_count,
      (SELECT numeric_value FROM ecosystem_org_metrics m 
        WHERE m.organization_id = o.id AND m.metric_type = 'qiyas' AND m.year = 2024 
        ORDER BY numeric_value DESC LIMIT 1) AS qiyas_score
    FROM ecosystem_organizations o
    WHERE (${search} = '' OR o.name_ar ILIKE ${searchPattern} 
                          OR o.name_en ILIKE ${searchPattern} 
                          OR COALESCE(o.short_name,'') ILIKE ${searchPattern})
      AND (${sector} = '' OR o.sector = ${sector})
      AND (${orgType} = '' OR o.org_type = ${orgType})
    ORDER BY 
      qiyas_score DESC NULLS LAST,
      people_count DESC,
      o.name_ar
    LIMIT ${limit} OFFSET ${offset}
  `;

  const totalRow = await db<{ total: number }[]>`
    SELECT COUNT(*)::int AS total 
    FROM ecosystem_organizations o
    WHERE (${search} = '' OR o.name_ar ILIKE ${searchPattern} 
                          OR o.name_en ILIKE ${searchPattern} 
                          OR COALESCE(o.short_name,'') ILIKE ${searchPattern})
      AND (${sector} = '' OR o.sector = ${sector})
      AND (${orgType} = '' OR o.org_type = ${orgType})
  `;

  const sectors = await db<{ sector: string }[]>`
    SELECT DISTINCT sector FROM ecosystem_organizations 
    WHERE sector IS NOT NULL ORDER BY sector
  `;
  const types = await db<{ org_type: string }[]>`
    SELECT DISTINCT org_type FROM ecosystem_organizations 
    WHERE org_type IS NOT NULL ORDER BY org_type
  `;

  return NextResponse.json({
    ok: true,
    rows,
    total: totalRow[0]?.total || 0,
    limit, offset,
    facets: {
      sectors: sectors.map(s => s.sector),
      types: types.map(t => t.org_type),
    },
  });
}
