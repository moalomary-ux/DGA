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
  const group = searchParams.get('group');
  const limit = Math.min(parseInt(searchParams.get('limit') || '300', 10), 1000);

  try {
    let rows;
    if (search) {
      const pat = `%${search}%`;
      rows = await db<any[]>`
        SELECT 
          l.id, l.name, l.title, l.email, l.phone, l.liaison_group,
          l.inbox_count, l.last_email_at,
          o.id AS org_id, o.name_ar AS org_name,
          o.sector AS org_sector, o.classification AS org_classification
        FROM qtech_liaisons l
        LEFT JOIN qtech_orgs o ON o.id = l.org_id
        WHERE l.is_active AND (
          l.name ILIKE ${pat} OR l.email ILIKE ${pat} OR l.title ILIKE ${pat} OR o.name_ar ILIKE ${pat}
        )
        ORDER BY l.inbox_count DESC, l.name
        LIMIT ${limit}
      `;
    } else if (sector) {
      rows = await db<any[]>`
        SELECT 
          l.id, l.name, l.title, l.email, l.phone, l.liaison_group,
          l.inbox_count, l.last_email_at,
          o.id AS org_id, o.name_ar AS org_name,
          o.sector AS org_sector, o.classification AS org_classification
        FROM qtech_liaisons l
        LEFT JOIN qtech_orgs o ON o.id = l.org_id
        WHERE l.is_active AND o.sector = ${sector}
        ORDER BY l.inbox_count DESC, l.name LIMIT ${limit}
      `;
    } else if (group) {
      rows = await db<any[]>`
        SELECT 
          l.id, l.name, l.title, l.email, l.phone, l.liaison_group,
          l.inbox_count, l.last_email_at,
          o.id AS org_id, o.name_ar AS org_name,
          o.sector AS org_sector, o.classification AS org_classification
        FROM qtech_liaisons l
        LEFT JOIN qtech_orgs o ON o.id = l.org_id
        WHERE l.is_active AND l.liaison_group = ${parseInt(group, 10)}
        ORDER BY o.name_ar, l.name LIMIT ${limit}
      `;
    } else {
      rows = await db<any[]>`
        SELECT 
          l.id, l.name, l.title, l.email, l.phone, l.liaison_group,
          l.inbox_count, l.last_email_at,
          o.id AS org_id, o.name_ar AS org_name,
          o.sector AS org_sector, o.classification AS org_classification
        FROM qtech_liaisons l
        LEFT JOIN qtech_orgs o ON o.id = l.org_id
        WHERE l.is_active
        ORDER BY l.inbox_count DESC, l.name LIMIT ${limit}
      `;
    }

    return NextResponse.json({ liaisons: rows, total: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
